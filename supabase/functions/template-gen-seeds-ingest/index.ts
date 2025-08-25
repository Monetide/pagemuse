import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TemplateSeed {
  id: string
  docType: string
  stylePack: string
  industry: string
  typePairing: string[]
  scale: {
    bodyPt: number
    h3Pt: number
    h2Pt: number
    h1Pt: number
    baselinePt: number
    lineHeights: {
      body: number
      caption: number
    }
  }
  motifs: {
    bg: string
    divider: string
    coverShape: string
  }
  paletteHints: {
    accentSaturation: string
    neutrals: string
  }
  snippets: string[]
  chartDefaults: {
    numberFormat: string
    grid: string
    legend: string
  }
  validationPreset: string
  status: string
  workspaceId: string
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
    const { seeds, workspaceId } = body as { seeds: TemplateSeed[], workspaceId: string }

    if (!seeds || !Array.isArray(seeds)) {
      return new Response(JSON.stringify({ error: 'Seeds array required' }), {
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

    console.log(`Ingesting ${seeds.length} template seeds for workspace ${workspaceId}`)

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

    // Process each seed for upsert
    const seedsToUpsert = seeds.map(seed => ({
      id: seed.id,
      workspace_id: workspaceId,
      doc_type: seed.docType,
      style_pack: seed.stylePack,
      industry: seed.industry,
      type_pairing: seed.typePairing,
      scale: seed.scale,
      motifs: seed.motifs,
      palette_hints: seed.paletteHints,
      snippets: seed.snippets,
      chart_defaults: seed.chartDefaults,
      validation_preset: seed.validationPreset,
      status: seed.status || 'ready'
    }))

    // Upsert seeds (by id + workspace_id composite key)
    const { data: upsertedSeeds, error: upsertError } = await supabase
      .from('template_seeds')
      .upsert(seedsToUpsert, { 
        onConflict: 'id,workspace_id',
        ignoreDuplicates: false 
      })
      .select()

    if (upsertError) {
      console.error('Upsert error:', upsertError)
      return new Response(JSON.stringify({ error: 'Failed to store seeds', details: upsertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Successfully upserted ${upsertedSeeds?.length || 0} seeds`)

    return new Response(JSON.stringify({ 
      success: true, 
      count: upsertedSeeds?.length || 0,
      seeds: upsertedSeeds 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in template-gen-seeds-ingest:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})