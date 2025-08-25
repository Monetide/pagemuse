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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
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

    const url = new URL(req.url)
    const type = url.pathname.split('/').pop()

    if (!type || !['docType', 'stylePack', 'industry'].includes(type)) {
      return new Response('Invalid registry type', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    let tableName: string
    switch (type) {
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
        return new Response('Invalid registry type', { 
          status: 400, 
          headers: corsHeaders 
        })
    }

    const { data, error } = await supabaseClient
      .from(tableName)
      .select('id')
      .order('id')

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        ids: data?.map(item => item.id) || [] 
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