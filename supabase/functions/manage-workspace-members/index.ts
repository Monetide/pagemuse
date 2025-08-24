import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const workspaceId = url.searchParams.get('workspaceId');

    if (!workspaceId) {
      return new Response(
        JSON.stringify({ error: 'Workspace ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is workspace admin/owner
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin/owner of the workspace
    const { data: membership, error: memberError } = await supabaseClient
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership || !['owner', 'admin'].includes(membership.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      // Get workspace members and pending invitations
      const { data: members, error: membersError } = await supabaseClient
        .from('workspace_members')
        .select(`
          id,
          role,
          created_at,
          user_id,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('workspace_id', workspaceId);

      const { data: invitations, error: invitationsError } = await supabaseClient
        .from('workspace_invitations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());

      if (membersError || invitationsError) {
        console.error('Error fetching data:', membersError || invitationsError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch workspace data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ members, invitations }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const { email, role = 'member' } = await req.json();

      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is already a member
      const { data: existingMember } = await supabaseClient
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('profiles.email', email)
        .limit(1);

      if (existingMember && existingMember.length > 0) {
        return new Response(
          JSON.stringify({ error: 'User is already a member of this workspace' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check for existing pending invitation
      const { data: existingInvite } = await supabaseClient
        .from('workspace_invitations')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('email', email)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .limit(1);

      if (existingInvite && existingInvite.length > 0) {
        return new Response(
          JSON.stringify({ error: 'An invitation is already pending for this email' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get workspace details for email
      const { data: workspace } = await supabaseClient
        .from('workspaces')
        .select('name')
        .eq('id', workspaceId)
        .single();

      // Create invitation
      const { data: invitation, error: inviteError } = await supabaseClient
        .from('workspace_invitations')
        .insert({
          workspace_id: workspaceId,
          email,
          role,
          invited_by_user_id: user.id
        })
        .select()
        .single();

      if (inviteError) {
        console.error('Error creating invitation:', inviteError);
        return new Response(
          JSON.stringify({ error: 'Failed to create invitation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send invitation email
      try {
        const inviteUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/invite?token=${invitation.token}`;
        
        await resend.emails.send({
          from: 'PageMuse <noreply@pagemuse.ai>',
          to: [email],
          subject: `You're invited to join ${workspace?.name || 'a workspace'} on PageMuse`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1>You're invited to join ${workspace?.name || 'a workspace'}</h1>
              <p>You've been invited to join the workspace "${workspace?.name}" on PageMuse with the role of ${role}.</p>
              <p><a href="${inviteUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a></p>
              <p>This invitation will expire in 7 days.</p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Continue anyway - invitation is created
      }

      return new Response(
        JSON.stringify({ message: 'Invitation sent successfully', invitation }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'PATCH') {
      const { memberId, role } = await req.json();

      if (!memberId || !role) {
        return new Response(
          JSON.stringify({ error: 'Member ID and role are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabaseClient
        .from('workspace_members')
        .update({ role })
        .eq('id', memberId)
        .eq('workspace_id', workspaceId);

      if (error) {
        console.error('Error updating member role:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update member role' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ message: 'Member role updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'DELETE') {
      const { memberId } = await req.json();

      if (!memberId) {
        return new Response(
          JSON.stringify({ error: 'Member ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabaseClient
        .from('workspace_members')
        .delete()
        .eq('id', memberId)
        .eq('workspace_id', workspaceId);

      if (error) {
        console.error('Error removing member:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to remove member' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ message: 'Member removed successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});