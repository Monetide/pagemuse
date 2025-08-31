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

    const { templateId, title, workspaceId, followKitUpdates } = await req.json()

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

    // Fetch template with full configuration
    const { data: template, error: templateError } = await supabaseClient
      .from('templates')
      .select(`
        id, name, description, category, status, scope,
        global_styling, metadata, tpkg_source,
        template_pages (
          id, name, page_index, content_scaffold, page_styling, layout_config
        )
      `)
      .eq('id', templateId)
      .eq('status', 'published')
      .single()

    if (templateError || !template) {
      console.error('Template fetch error:', templateError)
      return new Response('Template not found or not published', { status: 404, headers: corsHeaders })
    }

    // Get workspace's default brand kit
    const { data: brandKit } = await supabaseClient
      .from('brand_kits')
      .select('id, name, palette, neutrals, fonts, logo_primary_url, logo_alt_url')
      .eq('workspace_id', workspaceId)
      .limit(1)
      .maybeSingle()

    // Helper function to apply brand kit to theme tokens
    function applyBrandKitToTokens(themeTokens: any, brandKit: any) {
      if (!brandKit) return themeTokens
      
      const tokens = { ...themeTokens }
      
      // Map brand kit colors to theme tokens
      if (brandKit.palette) {
        tokens.primary = brandKit.palette.primary
        tokens.secondary = brandKit.palette.secondary  
        tokens.accent = brandKit.palette.accent
      }
      
      if (brandKit.neutrals) {
        tokens.textBody = brandKit.neutrals.textBody
        tokens.textMuted = brandKit.neutrals.textMuted
        tokens.bgPage = brandKit.neutrals.bgPage
        tokens.bgSection = brandKit.neutrals.bgSection
        tokens.borderSubtle = brandKit.neutrals.borderSubtle
      }
      
      if (brandKit.fonts) {
        if (brandKit.fonts.heading) tokens.fontHeading = brandKit.fonts.heading
        if (brandKit.fonts.body) tokens.fontBody = brandKit.fonts.body
      }
      
      return tokens
    }

    // Helper function to recolor SVG motifs
    function recolorSvg(svgContent: string, colorMap: any) {
      let recolored = svgContent
      
      // Replace data-token attributes with actual colors
      Object.keys(colorMap).forEach(token => {
        const regex = new RegExp(`data-token="${token}"`, 'g')
        recolored = recolored.replace(regex, `fill="${colorMap[token]}"`)
      })
      
      return recolored
    }

    // Clone template configuration or use defaults
    const templateConfig = template.tpkg_source || {}
    const templateMetadata = template.metadata || {}
    
    // Create default configuration based on template category if tpkg_source is missing
    const getDefaultLayoutIntents = (category: string) => {
      const baseIntents = [
        { type: 'cover', name: 'Cover Page' },
        { type: 'body', name: 'Main Content', columns: 1 }
      ]
      
      if (category === 'report') {
        baseIntents.push(
          { type: 'body', name: 'Executive Summary', columns: 1 },
          { type: 'body', name: 'Analysis', columns: 2 },
          { type: 'body', name: 'Recommendations', columns: 1 }
        )
      }
      
      return baseIntents
    }

    const getDefaultStarterContent = (category: string, templateName: string) => {
      if (category === 'report') {
        return {
          sections: [
            {
              name: 'Executive Summary',
              description: 'High-level overview of key findings',
              layoutIntent: 'body',
              columns: 1,
              flows: [{
                name: 'Summary Content',
                type: 'linear',
                blocks: [
                  {
                    type: 'heading',
                    content: { level: 2, text: 'Executive Summary' }
                  },
                  {
                    type: 'paragraph',
                    content: { text: 'This section provides a comprehensive overview of the key findings and recommendations from our analysis.' }
                  }
                ]
              }]
            },
            {
              name: 'Analysis',
              description: 'Detailed analysis and findings',
              layoutIntent: 'body',
              columns: 2,
              flows: [{
                name: 'Analysis Content',
                type: 'linear',
                blocks: [
                  {
                    type: 'heading',
                    content: { level: 2, text: 'Analysis' }
                  },
                  {
                    type: 'paragraph',
                    content: { text: 'Our detailed analysis reveals several key insights that inform the strategic recommendations outlined in this report.' }
                  }
                ]
              }]
            },
            {
              name: 'Recommendations',
              description: 'Strategic recommendations and next steps',
              layoutIntent: 'body',
              columns: 1,
              flows: [{
                name: 'Recommendations Content',
                type: 'linear',
                blocks: [
                  {
                    type: 'heading',
                    content: { level: 2, text: 'Recommendations' }
                  },
                  {
                    type: 'paragraph',
                    content: { text: 'Based on our analysis, we recommend the following strategic actions to achieve optimal results.' }
                  }
                ]
              }]
            }
          ]
        }
      }
      
      // Default for other categories
      return {
        sections: [
          {
            name: 'Introduction',
            description: 'Document introduction',
            layoutIntent: 'body',
            columns: 1,
            flows: [{
              name: 'Introduction Content',
              type: 'linear',
              blocks: [
                {
                  type: 'heading',
                  content: { level: 2, text: 'Introduction' }
                },
                {
                  type: 'paragraph',
                  content: { text: 'Welcome to this document created from the ' + templateName + ' template.' }
                }
              ]
            }]
          }
        ]
      }
    }
    
    // Extract configuration from template or use defaults
    const themeTokens = applyBrandKitToTokens(templateConfig.themeTokens || {}, brandKit)
    const objectStyles = templateConfig.objectStyles || {}
    const pageMasters = templateConfig.pageMasters || {
      cover: {
        pageSize: 'Letter',
        orientation: 'portrait',
        margins: { top: 2, right: 2, bottom: 2, left: 2 },
        columns: 1,
        columnGap: 0,
        hasHeader: false,
        hasFooter: false,
        baselineGrid: false,
        gridSpacing: 0.125,
        allowTableRotation: false
      },
      body: {
        pageSize: 'Letter',
        orientation: 'portrait',
        margins: { top: 1, right: 1, bottom: 1, left: 1 },
        columns: 1,
        columnGap: 0.25,
        hasHeader: true,
        hasFooter: true,
        baselineGrid: false,
        gridSpacing: 0.125,
        allowTableRotation: false
      }
    }
    const layoutIntents = templateConfig.layoutIntents || getDefaultLayoutIntents(template.category)
    const snippets = templateConfig.snippets || []
    const starterContent = templateConfig.starterContent || getDefaultStarterContent(template.category, template.name)
    const motifs = templateConfig.motifs || {}

    // Create sections from starter content
    const sections = []
    let sectionOrder = 0

    // Create Cover section if template has cover layout
    const hasCoverLayout = layoutIntents.some((intent: any) => intent.type === 'cover')
    if (hasCoverLayout) {
      const coverSection = {
        id: crypto.randomUUID(),
        name: 'Cover',
        description: 'Document cover page',
        flows: [{
          id: crypto.randomUUID(),
          name: 'Cover Flow',
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
          }],
          type: 'linear',
          order: 0
        }],
        pageMaster: pageMasters.cover || {
          pageSize: 'Letter',
          orientation: 'portrait',
          margins: { top: 2, right: 2, bottom: 2, left: 2 },
          columns: 1,
          columnGap: 0,
          hasHeader: false,
          hasFooter: false,
          baselineGrid: false,
          gridSpacing: 0.125,
          allowTableRotation: false
        },
        layoutIntent: 'cover',
        order: sectionOrder++,
        footnotes: [],
        useEndnotes: false,
        includeInTOC: false
      }
      sections.push(coverSection)
    }

    // Create Body sections from starter content
    if (starterContent.sections && Array.isArray(starterContent.sections)) {
      starterContent.sections.forEach((sectionConfig: any, index: number) => {
        const section = {
          id: crypto.randomUUID(),
          name: sectionConfig.name || `Section ${index + 1}`,
          description: sectionConfig.description || '',
          flows: sectionConfig.flows?.map((flowConfig: any, flowIndex: number) => ({
            id: crypto.randomUUID(),
            name: flowConfig.name || `Flow ${flowIndex + 1}`,
            blocks: flowConfig.blocks?.map((blockConfig: any, blockIndex: number) => ({
              id: crypto.randomUUID(),
              type: blockConfig.type || 'paragraph',
              content: blockConfig.content || { text: 'Content placeholder' },
              order: blockIndex,
              paginationRules: blockConfig.paginationRules || {}
            })) || [],
            type: flowConfig.type || 'linear',
            order: flowIndex
          })) || [],
          pageMaster: sectionConfig.pageMaster || pageMasters.body || {
            pageSize: 'Letter',
            orientation: 'portrait',
            margins: { top: 1, right: 1, bottom: 1, left: 1 },
            columns: sectionConfig.columns || 1,
            columnGap: 0.25,
            hasHeader: false,
            hasFooter: false,
            baselineGrid: false,
            gridSpacing: 0.125,
            allowTableRotation: false
          },
          layoutIntent: sectionConfig.layoutIntent || 'body',
          order: sectionOrder++,
          footnotes: [],
          useEndnotes: false,
          includeInTOC: true
        }
        sections.push(section)
      })
    } else {
      // Create default body section if no starter content
      const bodySection = {
        id: crypto.randomUUID(),
        name: 'Main Content',
        description: template.description || '',
        flows: [{
          id: crypto.randomUUID(),
          name: 'Main',
          blocks: [{
            id: crypto.randomUUID(),
            type: 'heading',
            content: {
              level: 2,
              text: 'Introduction'
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
        pageMaster: pageMasters.body || {
          pageSize: 'Letter',
          orientation: 'portrait',
          margins: { top: 1, right: 1, bottom: 1, left: 1 },
          columns: 1,
          columnGap: 0.25,
          hasHeader: false,
          hasFooter: false,
          baselineGrid: false,
          gridSpacing: 0.125,
          allowTableRotation: false
        },
        layoutIntent: 'body',
        order: sectionOrder++,
        footnotes: [],
        useEndnotes: false,
        includeInTOC: true
      }
      sections.push(bodySection)
    }

    // Create full document with template configuration
    const documentContent = {
      id: crypto.randomUUID(),
      title: title || template.name || 'Document',
      sections,
      metadata: {
        templateInfo: {
          id: template.id,
          name: template.name,
          category: template.category
        },
        themeTokens,
        objectStyles,
        pageMasters,
        layoutIntents,
        snippets,
        motifs,
        appliedBrandKit: brandKit ? {
          id: brandKit.id,
          name: brandKit.name,
          appliedAt: new Date().toISOString(),
          followUpdates: followKitUpdates !== false
        } : null,
        ...templateMetadata
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