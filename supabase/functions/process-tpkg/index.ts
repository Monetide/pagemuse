import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TPKGManifest {
  name: string
  version: string
  description?: string
  category: string
  author?: string
  preview?: string
  assets?: string[]
  themeTokens?: Record<string, any>
  objectStyles?: Record<string, any>
  metadata?: Record<string, any>
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Processing TPKG upload request')

    // Get the uploaded file from form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file) {
      throw new Error('No file provided')
    }

    if (!userId) {
      throw new Error('No user ID provided')
    }

    console.log(`Processing file: ${file.name}, size: ${file.size}`)

    // Validate file extension
    if (!file.name.endsWith('.tpkg') && !file.name.endsWith('.zip')) {
      throw new Error('Invalid file type. Expected .tpkg or .zip file')
    }

    // Convert file to array buffer for processing
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // For this implementation, we'll use a simplified approach
    // In a full implementation, you'd use a zip library to extract files
    // For now, we'll assume the client sends us the manifest data separately
    const manifestData = formData.get('manifest') as string
    
    if (!manifestData) {
      throw new Error('No manifest data provided')
    }

    const manifest: TPKGManifest = JSON.parse(manifestData)
    console.log('Parsed manifest:', manifest)

    // Validate required fields
    if (!manifest.name || !manifest.category) {
      throw new Error('Template manifest is missing required fields (name, category)')
    }

    // Create template in database with draft status
    const templateData = {
      name: manifest.name,
      description: manifest.description || '',
      category: manifest.category,
      is_global: true,
      is_premium: false,
      status: 'draft',
      user_id: userId,
      global_styling: {
        themeTokens: manifest.themeTokens || {},
        objectStyles: manifest.objectStyles || {}
      },
      metadata: {
        ...manifest.metadata,
        author: manifest.author,
        version: manifest.version,
        tpkgSource: true
      },
      tpkg_source: {
        originalFile: file.name,
        manifest: manifest,
        uploadedAt: new Date().toISOString()
      },
      usage_count: 0
    }

    const { data: template, error: templateError } = await supabase
      .from('templates')
      .insert(templateData)
      .select()
      .single()

    if (templateError) {
      console.error('Error creating template:', templateError)
      throw new Error(`Failed to create template: ${templateError.message}`)
    }

    console.log('Template created successfully:', template.id)

    // If there's a preview image, store it
    let previewUrl = null
    if (manifest.preview && file.size > 0) {
      // In a real implementation, you'd extract the preview from the zip
      // For now, we'll just reference it
      previewUrl = `/template-assets/${template.id}/preview.jpg`
    }

    // Update template with preview URL if available
    if (previewUrl) {
      await supabase
        .from('templates')
        .update({ preview_image_url: previewUrl })
        .eq('id', template.id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        template: {
          id: template.id,
          name: template.name,
          category: template.category,
          status: template.status,
          preview_url: previewUrl
        },
        message: 'TPKG processed successfully'
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error processing TPKG:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to process TPKG'
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 400
      }
    )
  }
})