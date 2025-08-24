import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get invitation with workspace info
    const { data: invitation, error } = await supabaseClient
      .from('workspace_invitations')
      .select(`
        *,
        workspaces:workspace_id (
          name
        )
      `)
      .eq('token', token)
      .is('accepted_at', null)
      .single();

    if (error || !invitation) {
      return new Response(
        JSON.stringify({ error: 'Invitation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format response
    const invitationData = {
      id: invitation.id,
      workspace_id: invitation.workspace_id,
      email: invitation.email,
      role: invitation.role,
      created_at: invitation.created_at,
      expires_at: invitation.expires_at,
      workspace: {
        name: invitation.workspaces?.name || 'Unknown Workspace'
      }
    };

    return new Response(
      JSON.stringify({ invitation: invitationData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});