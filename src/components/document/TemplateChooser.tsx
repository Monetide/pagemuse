import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  Palette, 
  Undo2, 
  Eye, 
  Wand2,
  Filter,
  Grid3x3,
  List
} from 'lucide-react'
import { SemanticDocument } from '@/lib/document-model'
import { useDocuments, Template } from '@/hooks/useSupabaseData'
import { useTemplateApplication } from '@/hooks/useTemplateApplication'
import type { ScopedTemplate } from '@/hooks/useTemplatesScoped'
import { TemplatePreview } from '@/components/template/TemplatePreview'

interface TemplateChooserProps {
  isOpen: boolean
  onClose: () => void
  document: SemanticDocument
  onTemplateApply: (templateId: string) => void
}

export const TemplateChooser = ({
  isOpen,
  onClose,
  document,
  onTemplateApply
}: TemplateChooserProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  
// Temporary mock data until we have real templates
  const templates: Template[] = [
    { id: '1', name: 'Business Report', description: 'Professional business template', category: 'business' },
    { id: '2', name: 'Newsletter', description: 'Newsletter template', category: 'newsletter' }
  ] as Template[]
  const loading = false
  const { createFromTemplate, loading: applying } = useTemplateApplication()

  const categories = [
    { id: 'all', name: 'All Templates', count: templates.length },
    { id: 'business', name: 'Business', count: templates.filter(t => t.category === 'business').length },
    { id: 'report', name: 'Reports', count: templates.filter(t => t.category === 'report').length },
    { id: 'presentation', name: 'Presentations', count: templates.filter(t => t.category === 'presentation').length },
    { id: 'newsletter', name: 'Newsletters', count: templates.filter(t => t.category === 'newsletter').length },
  ]

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleApplyTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    // Convert Template to ScopedTemplate
    const scopedTemplate: ScopedTemplate = {
      ...template,
      scope: template.is_global ? 'global' : 'workspace',
      template_slug: template.name.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-')
    }

    try {
      await createFromTemplate(scopedTemplate, document.title)
      onTemplateApply(templateId)
    } catch (error) {
      console.error('Failed to apply template:', error)
    }
  }

  const handlePreview = (templateId: string) => {
    setSelectedTemplate(templateId)
    setShowPreview(true)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Palette className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Try Another Template</DialogTitle>
                <DialogDescription>
                  Re-style your content with a different design template. Your content and Brand Kit will be preserved.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Template Warning */}
            <Card className="border-l-4 border-l-orange-400 bg-orange-50/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Undo2 className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">One-Click Undo Available</p>
                    <p className="text-sm text-orange-700">
                      Applying a new template creates a single undo step to revert all changes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'secondary'}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name} ({category.count})
                </Badge>
              ))}
            </div>

            <Separator />

            {/* Templates Grid/List */}
            <ScrollArea className="h-96">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <Card key={template.id} className="group cursor-pointer hover:shadow-md transition-all">
                      <CardHeader className="pb-2">
                        <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-md flex items-center justify-center">
                          <Wand2 className="w-8 h-8 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <CardTitle className="text-sm">{template.name}</CardTitle>
                          <CardDescription className="text-xs line-clamp-2">
                            {template.description}
                          </CardDescription>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handlePreview(template.id)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleApplyTemplate(template.id)}
                            disabled={applying}
                          >
                            <Palette className="w-3 h-3 mr-1" />
                            Apply
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map((template) => (
                    <Card key={template.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {template.description}
                            </p>
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {template.category}
                            </Badge>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handlePreview(template.id)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Preview
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleApplyTemplate(template.id)}
                              disabled={applying}
                            >
                              <Palette className="w-3 h-3 mr-1" />
                              Apply
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {!loading && filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                  <Wand2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium text-muted-foreground">No templates found</h3>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Preview Modal - Simplified */}
      {showPreview && selectedTemplate && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Template Preview</DialogTitle>
            </DialogHeader>
            <div className="p-4 text-center">
              <p>Preview for template: {selectedTemplate}</p>
              <Button onClick={() => {
                handleApplyTemplate(selectedTemplate)
                setShowPreview(false)
              }}>Apply Template</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}