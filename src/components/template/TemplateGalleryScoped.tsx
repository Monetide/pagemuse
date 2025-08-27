import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useTemplatesScoped, ScopedTemplate } from '@/hooks/useTemplatesScoped'
import { useAdminRole } from '@/hooks/useAdminRole'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { Loader2, Search, Star, Globe, Building2, Edit, Zap } from 'lucide-react'
import { trackTemplateOpened, trackTemplateSelected } from '@/lib/analytics'

interface TemplateGalleryScopedProps {
  onUseTemplate?: (template: ScopedTemplate) => void
  onEditTemplate?: (template: ScopedTemplate) => void
  onPromoteTemplate?: (template: ScopedTemplate) => void
  className?: string
}

export function TemplateGalleryScoped({ 
  onUseTemplate, 
  onEditTemplate, 
  onPromoteTemplate,
  className = ""
}: TemplateGalleryScopedProps) {
  const { templates, loading, error } = useTemplatesScoped()
  const { isAdmin: isSystemAdmin } = useAdminRole()
  const { currentWorkspace } = useWorkspaceContext()
  const [searchQuery, setSearchQuery] = useState('')

  const filterTemplates = (templateList: ScopedTemplate[]) => {
    if (!searchQuery) return templateList
    return templateList.filter(template =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const handleUseTemplate = (template: ScopedTemplate) => {
    trackTemplateSelected(template.id, { scope: template.scope }, currentWorkspace?.id || '', undefined)
    onUseTemplate?.(template)
  }

  const handleTemplateOpen = (template: ScopedTemplate) => {
    trackTemplateOpened(template.id, { scope: template.scope }, currentWorkspace?.id || '')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <p>Error loading templates: {error}</p>
      </div>
    )
  }

  const filteredGlobalFeatured = filterTemplates(templates.globalFeatured)
  const filteredGlobalAll = filterTemplates(templates.globalAll)
  const filteredWorkspace = filterTemplates(templates.workspace)

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Featured Global Templates */}
      {filteredGlobalFeatured.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Featured Templates</h3>
            <Badge variant="outline" className="text-xs">Global</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGlobalFeatured.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSystemAdmin={isSystemAdmin}
                onUse={() => handleUseTemplate(template)}
                onEdit={() => onEditTemplate?.(template)}
                onPromote={() => onPromoteTemplate?.(template)}
                onOpen={() => handleTemplateOpen(template)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Workspace Templates */}
      {filteredWorkspace.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">My Workspace</h3>
            <Badge variant="outline" className="text-xs">Workspace</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkspace.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSystemAdmin={isSystemAdmin}
                onUse={() => handleUseTemplate(template)}
                onEdit={() => onEditTemplate?.(template)}
                onPromote={() => onPromoteTemplate?.(template)}
                onOpen={() => handleTemplateOpen(template)}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Global Templates */}
      {filteredGlobalAll.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">All Global Templates</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGlobalAll.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSystemAdmin={isSystemAdmin}
                onUse={() => handleUseTemplate(template)}
                onEdit={() => onEditTemplate?.(template)}
                onPromote={() => onPromoteTemplate?.(template)}
                onOpen={() => handleTemplateOpen(template)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {filteredGlobalFeatured.length === 0 && filteredGlobalAll.length === 0 && filteredWorkspace.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No templates found matching your search.</p>
        </div>
      )}
    </div>
  )
}

interface TemplateCardProps {
  template: ScopedTemplate
  isSystemAdmin: boolean
  onUse: () => void
  onEdit: () => void
  onPromote: () => void
  onOpen: () => void
}

function TemplateCard({ 
  template, 
  isSystemAdmin, 
  onUse, 
  onEdit, 
  onPromote, 
  onOpen 
}: TemplateCardProps) {
  const scopeBadgeVariant = template.scope === 'global' ? 'secondary' : 'outline'
  const scopeIcon = template.scope === 'global' ? Globe : Building2
  const ScopeIcon = scopeIcon

  return (
    <Card className="group cursor-pointer transition-all hover:shadow-lg" onClick={onOpen}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium line-clamp-2">
            {template.name}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant={scopeBadgeVariant} className="text-xs">
              <ScopeIcon className="h-3 w-3 mr-1" />
              {template.scope === 'global' ? 'Global' : 'Workspace'}
            </Badge>
            {template.is_premium && (
              <Badge variant="default" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-2">
        <div className="aspect-video bg-muted rounded-md mb-2 flex items-center justify-center">
          {template.preview_image_url ? (
            <img 
              src={template.preview_image_url} 
              alt={template.name}
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <div className="text-muted-foreground text-sm">Preview</div>
          )}
        </div>
        {template.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {template.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <Badge variant="outline" className="text-xs">
            {template.category}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {template.usage_count} uses
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-2 flex gap-2">
        <Button 
          size="sm" 
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation()
            onUse()
          }}
        >
          Use Template
        </Button>
        
        {(template.scope === 'workspace' || isSystemAdmin) && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}

        {isSystemAdmin && template.scope === 'workspace' && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              onPromote()
            }}
          >
            <Zap className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}