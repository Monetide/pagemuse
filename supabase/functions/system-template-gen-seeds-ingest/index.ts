import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has admin role via secure RPC (bypasses RLS)
    const { data: roles, error: roleErr } = await supabaseClient.rpc('get_user_roles', { _user_id: user.id })

    const isAdmin = Array.isArray(roles) && roles.some((r: any) => r.role === 'admin')

    if (roleErr || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const raw = await req.json()
    const seedsInput = Array.isArray(raw) ? raw : raw?.seeds

    if (!seedsInput || !Array.isArray(seedsInput)) {
      return new Response(
        JSON.stringify({ error: 'Seeds array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Global seeds ingest requested by admin ${user.id}: ${seedsInput.length} seeds`)

    // Global workspace ID for global seeds
    const globalWorkspaceId = '00000000-0000-0000-0000-000000000000'

    const results = []
    
    for (const seed of seedsInput) {
      try {
        // Normalize field names (accept camelCase or snake_case)
        const normalized = {
          id: seed.id,
          doc_type: seed.doc_type ?? seed.docType,
          industry: seed.industry,
          style_pack: seed.style_pack ?? seed.stylePack,
          palette_hints: seed.palette_hints ?? seed.paletteHints ?? {},
          scale: seed.scale ?? {},
          motifs: seed.motifs ?? seed.motifVariants ?? {},
          chart_defaults: seed.chart_defaults ?? seed.chartDefaults ?? {},
          snippets: seed.snippets ?? [],
          type_pairing: seed.type_pairing ?? seed.typePairing ?? [],
          validation_preset: seed.validation_preset ?? seed.validationPreset ?? null,
        }

        // Validate required seed fields
        if (!normalized.id || !normalized.doc_type || !normalized.industry || !normalized.style_pack) {
          results.push({
            seedId: normalized.id || 'unknown',
            success: false,
            error: 'Missing required fields: id, docType/style_pack, industry, or stylePack/doc_type'
          })
          continue
        }

        // Prepare seed data for global scope
        const seedData = {
          id: normalized.id,
          doc_type: normalized.doc_type,
          industry: normalized.industry,
          style_pack: normalized.style_pack,
          workspace_id: globalWorkspaceId, // Use global workspace ID
          status: 'ready',
          palette_hints: normalized.palette_hints,
          scale: normalized.scale,
          motifs: normalized.motifs,
          chart_defaults: normalized.chart_defaults,
          snippets: normalized.snippets,
          type_pairing: normalized.type_pairing,
          validation_preset: normalized.validation_preset
        }

        // Insert or update the seed
        const { data: existingSeed } = await supabaseClient
          .from('template_seeds')
          .select('id')
          .eq('id', normalized.id)
          .eq('workspace_id', globalWorkspaceId)
          .maybeSingle()

        if (existingSeed) {
          // Update existing seed
          const { error: updateError } = await supabaseClient
            .from('template_seeds')
            .update(seedData)
            .eq('id', normalized.id)
            .eq('workspace_id', globalWorkspaceId)

          if (updateError) {
            console.error('Failed to update seed:', updateError)
            results.push({
              seedId: normalized.id,
              success: false,
              error: updateError.message
            })
          } else {
            console.log(`Updated global seed: ${normalized.id}`)
            results.push({
              seedId: normalized.id,
              success: true,
              action: 'updated'
            })
          }
        } else {
          // Insert new seed
          const { error: insertError } = await supabaseClient
            .from('template_seeds')
            .insert(seedData)

          if (insertError) {
            console.error('Failed to insert seed:', insertError)
            results.push({
              seedId: normalized.id,
              success: false,
              error: insertError.message
            })
          } else {
            console.log(`Inserted global seed: ${normalized.id}`)
            results.push({
              seedId: normalized.id,
              success: true,
              action: 'inserted'
            })
          }
        }

      } catch (error) {
        console.error(`Error processing seed ${seed.id || 'unknown'}:`, error)
        results.push({
          seedId: seed.id || 'unknown',
          success: false,
          error: (error as Error).message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`Global seeds ingest completed: ${successCount} success, ${failureCount} failures`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: seedsInput.length,
        successful: successCount,
        failed: failureCount,
        results,
        scope: 'global',
        workspaceId: globalWorkspaceId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in system-template-gen-seeds-ingest:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})