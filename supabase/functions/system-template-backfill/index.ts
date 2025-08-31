import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Exponential backoff retry function
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

// Build TPKG from template metadata
function buildTPKGFromTemplate(template: any): { tpkg: any, config: any } {
  const templateId = template.template_slug || template.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  
  const templateManifest = {
    id: templateId,
    name: template.name,
    version: "1.0.0",
    themeTokens: template.global_styling?.palette || {},
    objectStyles: {
      text: { fontFamily: template.global_styling?.typography || [] },
      headings: { scale: template.global_styling?.scale || {} }
    },
    pageMasters: [
      { id: "cover", name: "Cover Page", type: "cover" },
      { id: "body-1col", name: "Body 1-Column", type: "body", columns: 1 },
      { id: "body-2col", name: "Body 2-Column", type: "body", columns: 2 }
    ],
    layoutIntents: {
      [template.category]: {
        defaultMaster: "body-1col",
        coverMaster: "cover"
      }
    },
    snippets: [],
    starterContent: [
      { section: "cover", title: "Document Title", subtitle: "Subtitle" },
      { section: "body", content: "Initial content paragraph" }
    ],
    motifs: template.global_styling?.motifs || {},
    exportDefaults: { format: "pdf", quality: "high" },
    validationPreset: "default"
  }

  const tpkg = {
    "template.json": templateManifest,
    assets: ["assets/body-bg.svg", "assets/divider.svg", "assets/cover-shape.svg"],
    previews: ["previews/cover.png", "previews/body-2col.png", "previews/data.png"]
  }

  // Config is the same as template.json (no binaries)
  const config = templateManifest

  return { tpkg, config }
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

    // Check if user has admin role
    const { data: roles, error: roleErr } = await supabaseClient.rpc('get_user_roles', { _user_id: user.id })
    const isAdmin = Array.isArray(roles) && roles.some((r: any) => r.role === 'admin')

    if (roleErr || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { page = 0, pageSize = 50 } = await req.json().catch(() => ({}))

    console.log(`Backfill global templates requested by admin ${user.id}, page: ${page}, pageSize: ${pageSize}`)

    // Get current Git SHA or use timestamp as compose version
    const composeVersion = Deno.env.get('DENO_DEPLOYMENT_ID') || `backfill-${Date.now()}`

    let totalProcessed = 0
    let totalFixed = 0
    const failed: Array<{ templateId: string, reason: string }> = []
    
    // Process templates in batches with pagination
    let hasMore = true
    let currentPage = page
    
    while (hasMore) {
      // Find templates that need backfilling
      const { data: brokenTemplates, error: queryError } = await retryWithBackoff(async () => {
        return await supabaseClient
          .from('templates')
          .select('*')
          .eq('scope', 'global')
          .or('tpkg_source.is.null,config.is.null')
          .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1)
      })

      if (queryError) {
        console.error('Failed to fetch broken templates:', queryError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch broken templates', details: queryError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!brokenTemplates || brokenTemplates.length === 0) {
        hasMore = false
        break
      }

      console.log(`Processing ${brokenTemplates.length} templates on page ${currentPage}`)

      // Process each broken template
      for (const template of brokenTemplates) {
        totalProcessed++
        
        try {
          console.log(`Backfilling template: ${template.name} (${template.id})`)
          
          // Build TPKG and config from existing template data
          const { tpkg, config } = buildTPKGFromTemplate(template)

          // Update template with backfilled data
          await retryWithBackoff(async () => {
            const { error: updateError } = await supabaseClient
              .from('templates')
              .update({
                tpkg_source: tpkg,
                config: config,
                tpkg_version: '1',
                compose_version: composeVersion,
                packaged_at: new Date().toISOString()
              })
              .eq('id', template.id)

            if (updateError) {
              throw new Error(`Failed to update template: ${updateError.message}`)
            }
          })

          totalFixed++
          console.log(`Successfully backfilled template: ${template.name}`)

        } catch (error) {
          console.error(`Failed to backfill template ${template.id}:`, error)
          failed.push({
            templateId: template.id,
            reason: error.message
          })
        }
      }

      // Check if we have more pages to process
      if (brokenTemplates.length < pageSize) {
        hasMore = false
      } else {
        currentPage++
      }

      // For single page requests, break after first iteration
      if (page >= 0) {
        hasMore = false
      }
    }

    console.log(`Backfill completed: ${totalFixed}/${totalProcessed} templates fixed`)

    return new Response(
      JSON.stringify({
        success: true,
        total: totalProcessed,
        fixed: totalFixed,
        failed: failed,
        metadata: {
          composeVersion,
          processedAt: new Date().toISOString(),
          page: currentPage,
          pageSize
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in system-template-backfill:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})