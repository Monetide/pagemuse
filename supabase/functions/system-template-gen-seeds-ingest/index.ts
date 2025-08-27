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

    // Check if user has admin role
    const { data: userRoles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')

    if (roleError || !userRoles || userRoles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { seeds } = await req.json()

    if (!seeds || !Array.isArray(seeds)) {
      return new Response(
        JSON.stringify({ error: 'Seeds array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Global seeds ingest requested by admin ${user.id}: ${seeds.length} seeds`)

    // Create a dummy global workspace ID for global seeds
    // We'll use a special UUID that represents the global scope
    const globalWorkspaceId = '00000000-0000-0000-0000-000000000000'

    const results = []
    
    for (const seed of seeds) {
      try {
        // Validate required seed fields
        if (!seed.id || !seed.doc_type || !seed.industry || !seed.style_pack) {
          results.push({
            seedId: seed.id || 'unknown',
            success: false,
            error: 'Missing required fields: id, doc_type, industry, or style_pack'
          })
          continue
        }

        // Prepare seed data for global scope
        const seedData = {
          id: seed.id,
          doc_type: seed.doc_type,
          industry: seed.industry,
          style_pack: seed.style_pack,
          workspace_id: globalWorkspaceId, // Use global workspace ID
          status: 'ready',
          palette_hints: seed.palette_hints || {},
          scale: seed.scale || {},
          motifs: seed.motifs || {},
          chart_defaults: seed.chart_defaults || {},
          snippets: seed.snippets || [],
          type_pairing: seed.type_pairing || [],
          validation_preset: seed.validation_preset || null
        }

        // Insert or update the seed
        const { data: existingSeed } = await supabaseClient
          .from('template_seeds')
          .select('id')
          .eq('id', seed.id)
          .eq('workspace_id', globalWorkspaceId)
          .single()

        if (existingSeed) {
          // Update existing seed
          const { error: updateError } = await supabaseClient
            .from('template_seeds')
            .update(seedData)
            .eq('id', seed.id)
            .eq('workspace_id', globalWorkspaceId)

          if (updateError) {
            console.error('Failed to update seed:', updateError)
            results.push({
              seedId: seed.id,
              success: false,
              error: updateError.message
            })
          } else {
            console.log(`Updated global seed: ${seed.id}`)
            results.push({
              seedId: seed.id,
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
              seedId: seed.id,
              success: false,
              error: insertError.message
            })
          } else {
            console.log(`Inserted global seed: ${seed.id}`)
            results.push({
              seedId: seed.id,
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
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`Global seeds ingest completed: ${successCount} success, ${failureCount} failures`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: seeds.length,
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