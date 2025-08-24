import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useTemplates } from '@/hooks/useSupabaseData'
import { useTemplateApplication } from '@/hooks/useTemplateApplication'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { TemplateGallery } from '@/components/template/TemplateGallery'
import { Template } from '@/hooks/useSupabaseData'
import { Plus, Palette, Building2, Search, Filter } from 'lucide-react'

export default function TemplateLibrary() {
  const { currentWorkspace } = useWorkspaceContext()
  const { templates, loading } = useTemplates()
  const { createFromTemplate } = useTemplateApplication()
  const [searchQuery, setSearchQuery] = useState('')

  // Filter templates: global templates + workspace-specific templates
  const workspaceTemplates = templates.filter(template => 
    template.is_global || template.workspace_id === currentWorkspace?.id
  )

  const filteredTemplates = workspaceTemplates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleUseTemplate = async (template: Template) => {
    await createFromTemplate(template)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Template Library</h1>
          <p className="text-muted-foreground mt-2">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available for {currentWorkspace?.name}
          </p>
        </div>
        <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-200">
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
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

      {/* Template Gallery */}
      <TemplateGallery
        templates={filteredTemplates}
        loading={loading}
        mode="new"
        onUseTemplate={handleUseTemplate}
      />
    </div>
  )
}