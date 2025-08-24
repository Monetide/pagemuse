import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      // Get workspace members
      const { data: members, error } = await supabaseClient
        .from('workspace_members')
        .select(`
          id,
          role,
          created_at,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('workspace_id', workspaceId);

      if (error) {
        console.error('Error fetching members:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch members' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ members }),
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

      // TODO: Implement member invitation logic
      // This would typically involve:
      // 1. Creating an invitation record
      // 2. Sending an invitation email
      // 3. Handling the invitation acceptance flow

      return new Response(
        JSON.stringify({ message: 'Invitation functionality coming soon' }),
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