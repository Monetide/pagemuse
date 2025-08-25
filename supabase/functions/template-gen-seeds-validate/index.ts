import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SeedParam {
  docType: string
  stylePack: string
  industry: string
  [key: string]: any
}

interface ValidationResult {
  okCount: number
  missingModules: string[]
  createdModules: string[]
  badParams: Array<{ index: number; error: string; item: any }>
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
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    const url = new URL(req.url)
    const autoCreateMissing = url.searchParams.get('autoCreateMissing') === 'true'

    const { seeds } = await req.json()

    if (!Array.isArray(seeds)) {
      throw new Error('Seeds must be an array')
    }

    const result: ValidationResult = {
      okCount: 0,
      missingModules: [],
      createdModules: [],
      badParams: []
    }

    const registryTypes = ['docType', 'stylePack', 'industry'] as const
    const existingModules = new Map<string, Set<string>>()

    // Pre-fetch all existing modules
    for (const type of registryTypes) {
      const tableName = `template_registry_${type === 'docType' ? 'doc_types' : 
                         type === 'stylePack' ? 'style_packs' : 'industries'}`
      
      const { data, error } = await supabaseClient
        .from(tableName)
        .select('id')

      if (error) {
        console.error(`Error fetching ${type} registry:`, error)
        throw new Error(`Failed to fetch ${type} registry`)
      }

      existingModules.set(type, new Set(data?.map(item => item.id) || []))
    }

    // Process each seed
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i]

      try {
        // Validate seed structure
        if (!seed || typeof seed !== 'object') {
          result.badParams.push({
            index: i,
            error: 'Seed must be an object',
            item: seed
          })
          continue
        }

        const missingFields = registryTypes.filter(type => !seed[type])
        if (missingFields.length > 0) {
          result.badParams.push({
            index: i,
            error: `Missing required fields: ${missingFields.join(', ')}`,
            item: seed
          })
          continue
        }

        // Check if modules exist
        const missingModules: string[] = []
        for (const type of registryTypes) {
          const moduleId = seed[type]
          const typeModules = existingModules.get(type)!
          
          if (!typeModules.has(moduleId)) {
            const moduleKey = `${type}:${moduleId}`
            missingModules.push(moduleKey)
            
            if (!result.missingModules.includes(moduleKey)) {
              result.missingModules.push(moduleKey)
            }
          }
        }

        // If autoCreateMissing, create missing modules
        if (autoCreateMissing && missingModules.length > 0) {
          for (const moduleKey of missingModules) {
            const [type, id] = moduleKey.split(':')
            
            if (!result.createdModules.includes(moduleKey)) {
              // Call ensure endpoint to create missing module
              const ensureResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/template-gen-registry-ensure`, {
                method: 'POST',
                headers: {
                  'Authorization': req.headers.get('Authorization')!,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type, id })
              })

              if (!ensureResponse.ok) {
                const errorText = await ensureResponse.text()
                console.error(`Failed to create ${moduleKey}:`, errorText)
                result.badParams.push({
                  index: i,
                  error: `Failed to create missing module ${moduleKey}: ${errorText}`,
                  item: seed
                })
                continue
              }

              const ensureResult = await ensureResponse.json()
              if (ensureResult.created) {
                result.createdModules.push(moduleKey)
                // Update our local cache
                existingModules.get(type as any)!.add(id)
              }
            }
          }
        }

        // If we still have missing modules and autoCreate is false, mark as bad
        if (!autoCreateMissing && missingModules.length > 0) {
          result.badParams.push({
            index: i,
            error: `Missing modules: ${missingModules.join(', ')}`,
            item: seed
          })
          continue
        }

        // If we get here, the seed is valid
        result.okCount++

      } catch (error) {
        result.badParams.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
          item: seed
        })
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Validation error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})