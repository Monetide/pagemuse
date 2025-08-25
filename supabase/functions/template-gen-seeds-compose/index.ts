import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TemplateSeed {
  id: string
  workspace_id: string
  doc_type: string
  style_pack: string
  industry: string
  type_pairing: string[]
  scale: any
  motifs: any
  palette_hints: any
  snippets: string[]
  chart_defaults: any
  validation_preset: string
  status: string
}

interface TemplateConfig {
  docType: string
  stylePack: string
  industry: string
  scale: any
  motifs: any
  paletteHints: any
  snippets: string[]
  chartDefaults: any
  validationPreset: string
  typePairing: string[]
}

// Mock image generation - in real implementation, this would generate actual preview images
const generatePreviewImage = async (type: 'cover' | 'body-2col' | 'data', config: TemplateConfig): Promise<string> => {
  // Simulate image generation with a simple colored rectangle
  const canvas = new OffscreenCanvas(400, 300)
  const ctx = canvas.getContext('2d')!
  
  // Set background color based on type
  const colors = {
    cover: '#3b82f6', // blue
    'body-2col': '#10b981', // green
    data: '#f59e0b' // amber
  }
  
  ctx.fillStyle = colors[type]
  ctx.fillRect(0, 0, 400, 300)
  
  // Add text
  ctx.fillStyle = 'white'
  ctx.font = '20px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`${type} Preview`, 200, 150)
  ctx.fillText(`${config.docType}`, 200, 180)
  ctx.fillText(`${config.stylePack}`, 200, 210)
  
  const blob = await canvas.convertToBlob({ type: 'image/png' })
  const arrayBuffer = await blob.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
  return `data:image/png;base64,${base64}`
}

// Generate SVG motifs with token awareness
const generateSVGMotif = (type: 'body-bg' | 'divider' | 'cover-shape', config: TemplateConfig): string => {
  const motifConfig = config.motifs[type.replace('-', '')]
  
  switch (type) {
    case 'body-bg':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--neutral-border)" stroke-width="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.1"/>
      </svg>`
    
    case 'divider':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 4">
        <rect width="100%" height="2" fill="var(--accent-color)" y="1"/>
      </svg>`
    
    case 'cover-shape':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <polygon points="0,0 180,0 200,20 200,200 20,200 0,180" fill="var(--primary-color)" opacity="0.1"/>
      </svg>`
    
    default:
      return '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
  }
}

// Compose template configuration from modules
const composeTemplateConfig = async (seed: TemplateSeed, supabase: any): Promise<TemplateConfig> => {
  // Get registry entries for each module
  const [docTypeData] = await Promise.all([
    supabase.rpc('get_registry_entry', { table_name: 'template_registry_doc_types', entry_id: seed.doc_type }),
    supabase.rpc('get_registry_entry', { table_name: 'template_registry_style_packs', entry_id: seed.style_pack }),
    supabase.rpc('get_registry_entry', { table_name: 'template_registry_industries', entry_id: seed.industry })
  ])

  // Base configuration from modules (simplified - in real implementation would merge all modules)
  const baseConfig: TemplateConfig = {
    docType: seed.doc_type,
    stylePack: seed.style_pack,
    industry: seed.industry,
    scale: {
      bodyPt: 11,
      h3Pt: 16,
      h2Pt: 22,
      h1Pt: 34,
      baselinePt: 12,
      lineHeights: { body: 1.5, caption: 1.35 }
    },
    motifs: {
      bg: 'isometric-grid-faint',
      divider: 'thin-rule',
      coverShape: 'tilted-ribbon'
    },
    paletteHints: {
      accentSaturation: 'medium',
      neutrals: 'cool'
    },
    snippets: ['kpi-3up', 'methodology', 'disclaimer-tech', 'pull-quote', 'cta'],
    chartDefaults: {
      numberFormat: 'plain',
      grid: 'light',
      legend: 'top'
    },
    validationPreset: seed.validation_preset,
    typePairing: seed.type_pairing
  }

  // Apply seed overrides
  return {
    ...baseConfig,
    scale: seed.scale || baseConfig.scale,
    motifs: seed.motifs || baseConfig.motifs,
    paletteHints: seed.palette_hints || baseConfig.paletteHints,
    snippets: seed.snippets.length > 0 ? seed.snippets : baseConfig.snippets,
    chartDefaults: seed.chart_defaults || baseConfig.chartDefaults,
    typePairing: seed.type_pairing.length > 0 ? seed.type_pairing : baseConfig.typePairing
  }
}

// Package TPKG (Template Package)
const packageTPKG = (config: TemplateConfig, assets: Record<string, string>, previews: Record<string, string>) => {
  return {
    'template.json': JSON.stringify(config, null, 2),
    assets,
    previews
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
    const { workspaceId } = body as { workspaceId: string }

    if (!workspaceId) {
      return new Response(JSON.stringify({ error: 'Workspace ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Composing templates for workspace ${workspaceId}`)

    // Verify user has access to workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userData.user.id)
      .single()

    if (membershipError || !membership) {
      return new Response(JSON.stringify({ error: 'Access denied to workspace' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get all ready seeds for this workspace
    const { data: seeds, error: seedsError } = await supabase
      .from('template_seeds')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'ready')

    if (seedsError) {
      console.error('Seeds fetch error:', seedsError)
      return new Response(JSON.stringify({ error: 'Failed to fetch seeds', details: seedsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!seeds || seeds.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No ready seeds to compose', templatesCreated: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${seeds.length} ready seeds to compose`)

    const templatesCreated = []

    // Process each seed
    for (const seed of seeds) {
      try {
        console.log(`Composing template for seed: ${seed.id}`)

        // 1. Compose template configuration
        const config = await composeTemplateConfig(seed, supabase)

        // 2. Generate preview images
        const previews = {
          'cover.png': await generatePreviewImage('cover', config),
          'body-2col.png': await generatePreviewImage('body-2col', config),
          'data.png': await generatePreviewImage('data', config)
        }

        // 3. Generate SVG motifs
        const assets = {
          'body-bg.svg': generateSVGMotif('body-bg', config),
          'divider.svg': generateSVGMotif('divider', config),
          'cover-shape.svg': generateSVGMotif('cover-shape', config)
        }

        // 4. Package TPKG
        const tpkg = packageTPKG(config, assets, previews)

        // 5. Save as draft template
        const { data: template, error: templateError } = await supabase
          .from('templates')
          .insert({
            name: `${seed.doc_type} - ${seed.style_pack} - ${seed.industry}`,
            description: `Generated template from seed ${seed.id}`,
            category: seed.doc_type,
            workspace_id: workspaceId,
            user_id: userData.user.id,
            status: 'draft',
            metadata: {
              templateId: seed.id,
              facets: {
                docType: seed.doc_type,
                stylePack: seed.style_pack,
                industry: seed.industry
              },
              seedId: seed.id
            },
            tpkg_source: tpkg,
            global_styling: config,
            preview_image_url: previews['cover.png']
          })
          .select()
          .single()

        if (templateError) {
          console.error(`Template creation error for seed ${seed.id}:`, templateError)
          continue
        }

        // Update seed status to composed
        await supabase
          .from('template_seeds')
          .update({ status: 'composed' })
          .eq('id', seed.id)
          .eq('workspace_id', workspaceId)

        templatesCreated.push({
          seedId: seed.id,
          templateId: template.id,
          name: template.name
        })

        console.log(`Successfully created template ${template.id} from seed ${seed.id}`)

      } catch (error) {
        console.error(`Error composing seed ${seed.id}:`, error)
        // Continue with next seed
      }
    }

    console.log(`Successfully created ${templatesCreated.length} templates`)

    return new Response(JSON.stringify({
      success: true,
      templatesCreated: templatesCreated.length,
      templates: templatesCreated
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in template-gen-seeds-compose:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})