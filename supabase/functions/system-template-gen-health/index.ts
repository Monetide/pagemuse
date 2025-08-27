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

    console.log('System health check requested by admin:', user.id)

    // Check registries health
    let registriesOk = false
    try {
      const { data: docTypes, error: docTypesError } = await supabaseClient
        .from('template_registry_doc_types')
        .select('id')
        .limit(1)

      const { data: stylePacks, error: stylePacksError } = await supabaseClient
        .from('template_registry_style_packs')
        .select('id')
        .limit(1)

      const { data: industries, error: industriesError } = await supabaseClient
        .from('template_registry_industries')
        .select('id')
        .limit(1)

      registriesOk = !docTypesError && !stylePacksError && !industriesError &&
                     docTypes && stylePacks && industries &&
                     docTypes.length > 0 && stylePacks.length > 0 && industries.length > 0
    } catch (error) {
      console.error('Registry health check failed:', error)
      registriesOk = false
    }

    // Check composer health (seeds table accessible)
    let composerOk = false
    try {
      const { error: seedsError } = await supabaseClient
        .from('template_seeds')
        .select('id')
        .limit(1)

      composerOk = !seedsError
    } catch (error) {
      console.error('Composer health check failed:', error)
      composerOk = false
    }

    // Check preview health (templates table accessible)
    let previewOk = false
    try {
      const { error: templatesError } = await supabaseClient
        .from('templates')
        .select('id')
        .eq('scope', 'global')
        .limit(1)

      previewOk = !templatesError
    } catch (error) {
      console.error('Preview health check failed:', error)
      previewOk = false
    }

    // Check packager health (template_pages table accessible)
    let packagerOk = false
    try {
      const { error: pagesError } = await supabaseClient
        .from('template_pages')
        .select('id')
        .limit(1)

      packagerOk = !pagesError
    } catch (error) {
      console.error('Packager health check failed:', error)
      packagerOk = false
    }

    const healthStatus = {
      registriesOk,
      composerOk,
      previewOk,
      packagerOk,
      timestamp: new Date().toISOString()
    }

    console.log('System health check result:', healthStatus)

    return new Response(
      JSON.stringify(healthStatus),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in system-template-gen-health:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        registriesOk: false,
        composerOk: false,
        previewOk: false,
        packagerOk: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})