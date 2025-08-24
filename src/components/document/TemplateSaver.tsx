import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Save, 
  Package, 
  CheckCircle, 
  Loader2, 
  Palette, 
  Type, 
  Layout, 
  Sparkles
} from 'lucide-react'
import { SemanticDocument } from '@/lib/document-model'
import { packageTemplate, saveTemplateDraft } from '@/lib/template-packager'
import { useToast } from '@/hooks/use-toast'

interface TemplateSaverProps {
  isOpen: boolean
  onClose: () => void
  document: SemanticDocument
  onTemplateSaved: (templateId: string) => void
}

export const TemplateSaver = ({
  isOpen,
  onClose,
  document,
  onTemplateSaved
}: TemplateSaverProps) => {
  const [templateName, setTemplateName] = useState(`${document.title} Template`)
  const [templateDescription, setTemplateDescription] = useState('')
  const [category, setCategory] = useState('custom')
  const [isPackaging, setIsPackaging] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [packagedTemplate, setPackagedTemplate] = useState<any>(null)
  
  const { toast } = useToast()

  const categories = [
    { id: 'custom', name: 'Custom', description: 'Personal template' },
    { id: 'business', name: 'Business', description: 'Corporate documents' },
    { id: 'report', name: 'Report', description: 'Data and analytics' },
    { id: 'presentation', name: 'Presentation', description: 'Slides and decks' },
    { id: 'newsletter', name: 'Newsletter', description: 'Communications' }
  ]

  // Extract current design elements from document
  const designElements = {
    colorways: ['Primary brand colors', 'Accent palette', 'Semantic colors'],
    typography: ['Heading styles', 'Body text', 'Caption styles'],
    pageMasters: ['Cover layout', 'Content pages', 'Section breaks'],
    objectStyles: ['Figure formatting', 'Table styles', 'Callout designs']
  }

  const handlePackage = async () => {
    if (!templateName.trim()) {
      toast({
        title: 'Template name required',
        description: 'Please enter a name for your template',
        variant: 'destructive'
      })
      return
    }

    setIsPackaging(true)
    try {
      // Create seed data from current document design
      const seedData = extractSeedDataFromDocument(document)
      
      const templatePackage = await packageTemplate(
        seedData,
        templateName.trim(),
        templateDescription.trim()
      )
      
      setPackagedTemplate(templatePackage)
      
      toast({
        title: 'Template packaged',
        description: 'Your template has been packaged successfully'
      })
    } catch (error: any) {
      toast({
        title: 'Packaging failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsPackaging(false)
    }
  }

  const handleSave = async () => {
    if (!packagedTemplate) return

    setIsSaving(true)
    try {
      const templateId = await saveTemplateDraft(packagedTemplate, document.title)
      
      onTemplateSaved(templateId)
      
      toast({
        title: 'Template saved',
        description: 'Your template has been saved as a draft and can be reused'
      })
      
      onClose()
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Helper function to extract seed data from document
  const extractSeedDataFromDocument = (doc: SemanticDocument) => {
    // This would extract design tokens, styles, and structure from the document
    // For now, we'll create a minimal seed data structure
    return {
      brandName: doc.title,
      primaryColor: '#0066cc',
      vibes: ['professional', 'modern'],
      usage: 'whitepaper' as const,
      typography: {
        id: 'inter',
        name: 'Inter',
        sans: {
          name: 'Inter',
          family: 'Inter, sans-serif'
        }
      },
      motif: {
        id: 'rectangle',
        name: 'Rectangle',
        svg: '<rect width="100" height="60" fill="currentColor" />'
      },
      layoutIntent: 'professional',
      pageMaster: 'standard',
      objectStyles: {
        styles: {},
        snippets: []
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Save className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Save as Template</DialogTitle>
              <DialogDescription>
                Create a reusable template from your current document design
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Design Summary */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Design Elements to Capture
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {Object.entries(designElements).map(([key, items]) => (
                  <div key={key}>
                    <p className="font-medium text-muted-foreground capitalize mb-1">
                      {key === 'pageMasters' ? 'Page Masters' : key === 'objectStyles' ? 'Object Styles' : key}
                    </p>
                    <ul className="space-y-1">
                      {items.map((item, index) => (
                        <li key={index} className="flex items-center gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Template Details Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name *</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter template name..."
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateDescription">Description</Label>
              <Textarea
                id="templateDescription"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe when and how to use this template..."
                className="w-full h-20 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant={category === cat.id ? 'default' : 'secondary'}
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => setCategory(cat.id)}
                  >
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Package Summary */}
          {packagedTemplate && (
            <>
              <Separator />
              <Card className="bg-green-50/50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-800">Template Package Ready</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Template contains {Object.keys(packagedTemplate.assets).length} assets 
                    and complete style definitions. Ready to save as draft.
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            {!packagedTemplate ? (
              <Button 
                onClick={handlePackage}
                disabled={isPackaging || !templateName.trim()}
                className="flex items-center gap-2"
              >
                {isPackaging && <Loader2 className="w-4 h-4 animate-spin" />}
                <Package className="w-4 h-4" />
                Package Template
              </Button>
            ) : (
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-primary hover:shadow-glow transition-all duration-200 flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                Save as Draft
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}