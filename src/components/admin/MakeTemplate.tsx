import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Package, 
  Save, 
  Loader2, 
  CheckCircle,
  FileArchive,
  Image
} from 'lucide-react'
import { toast } from 'sonner'
import type { SeedFormData } from '@/components/admin/SeedForm'
import { packageTemplate, saveTemplateDraft } from '@/lib/template-packager'

interface MakeTemplateProps {
  seedData?: SeedFormData
  onTemplateSaved?: (templateId: string) => void
  className?: string
}

export function MakeTemplate({ 
  seedData, 
  onTemplateSaved, 
  className = '' 
}: MakeTemplateProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [isPackaging, setIsPackaging] = useState(false)
  const [packagedTemplate, setPackagedTemplate] = useState<any>(null)

  const canCreateTemplate = seedData && 
    seedData.brandName && 
    seedData.primaryColor && 
    seedData.vibes && 
    seedData.vibes.length > 0

  const handlePackageTemplate = async () => {
    if (!seedData || !templateName.trim()) return

    setIsPackaging(true)
    try {
      const templatePackage = await packageTemplate(
        seedData,
        templateName.trim(),
        templateDescription.trim() || undefined
      )
      
      setPackagedTemplate(templatePackage)
      toast.success('Template packaged successfully!')
    } catch (error) {
      console.error('Error packaging template:', error)
      toast.error('Failed to package template')
    } finally {
      setIsPackaging(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!packagedTemplate) return

    setIsPackaging(true)
    try {
      const templateId = await saveTemplateDraft(packagedTemplate, seedData?.brandName)
      
      toast.success('Template saved as draft!')
      setIsDialogOpen(false)
      setTemplateName('')
      setTemplateDescription('')
      setPackagedTemplate(null)
      
      if (onTemplateSaved) {
        onTemplateSaved(templateId)
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    } finally {
      setIsPackaging(false)
    }
  }

  const resetDialog = () => {
    setTemplateName('')
    setTemplateDescription('')
    setPackagedTemplate(null)
    setIsDialogOpen(false)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Make Template
        </CardTitle>
        <CardDescription>
          Package your design into a reusable TPKG template
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!canCreateTemplate ? (
          <div className="text-center py-6">
            <div className="text-muted-foreground mb-4">
              Complete your template configuration to create a package
            </div>
            <div className="space-y-2">
              {!seedData?.brandName && (
                <Badge variant="outline" className="text-xs">Missing: Brand Name</Badge>
              )}
              {!seedData?.primaryColor && (
                <Badge variant="outline" className="text-xs">Missing: Primary Color</Badge>
              )}
              {(!seedData?.vibes || seedData.vibes.length === 0) && (
                <Badge variant="outline" className="text-xs">Missing: Vibes</Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Template Summary */}
            <div className="p-3 rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm mb-2">Ready to Package</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Brand:</span>{' '}
                  <span className="font-medium">{seedData.brandName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Usage:</span>{' '}
                  <span className="font-medium capitalize">{seedData.usage}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Typography:</span>{' '}
                  <span className="font-medium">{seedData.typography?.name || 'Default'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Page Masters:</span>{' '}
                  <span className="font-medium">
                    {seedData.pageMasters?.cover && seedData.pageMasters?.body ? 'Configured' : 'Default'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Colorway:</span>{' '}
                  <span className="font-medium">{seedData.colorway?.name || 'Generated'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Assets:</span>{' '}
                  <span className="font-medium">{seedData.motifs?.assets?.length || 0} SVGs</span>
                </div>
              </div>
            </div>

            {/* TPKG Structure Preview */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">TPKG Structure</h4>
              <div className="text-xs font-mono bg-muted/50 rounded p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <FileArchive className="w-3 h-3" />
                  <span>template.json</span>
                  <Badge variant="outline" className="text-xs px-1">Manifest</Badge>
                </div>
                <div className="pl-5 space-y-1">
                  <div>assets/</div>
                  <div className="pl-3 space-y-0.5">
                    <div>body-bg.svg</div>
                    <div>divider.svg</div>
                    <div>cover-shape.svg</div>
                  </div>
                  <div>previews/</div>
                  <div className="pl-3 space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      cover.png
                    </div>
                    <div className="flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      body-2col.png
                    </div>
                    <div className="flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      data.png
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Create Template Button */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Package className="w-4 h-4 mr-2" />
                  Create Template Package
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Template Package</DialogTitle>
                  <DialogDescription>
                    Package your design into a reusable TPKG template with assets and previews.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="template-name">Template Name *</Label>
                    <Input
                      id="template-name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder={`${seedData.brandName} Template`}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="template-description">Description</Label>
                    <Textarea
                      id="template-description"
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="Describe the template's purpose and style..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  {packagedTemplate && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium text-sm">Template Packaged</span>
                      </div>
                      <div className="text-xs text-green-700 mt-1">
                        Ready to save as draft template
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="flex gap-2">
                  <Button variant="outline" onClick={resetDialog} disabled={isPackaging}>
                    Cancel
                  </Button>
                  
                  {!packagedTemplate ? (
                    <Button 
                      onClick={handlePackageTemplate}
                      disabled={!templateName.trim() || isPackaging}
                    >
                      {isPackaging ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Package className="w-4 h-4 mr-2" />
                      )}
                      Package Template
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSaveTemplate}
                      disabled={isPackaging}
                    >
                      {isPackaging ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save as Draft
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default MakeTemplate