import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Analytics event emitter
const emitAnalyticsEvent = async (eventName: string, payload: any, supabase: any) => {
  try {
    // In a real implementation, this would send to an analytics service
    console.log(`Analytics Event: ${eventName}`, payload)
    
    // For now, we'll log to a hypothetical analytics table
    // You can replace this with your preferred analytics service (Mixpanel, Segment, etc.)
    
    return true
  } catch (error) {
    console.error('Failed to emit analytics event:', error)
    return false
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse request body
    const body = await req.json()
    const { templateIds, workspaceId } = body as { templateIds: string[], workspaceId: string }

    if (!templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Template IDs array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!workspaceId) {
      return new Response(JSON.stringify({ error: 'Workspace ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Publishing ${templateIds.length} templates for workspace ${workspaceId}`)

    // Verify user has admin access to workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userData.user.id)
      .single()

    if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
      return new Response(JSON.stringify({ error: 'Admin access required to publish templates' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get templates to publish
    const { data: templates, error: templatesError } = await supabase
      .from('templates')
      .select('*')
      .in('id', templateIds)
      .eq('workspace_id', workspaceId)

    if (templatesError) {
      console.error('Templates fetch error:', templatesError)
      return new Response(JSON.stringify({ error: 'Failed to fetch templates', details: templatesError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!templates || templates.length === 0) {
      return new Response(JSON.stringify({ error: 'No templates found to publish' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const publishedTemplates = []
    const analyticsEvents = []

    // Process each template
    for (const template of templates) {
      try {
        // Extract facets from metadata
        const facets = template.metadata?.facets || {
          docType: template.category || 'unknown',
          stylePack: 'default',
          industry: 'general'
        }

        // Update template status and ensure facets are in metadata
        const { data: updatedTemplate, error: updateError } = await supabase
          .from('templates')
          .update({
            status: 'published',
            metadata: {
              ...template.metadata,
              facets,
              publishedAt: new Date().toISOString(),
              publishedBy: userData.user.id
            },
            is_global: true, // Published templates become globally accessible
            updated_at: new Date().toISOString()
          })
          .eq('id', template.id)
          .eq('workspace_id', workspaceId)
          .select()
          .single()

        if (updateError) {
          console.error(`Failed to publish template ${template.id}:`, updateError)
          continue
        }

        publishedTemplates.push({
          id: template.id,
          name: template.name,
          facets
        })

        // Prepare analytics event for when template gets opened (we'll emit this later)
        analyticsEvents.push({
          event: 'template_published',
          payload: {
            templateId: template.id,
            facets,
            workspaceId,
            publishedBy: userData.user.id,
            timestamp: new Date().toISOString()
          }
        })

        console.log(`Successfully published template ${template.id} with facets:`, facets)

      } catch (error) {
        console.error(`Error publishing template ${template.id}:`, error)
        continue
      }
    }

    // Emit analytics events
    for (const event of analyticsEvents) {
      await emitAnalyticsEvent(event.event, event.payload, supabase)
    }

    console.log(`Successfully published ${publishedTemplates.length} templates`)

    return new Response(JSON.stringify({
      success: true,
      publishedCount: publishedTemplates.length,
      published: publishedTemplates,
      message: `Successfully published ${publishedTemplates.length} template(s)`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in templates-publish:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})