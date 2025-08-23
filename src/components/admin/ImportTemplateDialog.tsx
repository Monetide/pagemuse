import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Upload,
  Download,
  FileText,
  Palette,
  X
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ImportTemplateDialogProps {
  onImportComplete?: () => void
}

export function ImportTemplateDialog({ onImportComplete }: ImportTemplateDialogProps) {
  const [open, setOpen] = useState(false)
  const [importMethod, setImportMethod] = useState<'file' | 'url' | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    file: null as File | null,
    url: ''
  })
  const [importing, setImporting] = useState(false)
  const { toast } = useToast()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFormData({ ...formData, file })
      if (!formData.name) {
        setFormData({ ...formData, file, name: file.name.replace(/\.[^/.]+$/, '') })
      }
    }
  }

  const handleImport = async () => {
    if (!formData.name || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (importMethod === 'file' && !formData.file) {
      toast({
        title: "Error",
        description: "Please select a file to import",
        variant: "destructive",
      })
      return
    }

    if (importMethod === 'url' && !formData.url) {
      toast({
        title: "Error",
        description: "Please enter a URL to import from",
        variant: "destructive",
      })
      return
    }

    setImporting(true)
    try {
      // TODO: Implement actual import logic
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate import
      
      toast({
        title: "Success",
        description: "Template imported successfully",
      })
      
      setOpen(false)
      setFormData({ name: '', description: '', category: '', file: null, url: '' })
      setImportMethod(null)
      onImportComplete?.()
    } catch (error) {
      console.error('Error importing template:', error)
      toast({
        title: "Error",
        description: "Failed to import template",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', category: '', file: null, url: '' })
    setImportMethod(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Import Template
          </DialogTitle>
          <DialogDescription>
            Import a template from a file or URL to make it available in the template library.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!importMethod ? (
            /* Import Method Selection */
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setImportMethod('file')}
                className="p-6 border-2 border-dashed border-muted-foreground/20 rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-colors text-center"
              >
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium text-foreground">Upload File</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Import from a local template file
                </p>
              </button>

              <button
                onClick={() => setImportMethod('url')}
                className="p-6 border-2 border-dashed border-muted-foreground/20 rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-colors text-center"
              >
                <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium text-foreground">Import from URL</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Import from an external template URL
                </p>
              </button>
            </div>
          ) : (
            /* Import Form */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="flex items-center gap-1">
                  {importMethod === 'file' ? (
                    <>
                      <Upload className="w-3 h-3" />
                      File Upload
                    </>
                  ) : (
                    <>
                      <FileText className="w-3 h-3" />
                      URL Import
                    </>
                  )}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetForm}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {importMethod === 'file' ? (
                <div className="space-y-2">
                  <Label htmlFor="file">Template File</Label>
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center">
                    <input
                      id="file"
                      type="file"
                      accept=".json,.xml,.zip"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {formData.file ? (
                      <div className="space-y-2">
                        <FileText className="w-8 h-8 mx-auto text-primary" />
                        <p className="font-medium">{formData.file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(formData.file.size / 1024).toFixed(1)} KB
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('file')?.click()}
                        >
                          Change File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                        <div>
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('file')?.click()}
                          >
                            Choose File
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Supported formats: JSON, XML, ZIP
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="url">Template URL</Label>
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com/template.json"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter template description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Business, Marketing, Academic"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing}
                  className="bg-gradient-primary hover:shadow-glow transition-all duration-200"
                >
                  <Palette className="w-4 h-4 mr-2" />
                  {importing ? 'Importing...' : 'Import Template'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}