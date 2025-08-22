import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTemplates } from '@/hooks/useSupabaseData'
import { useTemplateApplication } from '@/hooks/useTemplateApplication'
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
    if (mode === 'new') {
      await createFromTemplate(template, title)
    } else if (mode === 'apply' && documentId) {
      await applyToExisting(template, documentId)
    }
    onOpenChange(false)
  }

  const handleApplyTemplate = async (template: Template) => {
    if (documentId) {
      await applyToExisting(template, documentId)
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