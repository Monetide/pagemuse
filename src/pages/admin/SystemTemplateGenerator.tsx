import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AdminGuard } from '@/components/auth/AdminGuard'
import { TemplateGalleryScoped } from '@/components/template/TemplateGalleryScoped'
import { ScopedTemplate } from '@/hooks/useTemplatesScoped'
import { Globe, Settings, Plus, Star } from 'lucide-react'

export default function SystemTemplateGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<ScopedTemplate | null>(null)

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
          <div className="flex gap-3">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button className="bg-gradient-primary hover:shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              Create Global Template
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

        {/* Template Gallery */}
        <TemplateGalleryScoped
          onUseTemplate={handleUseTemplate}
          onEditTemplate={handleEditTemplate}
          onPromoteTemplate={handlePromoteTemplate}
        />
      </div>
    </AdminGuard>
  )
}