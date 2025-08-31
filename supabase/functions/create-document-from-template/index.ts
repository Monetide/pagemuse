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
        global_styling, metadata, tpkg_source, config
      `)
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      console.error('Template fetch error:', templateError)
      return new Response('Template not found', { status: 404, headers: corsHeaders })
    }

    // Validate template is published
    if (template.status !== 'published') {
      return new Response(
        JSON.stringify({ error: 'Template is not published' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate template has complete packaging
    if (!template.tpkg_source || !template.config) {
      return new Response(
        JSON.stringify({ 
          error: 'TEMPLATE_INCOMPLETE',
          message: 'Template is missing required packaging data (tpkg_source or config)'
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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

    // Clone configuration strictly from template.config
    const templateConfig = template.config
    const tpkgSource = template.tpkg_source

    // Extract core template configuration
    const originalThemeTokens = templateConfig.themeTokens || {}
    const objectStyles = templateConfig.objectStyles || {}
    const pageMasters = templateConfig.pageMasters || []
    const layoutIntents = templateConfig.layoutIntents || {}
    const snippets = templateConfig.snippets || []
    const starterContent = templateConfig.starterContent || []
    const motifs = templateConfig.motifs || {}

    // Apply brand kit mapping to theme tokens
    const themeTokens = applyBrandKitToTokens(originalThemeTokens, brandKit)

    // Recolor SVG motifs using brand kit colors and save as document assets
    const recoloredMotifs = {}
    Object.keys(motifs).forEach(motifKey => {
      const motifSvg = motifs[motifKey]
      if (typeof motifSvg === 'string' && motifSvg.includes('<svg')) {
        recoloredMotifs[motifKey] = recolorSvg(motifSvg, themeTokens)
      } else {
        recoloredMotifs[motifKey] = motifSvg
      }
    })

    // Create sections from starterContent and layoutIntents only
    const sections = []
    let sectionOrder = 0

    // Only process if starterContent exists
    if (!starterContent || starterContent.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'TEMPLATE_INCOMPLETE',
          message: 'Template has no starter content defined'
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    starterContent.forEach((sectionConfig, index) => {
      const section = {
        id: crypto.randomUUID(),
        name: sectionConfig.name || `Section ${index + 1}`,
        description: sectionConfig.description || '',
        flows: sectionConfig.flows?.map((flowConfig, flowIndex) => ({
          id: crypto.randomUUID(),
          name: flowConfig.name || `Flow ${flowIndex + 1}`,
          blocks: flowConfig.blocks?.map((blockConfig, blockIndex) => ({
            id: crypto.randomUUID(),
            type: blockConfig.type || 'paragraph',
            content: blockConfig.content || { text: 'Content placeholder' },
            order: blockIndex,
            paginationRules: blockConfig.paginationRules || {}
          })) || [],
          type: flowConfig.type || 'linear',
          order: flowIndex
        })) || [],
        pageMaster: sectionConfig.pageMaster || 
          pageMasters.find(pm => pm.id === sectionConfig.pageMasterId) || 
          pageMasters[0] || {},
        layoutIntent: sectionConfig.layoutIntent || 'body',
        order: sectionOrder++,
        footnotes: [],
        useEndnotes: false,
        includeInTOC: sectionConfig.includeInTOC !== false
      }
      sections.push(section)
    })

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
        motifs: recoloredMotifs,
        appliedBrandKit: brandKit ? {
          id: brandKit.id,
          name: brandKit.name,
          appliedAt: new Date().toISOString(),
          followUpdates: followKitUpdates !== false
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