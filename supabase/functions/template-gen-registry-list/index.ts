import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get and verify JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt)

    if (authError || !user) {
      throw new Error('Invalid token')
    }

    // Check if user has admin role
    const { data: userRoles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    if (roleError) {
      throw new Error('Error checking user roles')
    }

    const isAdmin = userRoles?.some(r => r.role === 'admin')
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract registry type from URL path
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const registryType = pathParts[pathParts.length - 1]

    console.log(`Admin user ${user.email} requesting registry list for type: ${registryType}`)

    let tableName: string
    switch (registryType) {
      case 'docType':
        tableName = 'template_registry_doc_types'
        break
      case 'stylePack':
        tableName = 'template_registry_style_packs'
        break
      case 'industry':
        tableName = 'template_registry_industries'
        break
      default:
        return new Response(
          JSON.stringify({ error: `Invalid registry type: ${registryType}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    // Query the registry table
    const { data: registryEntries, error: queryError } = await supabaseClient
      .from(tableName)
      .select('id')
      .order('id')

    if (queryError) {
      console.error('Database query error:', queryError)
      throw new Error(`Failed to query ${tableName}: ${queryError.message}`)
    }

    const ids = registryEntries?.map(entry => entry.id) || []
    console.log(`Found ${ids.length} entries in ${tableName}:`, ids)

    return new Response(
      JSON.stringify({ ids }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Registry list error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})