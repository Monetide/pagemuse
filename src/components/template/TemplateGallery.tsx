import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Search, 
  Palette, 
  Users,
  Crown,
  Eye,
  FileText,
  Grid3X3,
  List,
  Plus
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Template } from '@/hooks/useSupabaseData'
import { TemplatePreview } from './TemplatePreview'

interface TemplateGalleryProps {
  templates: Template[]
  loading: boolean
  mode: 'new' | 'apply'
  onUseTemplate: (template: Template) => void
  onApplyTemplate?: (template: Template) => void
  onDuplicateTemplate?: (template: Template) => void
  showDuplicateAction?: boolean
}

export function TemplateGallery({ 
  templates, 
  loading, 
  mode, 
  onUseTemplate,
  onApplyTemplate,
  onDuplicateTemplate,
  showDuplicateAction = false
}: TemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)

  const categories = ['all', ...new Set(templates.map(t => t.category))]

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleUseTemplate = (template: Template) => {
    if (mode === 'apply' && onApplyTemplate) {
      onApplyTemplate(template)
    } else {
      onUseTemplate(template)
    }
  }

  const TemplateCard = ({ template }: { template: Template }) => (
    <Card className="border-0 shadow-soft hover:shadow-medium transition-all duration-200 group">
      <CardContent className="p-0">
        <div className="aspect-video bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-t-lg relative overflow-hidden">
          {template.preview_image_url ? (
            <img 
              src={template.preview_image_url} 
              alt={template.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="w-12 h-12 text-primary/50" />
            </div>
          )}
          {template.is_premium && (
            <Badge className="absolute top-3 right-3 bg-yellow-500 text-white">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPreviewTemplate(template)}
              className="bg-white/90 hover:bg-white text-black"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-2">{template.name}</h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {template.description || 'A beautiful template for your next project'}
          </p>
          <div className="flex flex-wrap gap-1 mb-3">
            <Badge variant="secondary" className="text-xs">
              {template.category}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              {template.usage_count} uses
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewTemplate(template)}
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              {showDuplicateAction && onDuplicateTemplate ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDuplicateTemplate(template)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Duplicate
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  onClick={() => handleUseTemplate(template)}
                  className="hover:shadow-soft transition-all"
                >
                  {mode === 'apply' ? 'Apply' : 'Use Template'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const TemplateListItem = ({ template }: { template: Template }) => (
    <Card className="border-0 shadow-soft hover:shadow-medium transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden">
            {template.preview_image_url ? (
              <img 
                src={template.preview_image_url} 
                alt={template.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <FileText className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">{template.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {template.description || 'A beautiful template for your next project'}
                </p>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="text-xs">
                    {template.category}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    {template.usage_count} uses
                  </span>
                  {template.is_premium && (
                    <Badge className="bg-yellow-500 text-white text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewTemplate(template)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                {showDuplicateAction && onDuplicateTemplate ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDuplicateTemplate(template)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Duplicate
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => handleUseTemplate(template)}
                    className="hover:shadow-soft transition-all"
                  >
                    {mode === 'apply' ? 'Apply' : 'Use Template'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-6">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <div>
        {loading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="border-0 shadow-soft">
                <CardContent className="p-0">
                  <div className="aspect-video bg-muted rounded-t-lg animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                    <div className="flex justify-between items-center pt-2">
                      <div className="h-6 bg-muted rounded w-20 animate-pulse" />
                      <div className="h-8 bg-muted rounded w-24 animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card className="border-0 shadow-soft">
            <CardContent className="p-12 text-center">
              <Palette className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery || selectedCategory !== 'all' ? 'No templates found' : 'No templates available'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Templates will appear here once they are created'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {filteredTemplates.map((template) => 
              viewMode === 'grid' 
                ? <TemplateCard key={template.id} template={template} />
                : <TemplateListItem key={template.id} template={template} />
            )}
          </div>
        )}
      </div>

      {/* Template Preview Dialog */}
      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          open={!!previewTemplate}
          onOpenChange={() => setPreviewTemplate(null)}
          onUseTemplate={() => {
            handleUseTemplate(previewTemplate)
            setPreviewTemplate(null)
          }}
          mode={mode}
        />
      )}
    </div>
  )
}