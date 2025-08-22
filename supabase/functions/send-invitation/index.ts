import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  documentId: string;
  email: string;
  role: 'owner' | 'editor' | 'commenter' | 'viewer';
  message?: string;
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

    const { documentId, email, role, message }: InvitationRequest = await req.json();

    console.log("Processing invitation:", { documentId, email, role, invitedBy: user.id });

    // Verify user has permission to invite others to this document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, title, user_id')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (docError || !document) {
      throw new Error("Document not found or no permission to invite");
    }

    // Get inviter profile
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .single();

    const inviterName = inviterProfile?.display_name || user.email || 'Someone';

    // Check if invitation already exists
    const { data: existingInvite } = await supabase
      .from('document_invitations')
      .select('id')
      .eq('document_id', documentId)
      .eq('email', email)
      .single();

    let invitation;
    
    if (existingInvite) {
      // Update existing invitation
      const { data: updatedInvite, error: updateError } = await supabase
        .from('document_invitations')
        .update({
          role,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          token: crypto.randomUUID()
        })
        .eq('id', existingInvite.id)
        .select()
        .single();

      if (updateError) throw updateError;
      invitation = updatedInvite;
    } else {
      // Create new invitation
      const { data: newInvite, error: inviteError } = await supabase
        .from('document_invitations')
        .insert({
          document_id: documentId,
          email,
          invited_by_user_id: user.id,
          role
        })
        .select()
        .single();

      if (inviteError) throw inviteError;
      invitation = newInvite;
    }

    // Create invitation link
    const inviteUrl = `${req.headers.get('origin') || 'https://your-app.com'}/invite/${invitation.token}`;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Document Collaboration <invitations@resend.dev>",
      to: [email],
      subject: `${inviterName} invited you to collaborate on "${document.title}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">You've been invited to collaborate!</h1>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>${inviterName}</strong> has invited you to collaborate on:</p>
            <h2 style="color: #2563eb; margin: 10px 0;">${document.title}</h2>
            <p>Role: <strong style="text-transform: capitalize;">${role}</strong></p>
            ${message ? `<p><em>"${message}"</em></p>` : ''}
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Accept Invitation
            </a>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>Role Permissions:</strong></p>
            <ul style="margin: 10px 0; color: #856404;">
              ${role === 'viewer' ? '<li>View document content</li>' : ''}
              ${role === 'commenter' ? '<li>View and comment on document</li>' : ''}
              ${role === 'editor' ? '<li>View, comment, and edit document</li>' : ''}
              ${role === 'owner' ? '<li>Full access including sharing and deletion</li>' : ''}
            </ul>
          </div>

          <p style="color: #666; font-size: 14px; text-align: center;">
            This invitation expires in 7 days. If you don't have an account, you'll be prompted to create one.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log activity
    await supabase.rpc('log_document_activity', {
      _document_id: documentId,
      _user_id: user.id,
      _activity_type: 'invitation_sent',
      _description: `Invited ${email} as ${role}`,
      _metadata: { email, role, invitation_id: invitation.id }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitationId: invitation.id,
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
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