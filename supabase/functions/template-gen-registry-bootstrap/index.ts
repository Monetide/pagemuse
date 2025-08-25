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

    // Check if user is admin
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const isAdmin = userRoles?.some(ur => ur.role === 'admin') || false
    if (!isAdmin) {
      return new Response('Forbidden', { 
        status: 403, 
        headers: corsHeaders 
      })
    }

    const docTypeDefaults = {
      pageMasters: ["pm/cover-fullbleed-{paper}","pm/body-1col-{paper}","pm/body-2col-{paper}"], 
      sectionOrder: ["Cover","TOC?","Body","DataAppendix?"],
      tocDefaults: { depth: ["H1","H2","H3"] },
      validationPreset: "standard"
    }

    const stylePackDefaults = {
      fontPairing: ["Inter","Source Serif Pro"], 
      scale: { bodyPt: 11, h3Pt: 16, h2Pt: 22, h1Pt: 34, baselinePt: 12, lineHeights: { body: 1.5, caption: 1.35 } },
      divider: "thin-rule", 
      callout: "left-accent-bar",
      chartDefaults: { grid: "light", legend: "top", numberFormat: "plain" }
    }

    const industryDefaults = {
      paletteHints: { accentSaturation: "medium", neutrals: "cool" },
      motifs: { bg: "subtle-geometry", divider: "thin-rule", coverShape: "simple-shape" },
      snippets: []
    }

    // Bootstrap doc types
    const docTypeIDs = ["white-paper","report","ebook","case-study","proposal","annual-report"]
    const docTypeInserts = docTypeIDs.map(id => ({ id, data: docTypeDefaults }))
    
    const { error: docTypeError } = await supabaseClient
      .from('template_registry_doc_types')
      .upsert(docTypeInserts, { onConflict: 'id' })

    if (docTypeError) throw docTypeError

    // Bootstrap style packs
    const stylePackIDs = ["professional","editorial","minimal","bold","technical","friendly"]
    const stylePackInserts = stylePackIDs.map(id => ({ id, data: stylePackDefaults }))
    
    const { error: stylePackError } = await supabaseClient
      .from('template_registry_style_packs')
      .upsert(stylePackInserts, { onConflict: 'id' })

    if (stylePackError) throw stylePackError

    // Bootstrap industries
    const industryIDs = ["finance","insurance","real-estate","healthcare","manufacturing","tech-saas","consumer-goods","public-sector"]
    const industryInserts = industryIDs.map(id => ({ id, data: industryDefaults }))
    
    const { error: industryError } = await supabaseClient
      .from('template_registry_industries')
      .upsert(industryInserts, { onConflict: 'id' })

    if (industryError) throw industryError

    return new Response(
      JSON.stringify({ 
        success: true,
        bootstrapped: {
          docTypes: docTypeIDs.length,
          stylePacks: stylePackIDs.length,
          industries: industryIDs.length
        }
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