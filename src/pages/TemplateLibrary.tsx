import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DesignFromContentDialog } from '@/components/document/DesignFromContentDialog'
import { useTemplates } from '@/hooks/useSupabaseData'
import { useTemplateApplication } from '@/hooks/useTemplateApplication'
import type { ScopedTemplate } from '@/hooks/useTemplatesScoped'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { TemplateGallery } from '@/components/template/TemplateGallery'
import { Template } from '@/hooks/useSupabaseData'
import { Plus, Palette, Building2, Search, Filter, Sparkles } from 'lucide-react'

export default function TemplateLibrary() {
  const { currentWorkspace } = useWorkspaceContext()
  const { templates, loading } = useTemplates()
  const { createFromTemplate } = useTemplateApplication()
  const [searchQuery, setSearchQuery] = useState('')
  const [designFromContentOpen, setDesignFromContentOpen] = useState(false)

  // Separate workspace and global templates
  const workspaceTemplates = templates.filter(template => 
    template.workspace_id === currentWorkspace?.id
  )
  const globalTemplates = templates.filter(template => 
    template.is_global
  )

  const filteredWorkspaceTemplates = workspaceTemplates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredGlobalTemplates = globalTemplates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleUseTemplate = async (template: Template) => {
    // Convert Template to ScopedTemplate
    const scopedTemplate: ScopedTemplate = {
      ...template,
      scope: template.is_global ? 'global' : 'workspace',
      template_slug: template.name.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-')
    }
    await createFromTemplate(scopedTemplate)
  }

  const handleDuplicateTemplate = async (template: Template) => {
    // TODO: Implement template duplication to workspace
    console.log('Duplicating template to workspace:', template.name)
  }
  
  const handleDesignFromContent = (payload: any) => {
    console.log('Design from content payload:', payload);
    // TODO: Implement the actual design from content flow
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Template Library</h1>
          <p className="text-muted-foreground mt-2">
            {filteredWorkspaceTemplates.length + filteredGlobalTemplates.length} template{filteredWorkspaceTemplates.length + filteredGlobalTemplates.length !== 1 ? 's' : ''} available for {currentWorkspace?.name}
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setDesignFromContentOpen(true)}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-200"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Design from content
          </Button>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-6">
          <div className="flex gap-4 items-center flex-wrap">
            {/* Workspace Filter Chip */}
            <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
              <Building2 className="w-3 h-3" />
              Workspace: {currentWorkspace?.name}
            </Badge>
            
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workspace Templates Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">My Workspace</h2>
          <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
            <Building2 className="w-3 h-3" />
            {currentWorkspace?.name}
          </Badge>
        </div>
        <TemplateGallery
          templates={filteredWorkspaceTemplates}
          loading={loading}
          mode="new"
          onUseTemplate={handleUseTemplate}
        />
      </div>

      {/* Global Templates Section */}
      {filteredGlobalTemplates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">Global Templates</h2>
            <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
              <Palette className="w-3 h-3" />
              Global
            </Badge>
          </div>
          <TemplateGallery
            templates={filteredGlobalTemplates}
            loading={loading}
            mode="new"
            onUseTemplate={handleUseTemplate}
            onDuplicateTemplate={handleDuplicateTemplate}
            showDuplicateAction={true}
          />
        </div>
      )}
      
      {/* Design from Content Dialog */}
      <DesignFromContentDialog
        open={designFromContentOpen}
        onOpenChange={setDesignFromContentOpen}
        onConfirm={handleDesignFromContent}
      />
    </div>
  )
}