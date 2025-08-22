import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Palette, ChevronDown } from 'lucide-react'
import { ApplyTemplateWizard } from '../template/ApplyTemplateWizard'
import { Template } from '@/hooks/useSupabaseData'
import { SemanticDocument } from '@/lib/document-model'
import { useToast } from '@/hooks/use-toast'

interface EditorTemplateActionsProps {
  documentId: string
  document?: SemanticDocument
  onTemplateApplied?: () => void
}

export function EditorTemplateActions({ documentId, document, onTemplateApplied }: EditorTemplateActionsProps) {
  const [applyWizardOpen, setApplyWizardOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const { toast } = useToast()

  const handleApplyTemplate = (template: Template) => {
    setSelectedTemplate(template)
    setApplyWizardOpen(true)
  }

  const handleTemplateApplied = async () => {
    toast({
      title: "Template Applied",
      description: "Your document has been updated with the new template",
    })
    onTemplateApplied?.()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Palette className="w-4 h-4 mr-2" />
            Template
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => {
            // For now, we'll use a mock template since we don't have template selection UI here
            const mockTemplate: Template = {
              id: 'mock-template',
              name: 'Professional Report',
              description: 'A clean, professional template for business reports',
              category: 'business',
              is_premium: false,
              is_global: true,
              global_styling: {},
              metadata: {},
              usage_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            handleApplyTemplate(mockTemplate)
          }}>
            <Palette className="w-4 h-4 mr-2" />
            Apply Template...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedTemplate && document && (
        <ApplyTemplateWizard
          open={applyWizardOpen}
          onOpenChange={setApplyWizardOpen}
          template={selectedTemplate}
          document={document}
          onApply={async (mode) => {
            // Implement template application logic here
            await new Promise(resolve => setTimeout(resolve, 2000)) // Mock delay
            handleTemplateApplied()
          }}
        />
      )}
    </>
  )
}