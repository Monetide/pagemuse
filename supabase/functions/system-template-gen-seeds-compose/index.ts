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

    // Check if user has admin role via secure RPC
    const { data: roles, error: roleErr } = await supabaseClient.rpc('get_user_roles', { _user_id: user.id })

    const isAdmin = Array.isArray(roles) && roles.some((r: any) => r.role === 'admin')

    if (roleErr || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { seedIds } = await req.json()

    console.log(`Global seeds compose requested by admin ${user.id}:`, seedIds?.length || 'all')

    // Global workspace ID for global seeds
    const globalWorkspaceId = '00000000-0000-0000-0000-000000000000'

    // Get seeds to compose
    let seedsQuery = supabaseClient
      .from('template_seeds')
      .select('*')
      .eq('workspace_id', globalWorkspaceId)
      .eq('status', 'ready')

    if (seedIds && Array.isArray(seedIds) && seedIds.length > 0) {
      seedsQuery = seedsQuery.in('id', seedIds)
    }

    const { data: seeds, error: seedsError } = await seedsQuery

    console.log('Seed query result:', { seeds: seeds?.length || 0, seedsError })
    console.log('Query details:', { globalWorkspaceId, seedIds })

    if (seedsError) {
      console.error('Failed to fetch global seeds:', seedsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch global seeds', details: seedsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!seeds || seeds.length === 0) {
      console.log('No seeds found, checking all template_seeds...')
      // Debug: check if any seeds exist at all
      const { data: allSeeds, error: allSeedsError } = await supabaseClient
        .from('template_seeds')
        .select('*')
        .limit(5)
      
      console.log('All seeds check:', { allSeeds: allSeeds?.length || 0, allSeedsError })
      
      return new Response(
        JSON.stringify({ 
          error: 'No global seeds found for composition',
          seedIds: seedIds || 'all',
          debug: {
            globalWorkspaceId,
            allSeedsCount: allSeeds?.length || 0,
            allSeedsError: allSeedsError?.message
          }
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Composing ${seeds.length} global seeds:`, seeds.map(s => s.id))

    const results = []
    
    for (const seed of seeds) {
      try {
        // Generate template name based on seed properties
        const templateName = `Global ${seed.doc_type} - ${seed.industry} (${seed.style_pack})`
        const templateSlug = `global-${seed.doc_type}-${seed.industry}-${seed.style_pack}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')

        // Create mock preview data (in real implementation, this would generate actual previews)
        const mockPreviewUrl = `https://via.placeholder.com/800x600/1f2937/ffffff?text=${encodeURIComponent(templateName)}`

        // Create global template with workspace_id=null for true global scope
        const templateData = {
          name: templateName,
          template_slug: templateSlug,
          description: `Global template for ${seed.doc_type} documents in ${seed.industry} industry with ${seed.style_pack} styling`,
          category: seed.doc_type,
          scope: 'global',
          workspace_id: null, // null for true global scope
          user_id: user.id, // Admin who created it
          is_global: true,
          is_premium: false,
          status: 'draft',
          preview_image_url: mockPreviewUrl,
          global_styling: {
            palette: seed.palette_hints,
            typography: seed.type_pairing,
            scale: seed.scale,
            motifs: seed.motifs
          },
          metadata: {
            generated_from_seed: seed.id,
            composed_at: new Date().toISOString(),
            scope: 'global',
            version: '1.0'
          }
        }

        console.log(`Creating template for seed ${seed.id}:`, templateSlug)

        // Check if template already exists
        const { data: existingTemplate } = await supabaseClient
          .from('templates')
          .select('id')
          .eq('template_slug', templateSlug)
          .eq('scope', 'global')
          .maybeSingle()

        let templateId
        if (existingTemplate) {
          // Update existing template
          const { data: updatedTemplate, error: updateError } = await supabaseClient
            .from('templates')
            .update(templateData)
            .eq('id', existingTemplate.id)
            .select('id')
            .single()

          if (updateError) {
            console.error('Failed to update global template:', updateError)
            console.error('Update error details:', updateError)
            results.push({
              seedId: seed.id,
              success: false,
              error: updateError.message
            })
            continue
          }

          templateId = updatedTemplate.id
          console.log(`Updated global template: ${templateSlug}`)
        } else {
          // Insert new template
          const { data: newTemplate, error: insertError } = await supabaseClient
            .from('templates')
            .insert(templateData)
            .select('id')
            .single()

          if (insertError) {
            console.error('Failed to insert global template:', insertError)
            console.error('Insert error details:', insertError)
            results.push({
              seedId: seed.id,
              success: false,
              error: insertError.message
            })
            continue
          }

          templateId = newTemplate.id
          console.log(`Created global template: ${templateSlug}`)
        }

        // Create template pages (simplified for demo - in real implementation, this would be more complex)
        const pageData = {
          template_id: templateId,
          page_index: 0,
          name: 'Cover Page',
          layout_config: {
            type: 'cover',
            style: seed.style_pack,
            motifs: seed.motifs
          },
          page_styling: seed.palette_hints,
          content_scaffold: {
            title: 'Document Title',
            subtitle: 'Document Subtitle',
            author: 'Author Name',
            date: new Date().toISOString().split('T')[0]
          }
        }

        // Check if page already exists
        const { data: existingPage } = await supabaseClient
          .from('template_pages')
          .select('id')
          .eq('template_id', templateId)
          .eq('page_index', 0)
          .maybeSingle()

        if (existingPage) {
          // Update existing page
          await supabaseClient
            .from('template_pages')
            .update(pageData)
            .eq('id', existingPage.id)
        } else {
          // Insert new page
          await supabaseClient
            .from('template_pages')
            .insert(pageData)
        }

        results.push({
          seedId: seed.id,
          success: true,
          templateId,
          templateName,
          templateSlug,
          previewUrl: mockPreviewUrl,
          scope: 'global',
          workspaceId: null
        })

      } catch (error) {
        console.error(`Error composing seed ${seed.id}:`, error)
        results.push({
          seedId: seed.id,
          success: false,
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`Global seeds composition completed: ${successCount} success, ${failureCount} failures`)

    return new Response(
      JSON.stringify({
        success: true,
        composed: seeds.length,
        successful: successCount,
        successCount: successCount,
        createdCount: successCount,
        failed: failureCount,
        results,
        scope: 'global',
        workspaceId: null,
        metadata: {
          generatedPreviews: results.filter(r => r.success).map(r => r.previewUrl),
          templateSlugs: results.filter(r => r.success).map(r => r.templateSlug)
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in system-template-gen-seeds-compose:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})