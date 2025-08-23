import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Upload, 
  FileText, 
  Package,
  Plus
} from 'lucide-react'
import { TPKGUploadDialog } from './TPKGUploadDialog'

interface ImportTemplateDialogProps {
  onImportComplete?: () => void
}

export function ImportTemplateDialog({ onImportComplete }: ImportTemplateDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Import Template
          </DialogTitle>
          <DialogDescription>
            Choose how you'd like to import your template into PageMuse.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* TPKG Upload Option */}
          <Card className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 border-dashed border-primary/20 hover:border-primary/40">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Upload TPKG Package</h3>
                  <p className="text-sm text-muted-foreground">
                    Import a complete template package with assets and configuration
                  </p>
                </div>
                <TPKGUploadDialog onUploadComplete={onImportComplete} />
              </div>
            </CardContent>
          </Card>

          {/* JSON Import Option */}
          <Card className="cursor-pointer hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-blue-100">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Import JSON Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    Import template from JSON configuration file
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Figma Import Option */}
          <Card className="cursor-pointer hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Upload className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Import from Figma</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect to Figma and import design templates
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}