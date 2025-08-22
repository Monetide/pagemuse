import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTemplates } from '@/hooks/useSupabaseData'
import { useTemplateApplication } from '@/hooks/useTemplateApplication'
import { TemplateGallery } from '@/components/template/TemplateGallery'
import { Template } from '@/hooks/useSupabaseData'
import { Plus, Palette } from 'lucide-react'

export default function TemplateLibrary() {
  const { templates, loading } = useTemplates()
  const { createFromTemplate } = useTemplateApplication()

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
            Discover and use professional templates for your projects
          </p>
        </div>
        <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-200">
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Template Gallery */}
      <TemplateGallery
        templates={templates}
        loading={loading}
        mode="new"
        onUseTemplate={handleUseTemplate}
      />
    </div>
  )
}