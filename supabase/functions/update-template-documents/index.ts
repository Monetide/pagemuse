import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdateRequest {
  templateId: string
  brandKitId: string
  followUpdates: boolean
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { templateId, brandKitId, followUpdates }: UpdateRequest = await req.json()

    if (!templateId || !brandKitId) {
      return new Response(
        JSON.stringify({ error: 'Missing templateId or brandKitId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Starting background update for template ${templateId} with brand kit ${brandKitId}`)

    // Start background task to update documents
    EdgeRuntime.waitUntil(updateTemplateDocuments(supabaseClient, templateId, brandKitId, followUpdates))

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document update job started in background' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in update-template-documents function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function updateTemplateDocuments(
  supabaseClient: any,
  templateId: string,
  brandKitId: string,
  followUpdates: boolean
) {
  try {
    console.log(`Fetching documents for template ${templateId}`)

    // Get all documents using this template that aren't deleted
    const { data: documents, error: docsError } = await supabaseClient
      .from('documents')
      .select('id, user_id, title')
      .eq('template_id', templateId)
      .is('deleted_at', null)

    if (docsError) {
      console.error('Error fetching documents:', docsError)
      return
    }

    if (!documents || documents.length === 0) {
      console.log('No documents found for template')
      return
    }

    console.log(`Found ${documents.length} documents to update`)

    // Get the brand kit data
    const { data: brandKit, error: brandKitError } = await supabaseClient
      .from('brand_kits')
      .select('*')
      .eq('id', brandKitId)
      .single()

    if (brandKitError || !brandKit) {
      console.error('Error fetching brand kit:', brandKitError)
      return
    }

    let updatedCount = 0
    let errorCount = 0

    // Process documents in batches to avoid overwhelming the system
    const batchSize = 10
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(async (doc) => {
          try {
            // Check if document already has a kit application that follows updates
            const { data: existingApp, error: appError } = await supabaseClient
              .from('kit_applications')
              .select('*')
              .eq('target_type', 'document')
              .eq('target_id', doc.id)
              .eq('follow_updates', true)
              .maybeSingle()

            if (appError && appError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
              console.error(`Error checking existing application for doc ${doc.id}:`, appError)
              errorCount++
              return
            }

            // Only update if document has follow_updates enabled or no existing application
            if (!existingApp || existingApp.follow_updates) {
              // Create snapshot for rollback
              const snapshot = {
                brandKit: brandKit,
                appliedAt: new Date().toISOString(),
                appliedFrom: 'template_update',
                templateId: templateId,
                previousApplication: existingApp || null
              }

              if (existingApp) {
                // Update existing application
                const { error: updateError } = await supabaseClient
                  .from('kit_applications')
                  .update({
                    brand_kit_id: brandKitId,
                    follow_updates: followUpdates,
                    snapshot: snapshot
                  })
                  .eq('id', existingApp.id)

                if (updateError) {
                  console.error(`Error updating application for doc ${doc.id}:`, updateError)
                  errorCount++
                  return
                }
              } else {
                // Create new application
                const { error: insertError } = await supabaseClient
                  .from('kit_applications')
                  .insert({
                    target_type: 'document',
                    target_id: doc.id,
                    brand_kit_id: brandKitId,
                    follow_updates: followUpdates,
                    applied_by: doc.user_id, // Use document owner as the applier
                    snapshot: snapshot
                  })

                if (insertError) {
                  console.error(`Error creating application for doc ${doc.id}:`, insertError)
                  errorCount++
                  return
                }
              }

              updatedCount++
              console.log(`Updated document ${doc.id} (${doc.title})`)
            } else {
              console.log(`Skipped document ${doc.id} - doesn't follow updates`)
            }
          } catch (error) {
            console.error(`Error processing document ${doc.id}:`, error)
            errorCount++
          }
        })
      )

      // Small delay between batches to avoid rate limits
      if (i + batchSize < documents.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Log the activity to workspace activities
    try {
      const { error: activityError } = await supabaseClient
        .from('workspace_activities')
        .insert({
          workspace_id: brandKit.workspace_id,
          user_id: brandKit.created_by,
          activity_type: 'template_brand_kit_applied',
          description: `Applied brand kit "${brandKit.name}" to template and ${updatedCount} documents`,
          metadata: {
            templateId: templateId,
            brandKitId: brandKitId,
            documentsUpdated: updatedCount,
            documentsErrored: errorCount,
            totalDocuments: documents.length
          }
        })

      if (activityError) {
        console.error('Error logging activity:', activityError)
      }
    } catch (activityLogError) {
      console.error('Error in activity logging:', activityLogError)
    }

    console.log(`Completed template document update: ${updatedCount} updated, ${errorCount} errors`)

  } catch (error) {
    console.error('Error in updateTemplateDocuments:', error)
    
    // Try to log the error
    try {
      await supabaseClient
        .from('workspace_activities')
        .insert({
          workspace_id: null, // We don't have access to workspace_id in error case
          user_id: null,
          activity_type: 'template_brand_kit_error',
          description: `Failed to apply brand kit to template ${templateId}`,
          metadata: {
            error: error.message,
            templateId: templateId,
            brandKitId: brandKitId
          }
        })
    } catch (logError) {
      console.error('Error logging error activity:', logError)
    }
  }
}