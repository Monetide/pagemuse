import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get user from token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error('User authentication error:', userError)
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { templateId, title, workspaceId } = await req.json()

    if (!templateId || !workspaceId) {
      return new Response('Template ID and Workspace ID required', { status: 400, headers: corsHeaders })
    }

    console.log('Creating document from template:', { templateId, workspaceId, userId: user.id })

    // Verify workspace membership
    const { data: membership, error: membershipError } = await supabaseClient
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      console.error('Workspace membership error:', membershipError)
      return new Response('Access denied', { status: 403, headers: corsHeaders })
    }

    // Fetch template data
    const { data: template, error: templateError } = await supabaseClient
      .from('templates')
      .select(`
        id, name, description, category, global_styling, metadata,
        template_pages (
          id, name, page_index, content_scaffold, page_styling, layout_config
        )
      `)
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      console.error('Template fetch error:', templateError)
      return new Response('Template not found', { status: 404, headers: corsHeaders })
    }

    // Get workspace's default brand kit
    const { data: brandKit } = await supabaseClient
      .from('brand_kits')
      .select('id, name, palette, neutrals, fonts, logo_primary_url, logo_alt_url')
      .eq('workspace_id', workspaceId)
      .limit(1)
      .maybeSingle()

    // Create proper document structure using the expected SemanticDocument interface
    const documentContent = {
      id: crypto.randomUUID(),
      title: title || `Document from ${template.name}`,
      sections: [{
        id: crypto.randomUUID(),
        name: 'Main Content',
        description: template.description,
        flows: [{
          id: crypto.randomUUID(),
          name: 'Main',
          blocks: [{
            id: crypto.randomUUID(),
            type: 'heading',
            content: {
              level: 1,
              text: title || template.name || 'Document Title'
            },
            order: 0,
            paginationRules: {
              keepWithNext: true,
              breakAvoid: true
            }
          }, {
            id: crypto.randomUUID(),
            type: 'paragraph',
            content: {
              text: template.description || 'Document created from template'
            },
            order: 1,
            paginationRules: {}
          }],
          type: 'linear',
          order: 0
        }],
        pageMaster: {
          pageSize: 'Letter',
          orientation: 'portrait',
          margins: {
            top: 1,
            right: 1,
            bottom: 1,
            left: 1
          },
          columns: 1,
          columnGap: 0.25,
          hasHeader: false,
          hasFooter: false,
          baselineGrid: false,
          gridSpacing: 0.125,
          allowTableRotation: false
        },
        layoutIntent: 'body',
        order: 0,
        footnotes: [],
        useEndnotes: false,
        includeInTOC: true
      }],
      metadata: {
        templateInfo: {
          id: template.id,
          name: template.name,
          category: template.category
        },
        globalStyling: template.global_styling || {},
        appliedBrandKit: brandKit ? {
          id: brandKit.id,
          name: brandKit.name,
          appliedAt: new Date().toISOString()
        } : null,
        ...template.metadata
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Create the document
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .insert({
        title: documentContent.title,
        content: documentContent,
        template_id: templateId,
        user_id: user.id,
        workspace_id: workspaceId,
        styling_overrides: brandKit ? {
          appliedBrandKit: {
            id: brandKit.id,
            name: brandKit.name,
            palette: brandKit.palette,
            neutrals: brandKit.neutrals,
            fonts: brandKit.fonts,
            logos: {
              primary: brandKit.logo_primary_url,
              alt: brandKit.logo_alt_url
            }
          }
        } : {}
      })
      .select('id')
      .single()

    if (docError) {
      console.error('Error creating document:', docError)
      return new Response('Failed to create document', { status: 500, headers: corsHeaders })
    }

    // Update template usage count
    await supabaseClient
      .from('templates')
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq('id', templateId)

    const response = {
      docId: document.id,
      url: `/w/${workspaceId}/documents/${document.id}/editor`
    }

    console.log('Document created successfully:', response)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in create-document-from-template:', error)
    return new Response('Internal server error', { status: 500, headers: corsHeaders })
  }
})