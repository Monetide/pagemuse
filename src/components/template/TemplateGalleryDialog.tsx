import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTemplates } from '@/hooks/useSupabaseData'
import { useTemplateApplication } from '@/hooks/useTemplateApplication'
import type { ScopedTemplate } from '@/hooks/useTemplatesScoped'
import { TemplateGallery } from './TemplateGallery'
import { Template } from '@/hooks/useSupabaseData'

interface TemplateGalleryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'new' | 'apply'
  documentId?: string
  title?: string
}

export function TemplateGalleryDialog({ 
  open, 
  onOpenChange, 
  mode, 
  documentId,
  title 
}: TemplateGalleryDialogProps) {
  const { templates, loading } = useTemplates()
  const { createFromTemplate, applyToExisting } = useTemplateApplication()

  const handleUseTemplate = async (template: Template) => {
    // Convert Template to ScopedTemplate
    const scopedTemplate: ScopedTemplate = {
      ...template,
      scope: template.is_global ? 'global' : 'workspace',
      template_slug: template.name.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-')
    }
    
    if (mode === 'new') {
      await createFromTemplate(scopedTemplate, title)
    } else if (mode === 'apply' && documentId) {
      await applyToExisting(scopedTemplate, documentId)
    }
    onOpenChange(false)
  }

  const handleApplyTemplate = async (template: Template) => {
    // Convert Template to ScopedTemplate
    const scopedTemplate: ScopedTemplate = {
      ...template,
      scope: template.is_global ? 'global' : 'workspace',
      template_slug: template.name.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-')
    }
    
    if (documentId) {
      await applyToExisting(scopedTemplate, documentId)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl">
            {mode === 'new' ? 'Choose a Template' : 'Apply Template'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'new' 
              ? 'Start your document with a professional template'
              : 'Apply a template design to your current document'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <TemplateGallery
            templates={templates}
            loading={loading}
            mode={mode}
            onUseTemplate={handleUseTemplate}
            onApplyTemplate={handleApplyTemplate}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}