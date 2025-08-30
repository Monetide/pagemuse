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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const authHeader = req.headers.get('Authorization')!
    supabaseClient.auth.setAuth(authHeader.replace('Bearer ', ''))

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const workspaceId = pathParts[pathParts.indexOf('w') + 1]

    if (!workspaceId) {
      return new Response('Workspace ID required', { status: 400, headers: corsHeaders })
    }

    // Verify workspace membership
    const { data: membership } = await supabaseClient
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return new Response('Access denied', { status: 403, headers: corsHeaders })
    }

    const { templateId, title } = await req.json()

    if (!templateId) {
      return new Response('Template ID required', { status: 400, headers: corsHeaders })
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
      return new Response('Template not found', { status: 404, headers: corsHeaders })
    }

    // Get workspace's default brand kit
    const { data: brandKit } = await supabaseClient
      .from('brand_kits')
      .select('id, name, palette, neutrals, fonts, logo_primary_url, logo_alt_url')
      .eq('workspace_id', workspaceId)
      .limit(1)
      .single()

    // Create document structure from template
    const documentContent = {
      id: crypto.randomUUID(),
      title: title || `Document from ${template.name}`,
      type: 'document',
      metadata: {
        templateInfo: {
          id: template.id,
          name: template.name,
          category: template.category
        },
        globalStyling: template.global_styling,
        appliedBrandKit: brandKit ? {
          id: brandKit.id,
          name: brandKit.name,
          appliedAt: new Date().toISOString()
        } : null,
        ...template.metadata
      },
      sections: []
    }

    // Process template pages into document sections
    if (template.template_pages && template.template_pages.length > 0) {
      const sortedPages = template.template_pages.sort((a, b) => a.page_index - b.page_index)
      
      for (const page of sortedPages) {
        const section = {
          id: crypto.randomUUID(),
          type: 'section',
          name: page.name || `Section ${page.page_index + 1}`,
          order: page.page_index,
          layoutIntent: page.layout_config?.type || 'standard',
          styling: applyBrandKitToStyling(page.page_styling || {}, brandKit),
          flows: [{
            id: crypto.randomUUID(),
            type: 'flow',
            name: 'Main',
            flowType: 'linear',
            order: 0,
            blocks: createBlocksFromScaffold(page.content_scaffold || {}, brandKit)
          }]
        }
        documentContent.sections.push(section)
      }
    } else {
      // Create default structure if no template pages
      documentContent.sections = [
        {
          id: crypto.randomUUID(),
          type: 'section',
          name: 'Cover',
          order: 0,
          layoutIntent: 'cover',
          styling: applyBrandKitToStyling({}, brandKit),
          flows: [{
            id: crypto.randomUUID(),
            type: 'flow',
            name: 'Main',
            flowType: 'linear',
            order: 0,
            blocks: [
              {
                id: crypto.randomUUID(),
                type: 'heading',
                order: 0,
                content: {
                  level: 1,
                  text: title || template.name || 'Document Title'
                },
                styling: applyBrandKitToStyling({}, brandKit)
              },
              {
                id: crypto.randomUUID(),
                type: 'paragraph',
                order: 1,
                content: {
                  text: template.description || 'Document created from template'
                },
                styling: applyBrandKitToStyling({}, brandKit)
              }
            ]
          }]
        }
      ]
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

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in create-document-from-template:', error)
    return new Response('Internal server error', { status: 500, headers: corsHeaders })
  }
})

function applyBrandKitToStyling(styling: any, brandKit: any) {
  if (!brandKit) return styling

  const appliedStyling = { ...styling }

  // Apply brand kit colors to styling tokens
  if (brandKit.palette) {
    appliedStyling.colors = {
      ...appliedStyling.colors,
      primary: brandKit.palette.primary,
      secondary: brandKit.palette.secondary,
      accent: brandKit.palette.accent
    }
  }

  if (brandKit.neutrals) {
    appliedStyling.colors = {
      ...appliedStyling.colors,
      ...brandKit.neutrals
    }
  }

  if (brandKit.fonts) {
    appliedStyling.typography = {
      ...appliedStyling.typography,
      ...brandKit.fonts
    }
  }

  return appliedStyling
}

function createBlocksFromScaffold(scaffold: any, brandKit: any) {
  const blocks = []
  let order = 0

  if (scaffold.title) {
    blocks.push({
      id: crypto.randomUUID(),
      type: 'heading',
      order: order++,
      content: {
        level: 1,
        text: scaffold.title
      },
      styling: applyBrandKitToStyling({}, brandKit)
    })
  }

  if (scaffold.subtitle) {
    blocks.push({
      id: crypto.randomUUID(),
      type: 'paragraph',
      order: order++,
      content: {
        text: scaffold.subtitle
      },
      styling: applyBrandKitToStyling({}, brandKit)
    })
  }

  if (scaffold.author) {
    blocks.push({
      id: crypto.randomUUID(),
      type: 'paragraph',
      order: order++,
      content: {
        text: `Author: ${scaffold.author}`
      },
      styling: applyBrandKitToStyling({}, brandKit)
    })
  }

  if (scaffold.date) {
    blocks.push({
      id: crypto.randomUUID(),
      type: 'paragraph',
      order: order++,
      content: {
        text: `Date: ${scaffold.date}`
      },
      styling: applyBrandKitToStyling({}, brandKit)
    })
  }

  // If no content, add a default paragraph
  if (blocks.length === 0) {
    blocks.push({
      id: crypto.randomUUID(),
      type: 'paragraph',
      order: 0,
      content: {
        text: 'Start writing your content here...'
      },
      styling: applyBrandKitToStyling({}, brandKit)
    })
  }

  return blocks
}