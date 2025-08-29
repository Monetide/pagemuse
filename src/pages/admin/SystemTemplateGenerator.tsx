import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AdminGuard } from '@/components/auth/AdminGuard'
import { TemplateGalleryScoped } from '@/components/template/TemplateGalleryScoped'
import { ScopedTemplate } from '@/hooks/useTemplatesScoped'
import { SeedForm, SeedFormData } from '@/components/admin/SeedForm'
import { BatchComposer } from '@/components/admin/BatchComposer'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/use-toast'
import { Globe, Settings, Plus, Star, Sparkles, Loader2, Grid3X3 } from 'lucide-react'

export default function SystemTemplateGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<ScopedTemplate | null>(null)
  const [isFormValid, setIsFormValid] = useState(false)
  const [seedData, setSeedData] = useState<SeedFormData | null>(null)
  const [isComposing, setIsComposing] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [createdTemplate, setCreatedTemplate] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'generate' | 'batch' | 'gallery'>('generate')
  const { session } = useAuth()

  const handleEditTemplate = (template: ScopedTemplate) => {
    console.log('Edit template:', template.name)
    // TODO: Navigate to template editor
  }

  const handlePromoteTemplate = (template: ScopedTemplate) => {
    console.log('Promote template:', template.name)
    // TODO: Implement promotion logic
  }

  const handleUseTemplate = (template: ScopedTemplate) => {
    console.log('Use template:', template.name)
    // TODO: Implement template usage
  }

  const handleFormValidChange = (valid: boolean, data?: SeedFormData) => {
    setIsFormValid(valid)
    setSeedData(data || null)
  }

  const buildSeedFromFormData = (data: SeedFormData) => {
    const vibeOptions = [
      { id: 'modern', label: 'Modern', stylePack: 'professional' },
      { id: 'classic', label: 'Classic', stylePack: 'professional-serif' },
      { id: 'editorial', label: 'Editorial', stylePack: 'editorial' },
      { id: 'minimal', label: 'Minimal', stylePack: 'minimal' },
      { id: 'bold', label: 'Bold', stylePack: 'bold' },
      { id: 'technical', label: 'Technical', stylePack: 'technical' }
    ]
    
    const vibes = data.vibes || []
    const stylePacks = vibes.map(vibe => {
      const vibeOption = vibeOptions.find(v => v.id === vibe)
      return vibeOption?.stylePack || 'professional'
    })
    
    const stylePack = stylePacks[0] || 'professional'
    
    // Compute the template ID from the form data
    const templateId = `${data.usage || 'report'}.${stylePack}.${data.industry || 'tech-saas'}.v1`
    
    return {
      id: templateId,
      doc_type: data.usage || 'report',
      industry: data.industry || 'tech-saas', 
      style_pack: stylePack,
      palette_hints: {
        neutrals: 'cool',
        accentSaturation: 'medium',
        brandColor: data.primaryColor
      },
      scale: {
        fonts: data.typography ? {
          sans: data.typography.sans,
          serif: data.typography.serif
        } : undefined
      },
      motifs: data.motifs?.assets || [],
      chart_defaults: {
        numberFormat: 'standard',
        showGrid: true
      },
      snippets: [],
      type_pairing: data.typography ? [data.typography] : [],
      validation_preset: null
    }
  }

  const handleComposeDraft = async () => {
    if (!seedData || !session) return
    
    setIsComposing(true)
    try {
      const seed = buildSeedFromFormData(seedData)
      
      // Step 1: Ingest seed
      const { error: ingestError } = await supabase.functions.invoke(
        'system-template-gen-seeds-ingest',
        {
          body: { seeds: [seed] },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )
      
      if (ingestError) {
        throw new Error(`Ingest failed: ${ingestError.message}`)
      }
      
      // Step 2: Compose template
      const { data: composeResult, error: composeError } = await supabase.functions.invoke(
        'system-template-gen-seeds-compose',
        {
          body: { seedIds: [seed.id] },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )
      
      if (composeError) {
        throw new Error(`Compose failed: ${composeError.message}`)
      }
      
      const successfulResults = composeResult.results?.filter((r: any) => r.success) || []
      if (successfulResults.length > 0) {
        setCreatedTemplate(successfulResults[0])
        toast({ title: 'Global draft template created successfully!' })
      } else {
        throw new Error('No templates were created successfully')
      }
      
    } catch (error) {
      console.error('Compose draft error:', error)
      toast({ title: `Failed to create draft: ${error.message}` })
    } finally {
      setIsComposing(false)
    }
  }

  const handlePublish = async () => {
    if (!createdTemplate || !session) return
    
    setIsPublishing(true)
    try {
      // For global templates, we need to use a special workspace ID or handle differently
      const { error } = await supabase.functions.invoke(
        'templates-publish',
        {
          body: { 
            templateIds: [createdTemplate.templateId],
            workspaceId: '00000000-0000-0000-0000-000000000000' // Use global workspace ID
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )
      
      if (error) {
        throw new Error(`Publish failed: ${error.message}`)
      }
      
      toast({ title: 'Template published successfully!' })
      setCreatedTemplate(null) // Reset after publishing
      
    } catch (error) {
      console.error('Publish error:', error)
      toast({ title: `Failed to publish: ${error.message}` })
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <AdminGuard>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">System Template Generator</h1>
                <Badge variant="secondary" className="mt-1">
                  <Star className="w-3 h-3 mr-1" />
                  System Admin
                </Badge>
              </div>
            </div>
            <p className="text-muted-foreground">
              Create and manage global templates available to all users
            </p>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-2">
            <Button 
              variant={activeTab === 'generate' ? 'default' : 'outline'}
              onClick={() => setActiveTab('generate')}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate
            </Button>
            <Button 
              variant={activeTab === 'batch' ? 'default' : 'outline'}
              onClick={() => setActiveTab('batch')}
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              Batch
            </Button>
            <Button 
              variant={activeTab === 'gallery' ? 'default' : 'outline'}
              onClick={() => setActiveTab('gallery')}
            >
              <Globe className="w-4 h-4 mr-2" />
              Gallery
            </Button>
          </div>
        </div>

        {/* System Brand Kit Notice */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-900">System Brand Kit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800">
              Global templates use a neutral System Brand Kit for previews. 
              When users apply these templates, their workspace's default brand kit will be applied.
            </p>
          </CardContent>
        </Card>

        {/* Content based on active tab */}
        {activeTab === 'generate' ? (
          <div className="flex gap-6">
            {/* Main Content - SeedForm */}
            <div className="flex-1">
              <SeedForm 
                onValidChange={handleFormValidChange}
                scope="global"
              />
            </div>

            {/* Right Rail - Actions */}
            <div className="w-80 space-y-4">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                  <CardDescription>
                    Generate and publish global templates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Compose & Save Draft Button */}
                  <Button
                    onClick={handleComposeDraft}
                    disabled={!isFormValid || isComposing || isPublishing}
                    className="w-full"
                    size="lg"
                  >
                    {isComposing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    {isComposing ? 'Composing...' : 'Compose & Save Draft (Global)'}
                  </Button>

                  {/* Publish Button */}
                  <Button
                    onClick={handlePublish}
                    disabled={!createdTemplate || isPublishing || isComposing}
                    variant="secondary"
                    className="w-full"
                    size="lg"
                  >
                    {isPublishing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Globe className="w-4 h-4 mr-2" />
                    )}
                    {isPublishing ? 'Publishing...' : 'Publish'}
                  </Button>

                  {/* Status Messages */}
                  {!isFormValid && (
                    <p className="text-sm text-muted-foreground">
                      Complete the form to enable composing
                    </p>
                  )}
                  
                  {createdTemplate && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800 font-medium">
                        Draft Created: {createdTemplate.templateName}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Ready to publish
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : activeTab === 'batch' ? (
          /* Batch Composer */
          <BatchComposer />
        ) : (
          /* Template Gallery */
          <TemplateGalleryScoped
            onUseTemplate={handleUseTemplate}
            onEditTemplate={handleEditTemplate}
            onPromoteTemplate={handlePromoteTemplate}
          />
        )}
      </div>
    </AdminGuard>
  )
}