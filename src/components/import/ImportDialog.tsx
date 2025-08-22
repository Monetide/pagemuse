import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ImportDropZone } from './ImportDropZone'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, 
  Plus, 
  Download, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle 
} from 'lucide-react'

export type ImportMode = 'new-document' | 'append-section' | 'insert-section' | 'replace-document' | 'insert-at-cursor' | 'replace-selection'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (files: File[], mode: ImportMode) => Promise<void>
  defaultMode?: ImportMode
  canAppend?: boolean
  canInsert?: boolean
  canReplace?: boolean
}

export const ImportDialog = ({
  open,
  onOpenChange,
  onImport,
  defaultMode = 'new-document',
  canAppend = false,
  canInsert = false,
  canReplace = false
}: ImportDialogProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [importMode, setImportMode] = useState<ImportMode>(defaultMode)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)

  const modes = [
    {
      id: 'new-document' as ImportMode,
      label: 'Create New Document',
      description: 'Start a fresh document with the imported content',
      icon: <Plus className="w-4 h-4" />,
      available: true
    },
    {
      id: 'append-section' as ImportMode,
      label: 'Append to Current Section',
      description: 'Add content to the end of the current section',
      icon: <Download className="w-4 h-4" />,
      available: canAppend
    },
    {
      id: 'insert-section' as ImportMode,
      label: 'Insert as New Section',
      description: 'Create a new section with the imported content',
      icon: <FileText className="w-4 h-4" />,
      available: canInsert
    },
    {
      id: 'replace-document' as ImportMode,
      label: 'Replace Entire Document',
      description: 'Replace all current content (cannot be undone)',
      icon: <RefreshCw className="w-4 h-4" />,
      available: canReplace
    }
  ].filter(mode => mode.available)

  const handleImport = async () => {
    if (selectedFiles.length === 0) return

    setIsImporting(true)
    setImportProgress(0)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      await onImport(selectedFiles, importMode)
      
      clearInterval(progressInterval)
      setImportProgress(100)
      
      // Brief success state before closing
      setTimeout(() => {
        onOpenChange(false)
        resetDialog()
      }, 500)
      
    } catch (error) {
      console.error('Import failed:', error)
      setIsImporting(false)
      setImportProgress(0)
    }
  }

  const resetDialog = () => {
    setSelectedFiles([])
    setImportMode(defaultMode)
    setIsImporting(false)
    setImportProgress(0)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isImporting) {
      onOpenChange(newOpen)
      if (!newOpen) {
        resetDialog()
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Import Content
          </DialogTitle>
          <DialogDescription>
            Import documents from various formats into your project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Select Files</Label>
            <ImportDropZone
              onFileSelect={setSelectedFiles}
              className="w-full"
            />
            
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Files</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate max-w-xs">
                          {file.name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Import Mode Selection */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <Label className="text-sm font-medium">Import Mode</Label>
              <RadioGroup value={importMode} onValueChange={(value) => setImportMode(value as ImportMode)}>
                <div className="space-y-3">
                  {modes.map((mode) => (
                    <div key={mode.id} className="flex items-start space-x-3">
                      <RadioGroupItem value={mode.id} id={mode.id} className="mt-0.5" />
                      <div className="flex-1">
                        <Label 
                          htmlFor={mode.id} 
                          className="flex items-center gap-2 font-medium cursor-pointer"
                        >
                          {mode.icon}
                          {mode.label}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {mode.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              {importMode === 'replace-document' && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This will permanently replace all content in the current document. 
                    This action cannot be undone.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Import Progress */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Importing...</Label>
                <span className="text-sm text-muted-foreground">
                  {importProgress === 100 ? (
                    <div className="flex items-center gap-1 text-success">
                      <CheckCircle className="w-4 h-4" />
                      Complete
                    </div>
                  ) : (
                    `${importProgress}%`
                  )}
                </span>
              </div>
              <Progress value={importProgress} className="w-full" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={selectedFiles.length === 0 || isImporting}
            className="gap-2"
          >
            {isImporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Import {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}