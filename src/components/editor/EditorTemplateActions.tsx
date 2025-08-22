import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Palette, ChevronDown } from 'lucide-react'
import { TemplateGalleryDialog } from '@/components/template/TemplateGalleryDialog'

interface EditorTemplateActionsProps {
  documentId: string
}

export function EditorTemplateActions({ documentId }: EditorTemplateActionsProps) {
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false)

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
          <DropdownMenuItem onClick={() => setTemplateGalleryOpen(true)}>
            <Palette className="w-4 h-4 mr-2" />
            Apply Template...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TemplateGalleryDialog
        open={templateGalleryOpen}
        onOpenChange={setTemplateGalleryOpen}
        mode="apply"
        documentId={documentId}
      />
    </>
  )
}