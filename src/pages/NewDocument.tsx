import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTemplatesScoped, ScopedTemplate } from '@/hooks/useTemplatesScoped'
import { useTemplateApplication } from '@/hooks/useTemplateApplication'
import { Loader2, Search, Star, Globe, Building2, Eye, ArrowLeft, FileText, Palette, Building } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function NewDocument() {
  const { workspaceId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { templates, loading, error } = useTemplatesScoped()
  const { createFromTemplate, loading: creatingDocument } = useTemplateApplication()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDocType, setSelectedDocType] = useState<string>('')
  const [selectedStylePack, setSelectedStylePack] = useState<string>('')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [previewTemplate, setPreviewTemplate] = useState<ScopedTemplate | null>(null)

  const filterTemplates = (templateList: ScopedTemplate[]) => {
    return templateList.filter(template => {
      const matchesSearch = !searchQuery || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.category.toLowerCase().includes(searchQuery.toLowerCase())
      
      const docType = template.metadata?.docType || ''
      const stylePack = template.metadata?.stylePack || ''
      const industry = template.metadata?.industry || ''
      
      const matchesDocType = !selectedDocType || docType === selectedDocType
      const matchesStylePack = !selectedStylePack || stylePack === selectedStylePack
      const matchesIndustry = !selectedIndustry || industry === selectedIndustry
      
      return matchesSearch && matchesDocType && matchesStylePack && matchesIndustry
    })
  }

  const handleUseTemplate = async (template: ScopedTemplate) => {
    try {
      await createFromTemplate(template)
    } catch (error) {
      console.error('Failed to create document from template:', error)
    }
  }

  const handlePreview = (template: ScopedTemplate) => {
    setPreviewTemplate(template)
  }

  const handleCreateBlank = () => {
    navigate(`/w/${workspaceId}/documents/new/editor`)
  }

  // Get unique filter options
  const allTemplates = [...templates.globalFeatured, ...templates.globalAll, ...templates.workspace]
  const docTypes = [...new Set(allTemplates.map(t => t.metadata?.docType).filter(Boolean))]
  const stylePacks = [...new Set(allTemplates.map(t => t.metadata?.stylePack).filter(Boolean))]
  const industries = [...new Set(allTemplates.map(t => t.metadata?.industry).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <p>Error loading templates: {error}</p>
      </div>
    )
  }

  const filteredGlobalFeatured = filterTemplates(templates.globalFeatured)
  const filteredGlobalAll = filterTemplates(templates.globalAll)
  const filteredWorkspace = filterTemplates(templates.workspace)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate(`/w/${workspaceId}/documents`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documents
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Choose a Template</h1>
          <p className="text-muted-foreground">Start your document with a professional template or create from scratch</p>
        </div>
      </div>

      {/* Create Blank Option */}
      <div className="mb-8">
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
          <CardContent className="flex items-center justify-center py-8">
            <Button onClick={handleCreateBlank} size="lg">
              <FileText className="h-5 w-5 mr-2" />
              Create Blank Document
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedDocType} onValueChange={setSelectedDocType}>
          <SelectTrigger>
            <SelectValue placeholder="Document Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Document Types</SelectItem>
            {docTypes.map(docType => (
              <SelectItem key={docType} value={docType}>{docType}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStylePack} onValueChange={setSelectedStylePack}>
          <SelectTrigger>
            <SelectValue placeholder="Style Pack" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Style Packs</SelectItem>
            {stylePacks.map(stylePack => (
              <SelectItem key={stylePack} value={stylePack}>{stylePack}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
          <SelectTrigger>
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Industries</SelectItem>
            {industries.map(industry => (
              <SelectItem key={industry} value={industry}>{industry}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Featured Global Templates */}
      {filteredGlobalFeatured.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Featured Templates</h2>
            <Badge variant="outline">Global</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGlobalFeatured.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={() => handleUseTemplate(template)}
                onPreview={() => handlePreview(template)}
                loading={creatingDocument}
              />
            ))}
          </div>
        </section>
      )}

      {/* Workspace Templates */}
      {filteredWorkspace.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Workspace Templates</h2>
            <Badge variant="outline">This Workspace</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredWorkspace.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={() => handleUseTemplate(template)}
                onPreview={() => handlePreview(template)}
                loading={creatingDocument}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Global Templates */}
      {filteredGlobalAll.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">All Global Templates</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGlobalAll.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={() => handleUseTemplate(template)}
                onPreview={() => handlePreview(template)}
                loading={creatingDocument}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {filteredGlobalFeatured.length === 0 && filteredGlobalAll.length === 0 && filteredWorkspace.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p>No templates match your current search criteria.</p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery('')
              setSelectedDocType('')
              setSelectedStylePack('')
              setSelectedIndustry('')
            }}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal 
          template={previewTemplate}
          open={!!previewTemplate}
          onOpenChange={(open) => !open && setPreviewTemplate(null)}
          onUse={() => handleUseTemplate(previewTemplate)}
          loading={creatingDocument}
        />
      )}
    </div>
  )
}

interface TemplateCardProps {
  template: ScopedTemplate
  onUse: () => void
  onPreview: () => void
  loading: boolean
}

function TemplateCard({ template, onUse, onPreview, loading }: TemplateCardProps) {
  const scopeBadgeVariant = template.scope === 'global' ? 'secondary' : 'outline'
  const scopeIcon = template.scope === 'global' ? Globe : Building2
  const ScopeIcon = scopeIcon

  const docType = template.metadata?.docType
  const stylePack = template.metadata?.stylePack
  const industry = template.metadata?.industry

  return (
    <Card className="group cursor-pointer transition-all hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-medium line-clamp-2 leading-tight">
            {template.name}
          </CardTitle>
          <Badge variant={scopeBadgeVariant} className="text-xs shrink-0">
            <ScopeIcon className="h-3 w-3 mr-1" />
            {template.scope === 'global' ? 'Global' : 'Workspace'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="py-0">
        {/* Preview Image */}
        <div className="aspect-[4/3] bg-muted rounded-lg mb-3 overflow-hidden">
          {template.preview_image_url ? (
            <img 
              src={template.preview_image_url} 
              alt={template.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <FileText className="h-8 w-8" />
            </div>
          )}
        </div>

        {/* Description */}
        {template.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {template.description}
          </p>
        )}

        {/* Facets */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Template ID:</span>
            <span className="font-mono">{template.id.slice(0, 8)}</span>
          </div>
          
          {docType && (
            <div className="flex items-center gap-2">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">
                {docType}
              </Badge>
            </div>
          )}
          
          {stylePack && (
            <div className="flex items-center gap-2">
              <Palette className="h-3 w-3 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">
                {stylePack}
              </Badge>
            </div>
          )}
          
          {industry && (
            <div className="flex items-center gap-2">
              <Building className="h-3 w-3 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">
                {industry}
              </Badge>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {template.category}
          </Badge>
          <span>{template.usage_count} uses</span>
        </div>
      </CardContent>

      <CardFooter className="pt-4 flex gap-2">
        <Button 
          size="sm" 
          className="flex-1"
          onClick={onUse}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Use Template'}
        </Button>
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={onPreview}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

interface TemplatePreviewModalProps {
  template: ScopedTemplate
  open: boolean
  onOpenChange: (open: boolean) => void
  onUse: () => void
  loading: boolean
}

function TemplatePreviewModal({ template, open, onOpenChange, onUse, loading }: TemplatePreviewModalProps) {
  const scopeIcon = template.scope === 'global' ? Globe : Building2
  const ScopeIcon = scopeIcon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {template.name}
            <Badge variant={template.scope === 'global' ? 'secondary' : 'outline'} className="text-xs">
              <ScopeIcon className="h-3 w-3 mr-1" />
              {template.scope === 'global' ? 'Global' : 'Workspace'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          {/* Preview */}
          <div className="lg:col-span-2 flex flex-col">
            <h3 className="font-medium mb-3">Template Preview</h3>
            <div className="flex-1 bg-muted rounded-lg overflow-hidden">
              {template.preview_image_url ? (
                <img 
                  src={template.preview_image_url} 
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-2" />
                    <p>No preview available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Details</h3>
              {template.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {template.description}
                </p>
              )}
              
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Template ID</span>
                  <p className="font-mono text-sm">{template.id}</p>
                </div>
                
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Category</span>
                  <p className="text-sm">{template.category}</p>
                </div>
                
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Usage Count</span>
                  <p className="text-sm">{template.usage_count} times</p>
                </div>

                {template.metadata?.docType && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Document Type</span>
                    <p className="text-sm">{template.metadata.docType}</p>
                  </div>
                )}

                {template.metadata?.stylePack && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Style Pack</span>
                    <p className="text-sm">{template.metadata.stylePack}</p>
                  </div>
                )}

                {template.metadata?.industry && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Industry</span>
                    <p className="text-sm">{template.metadata.industry}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <Button 
                onClick={onUse} 
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Use This Template
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}