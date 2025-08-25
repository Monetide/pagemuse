import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const appOrigin = Deno.env.get("APP_ORIGIN") || "https://pagemuse.ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": appOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PublishRequest {
  documentId: string;
  metadata?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Invalid authentication");
    }

    const { documentId, metadata }: PublishRequest = await req.json();

    console.log("Publishing document:", { documentId, userId: user.id });

    // Get document and verify ownership
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (docError || !document) {
      throw new Error("Document not found or no permission to publish");
    }

    // Mark any existing published version as not current
    await supabase
      .from('published_documents')
      .update({ is_current: false })
      .eq('document_id', documentId);

    // Get next version number
    const { data: existingVersions } = await supabase
      .from('published_documents')
      .select('version_number')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersion = existingVersions && existingVersions.length > 0 
      ? existingVersions[0].version_number + 1 
      : 1;

    // Create published version
    const { data: publishedDoc, error: publishError } = await supabase
      .from('published_documents')
      .insert({
        document_id: documentId,
        published_by_user_id: user.id,
        version_number: nextVersion,
        title: document.title,
        content: document.content,
        metadata: {
          publishedAt: new Date().toISOString(),
          originalUpdatedAt: document.updated_at,
          ...metadata
        }
      })
      .select()
      .single();

    if (publishError) {
      throw publishError;
    }

    // Create public URL
    const publicUrl = `${appOrigin}/published/${publishedDoc.public_url_token}`;

    // Log activity
    await supabase.rpc('log_document_activity', {
      _document_id: documentId,
      _user_id: user.id,
      _activity_type: 'document_published',
      _description: `Document published as version ${nextVersion}`,
      _metadata: { 
        version_number: nextVersion,
        published_document_id: publishedDoc.id,
        public_url: publicUrl
      }
    });

    console.log("Document published successfully:", {
      publishedDocId: publishedDoc.id,
      version: nextVersion,
      publicUrl
    });

    return new Response(
      JSON.stringify({
        success: true,
        publishedDocument: {
          id: publishedDoc.id,
          version: nextVersion,
          publicUrl,
          publishedAt: publishedDoc.published_at
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in publish-document function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);