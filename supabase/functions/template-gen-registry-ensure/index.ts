import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    const { type, id } = await req.json()

    if (!type || !id || !['docType', 'stylePack', 'industry'].includes(type)) {
      return new Response('Invalid type or id', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    let tableName: string
    let defaultData: any

    switch (type) {
      case 'docType':
        tableName = 'template_registry_doc_types'
        defaultData = {
          pageMasters: ["pm/cover-fullbleed-{paper}","pm/body-1col-{paper}","pm/body-2col-{paper}"], 
          sectionOrder: ["Cover","TOC?","Body","DataAppendix?"],
          tocDefaults: { depth: ["H1","H2","H3"] },
          validationPreset: "standard"
        }
        break
      case 'stylePack':
        tableName = 'template_registry_style_packs'
        defaultData = {
          fontPairing: ["Inter","Source Serif Pro"], 
          scale: { bodyPt: 11, h3Pt: 16, h2Pt: 22, h1Pt: 34, baselinePt: 12, lineHeights: { body: 1.5, caption: 1.35 } },
          divider: "thin-rule", 
          callout: "left-accent-bar",
          chartDefaults: { grid: "light", legend: "top", numberFormat: "plain" }
        }
        break
      case 'industry':
        tableName = 'template_registry_industries'
        defaultData = {
          paletteHints: { accentSaturation: "medium", neutrals: "cool" },
          motifs: { bg: "subtle-geometry", divider: "thin-rule", coverShape: "simple-shape" },
          snippets: []
        }
        break
      default:
        return new Response('Invalid type', { 
          status: 400, 
          headers: corsHeaders 
        })
    }

    // Check if already exists
    const { data: existing } = await supabaseClient
      .from(tableName)
      .select('id')
      .eq('id', id)
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ 
          success: true,
          created: false,
          message: 'Entry already exists' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create minimal module
    const { error } = await supabaseClient
      .from(tableName)
      .insert({ id, data: defaultData })

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        success: true,
        created: true,
        id,
        data: defaultData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})