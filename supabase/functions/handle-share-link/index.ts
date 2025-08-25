import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShareLinkRequest {
  token: string;
  password?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, password }: ShareLinkRequest = await req.json();
    const clientInfo = req.headers.get("x-client-info") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ipAddress = forwardedFor?.split(',')[0] || realIp || "unknown";

    console.log("Accessing share link:", { hasPassword: !!password });

    // Get share link details
    const { data: shareLink, error: linkError } = await supabase
      .from('share_links')
      .select(`
        *,
        document:documents(id, title, content, user_id)
      `)
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (linkError || !shareLink) {
      return new Response(
        JSON.stringify({ error: "Share link not found or expired" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if link has expired
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Share link has expired" }),
        {
          status: 410,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check view limits
    if (shareLink.max_views && shareLink.view_count >= shareLink.max_views) {
      return new Response(
        JSON.stringify({ error: "Share link has reached maximum views" }),
        {
          status: 410,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check password if required
    if (shareLink.password_hash) {
      if (!password) {
        return new Response(
          JSON.stringify({ 
            error: "Password required",
            requiresPassword: true 
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      const isValidPassword = await bcrypt.compare(password, shareLink.password_hash);
      if (!isValidPassword) {
        return new Response(
          JSON.stringify({ error: "Invalid password" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // Increment view count
    await supabase
      .from('share_links')
      .update({ view_count: shareLink.view_count + 1 })
      .eq('id', shareLink.id);

    // Log activity
    await supabase.rpc('log_document_activity', {
      _document_id: shareLink.document.id,
      _user_id: null,
      _activity_type: 'share_link_accessed',
      _description: `Document accessed via share link`,
      _metadata: { 
        share_link_id: shareLink.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        client_info: clientInfo
      }
    });

    // Prepare document data with watermark if specified
    let documentContent = shareLink.document.content;
    if (shareLink.watermark_text && shareLink.role === 'viewer') {
      // Apply watermark to document content
      documentContent = {
        ...documentContent,
        watermark: shareLink.watermark_text
      };
    }

    const response = {
      document: {
        id: shareLink.document.id,
        title: shareLink.document.title,
        content: documentContent
      },
      permissions: {
        role: shareLink.role,
        canDownload: shareLink.allow_download,
        hasWatermark: !!shareLink.watermark_text
      },
      linkInfo: {
        viewCount: shareLink.view_count + 1,
        maxViews: shareLink.max_views,
        expiresAt: shareLink.expires_at
      }
    };

    console.log("Share link access successful:", { 
      documentId: shareLink.document.id,
      role: shareLink.role,
      viewCount: shareLink.view_count + 1
    });

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in handle-share-link function:", error);
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