import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTemplateApplication } from '@/hooks/useTemplateApplication'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { ScopedTemplate } from '@/hooks/useTemplatesScoped'
import { Sparkles, FileText, Palette, Building2, ArrowRight } from 'lucide-react'

interface QuickComposeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Mock registry data - in real implementation, these would come from template_registry_* tables
const docTypes = [
  { id: 'business-report', name: 'Business Report', description: 'Professional quarterly and annual reports' },
  { id: 'proposal', name: 'Proposal', description: 'Project proposals and business pitches' },
  { id: 'newsletter', name: 'Newsletter', description: 'Company newsletters and communications' },
  { id: 'presentation', name: 'Presentation', description: 'Slide decks and presentations' }
]

const stylePacks = [
  { id: 'corporate', name: 'Corporate', description: 'Clean, professional styling' },
  { id: 'modern', name: 'Modern', description: 'Contemporary design with bold typography' },
  { id: 'minimal', name: 'Minimal', description: 'Simple, focused layouts' },
  { id: 'creative', name: 'Creative', description: 'Artistic and expressive designs' }
]

const industries = [
  { id: 'technology', name: 'Technology', description: 'Tech companies and startups' },
  { id: 'finance', name: 'Finance', description: 'Banks, investment firms, fintech' },
  { id: 'healthcare', name: 'Healthcare', description: 'Medical, pharmaceutical, wellness' },
  { id: 'consulting', name: 'Consulting', description: 'Professional services' }
]

export function QuickComposeDialog({ open, onOpenChange }: QuickComposeDialogProps) {
  const [title, setTitle] = useState('')
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null)
  const [selectedStylePack, setSelectedStylePack] = useState<string | null>(null)
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const { createFromTemplate, loading } = useTemplateApplication()
  const { currentWorkspace } = useWorkspaceContext()

  const canCreate = title.trim() && selectedDocType && selectedStylePack && selectedIndustry

  const handleCreate = async () => {
    if (!canCreate) return

    try {
      // Generate a document based on the selections
      // In real implementation, this would use the template registry to compose a document
      const composedTemplate: ScopedTemplate = {
        id: 'quick-compose-generated',
        name: `${selectedDocType} Template`,
        description: `Generated from ${selectedStylePack} style pack for ${selectedIndustry} industry`,
        category: selectedDocType,
        scope: 'workspace',
        workspace_id: currentWorkspace?.id,
        template_slug: `${selectedDocType}-${selectedStylePack}-${selectedIndustry}`,
        is_premium: false,
        global_styling: {},
        metadata: {},
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await createFromTemplate(composedTemplate, title)
      onOpenChange(false)
      
      // Reset form
      setTitle('')
      setSelectedDocType(null)
      setSelectedStylePack(null)
      setSelectedIndustry(null)
    } catch (error) {
      console.error('Error creating document:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Quick Compose
          </DialogTitle>
          <DialogDescription>
            Create a new document by selecting document type, style, and industry
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Title */}
          <div className="grid gap-2">
            <Label htmlFor="document-title">Document Title</Label>
            <Input
              id="document-title"
              placeholder="Enter document title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Document Type Selection */}
          <div className="space-y-3">
            <Label>Document Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {docTypes.map((docType) => (
                <Card
                  key={docType.id}
                  className={`cursor-pointer transition-all ${
                    selectedDocType === docType.id
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedDocType(docType.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <CardTitle className="text-sm">{docType.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs">
                      {docType.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Style Pack Selection */}
          <div className="space-y-3">
            <Label>Style Pack</Label>
            <div className="grid grid-cols-2 gap-3">
              {stylePacks.map((stylePack) => (
                <Card
                  key={stylePack.id}
                  className={`cursor-pointer transition-all ${
                    selectedStylePack === stylePack.id
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedStylePack(stylePack.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      <CardTitle className="text-sm">{stylePack.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs">
                      {stylePack.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Industry Selection */}
          <div className="space-y-3">
            <Label>Industry</Label>
            <div className="grid grid-cols-2 gap-3">
              {industries.map((industry) => (
                <Card
                  key={industry.id}
                  className={`cursor-pointer transition-all ${
                    selectedIndustry === industry.id
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedIndustry(industry.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <CardTitle className="text-sm">{industry.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs">
                      {industry.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Summary */}
          {canCreate && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Ready to create:</p>
                    <p className="text-sm text-muted-foreground">
                      {title} • {docTypes.find(d => d.id === selectedDocType)?.name} • {stylePacks.find(s => s.id === selectedStylePack)?.name} • {industries.find(i => i.id === selectedIndustry)?.name}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Quick Compose
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!canCreate || loading}
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Document
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}