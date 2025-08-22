import { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { HelpCircle, Layers, FileText, MousePointer, Keyboard, Upload } from 'lucide-react'

interface HelpDialogProps {
  trigger?: React.ReactNode
}

export function HelpDialog({ trigger }: HelpDialogProps) {
  const [open, setOpen] = useState(false)

  const defaultTrigger = (
    <Button variant="outline" size="sm" title="Getting Started Help">
      <HelpCircle className="h-3 w-3" />
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Getting Started</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Document Structure */}
            <Card>
              <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="h-5 w-5" />
                Document Structure
              </CardTitle>
                <CardDescription>
                  Understanding the hierarchy: Sections → Flows → Blocks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">Sections</Badge>
                  <p className="text-sm text-muted-foreground">
                    Organize your document into chapters or major parts. Each section can have multiple flows.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">Flows</Badge>
                  <p className="text-sm text-muted-foreground">
                    Content streams within sections (e.g., main text, sidebar, footnotes). Most documents use just the "Main" flow.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">Blocks</Badge>
                  <p className="text-sm text-muted-foreground">
                    Individual content pieces like paragraphs, headings, images, tables, or charts.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Writing & Editing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Keyboard className="h-5 w-5" />
                  Writing & Editing
                </CardTitle>
                <CardDescription>
                  Fast ways to create and format content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 text-xs bg-muted rounded">Type</kbd>
                    <span className="text-sm">Start typing anywhere to create a paragraph</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 text-xs bg-muted rounded">/</kbd>
                    <span className="text-sm">Open the insert menu for headings, images, tables, etc.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 text-xs bg-muted rounded">Paste</kbd>
                    <span className="text-sm">Paste text, images, or documents to import content</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 text-xs bg-muted rounded">Enter</kbd>
                    <span className="text-sm">Create a new paragraph below current block</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selection & Inspector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MousePointer className="h-5 w-5" />
                  Block Inspector
                </CardTitle>
                <CardDescription>
                  Customize any block with advanced options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Click on any block to select it, then use the Inspector panel (usually on the right) to:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Change block type (paragraph → heading → quote, etc.)</li>
                  <li>• Adjust formatting and styling options</li>
                  <li>• Set alignment, spacing, and layout properties</li>
                  <li>• Configure block-specific settings</li>
                </ul>
              </CardContent>
            </Card>

            {/* Import & Files */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Upload className="h-5 w-5" />
                  Import Content
                </CardTitle>
                <CardDescription>
                  Bring in existing documents and media
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Drag & drop files</strong> onto the canvas to import:
                  </p>
                  <ul className="ml-4 space-y-1 text-sm text-muted-foreground">
                    <li>• Word documents (.docx)</li>
                    <li>• Images (PNG, JPG, GIF)</li>
                    <li>• PDFs for text extraction</li>
                    <li>• Plain text files</li>
                  </ul>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">Pro Tip</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste content directly from other documents, websites, or apps for quick importing.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Navigation Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Use the <strong>Navigator</strong> (left panel) to jump between sections and flows</p>
                  <p>• The <strong>Canvas toolbar</strong> has zoom, layout guides, and view options</p>
                  <p>• <strong>Inspector</strong> (right panel) shows options for the selected block</p>
                  <p>• Use <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Ctrl+Z</kbd> to undo changes</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}