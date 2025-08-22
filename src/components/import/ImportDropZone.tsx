import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, File, Image } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportDropZoneProps {
  onFileSelect: (files: File[]) => void
  acceptedTypes?: string[]
  className?: string
  compact?: boolean
}

const ACCEPTED_TYPES = ['.docx', '.pdf', '.txt', '.md', '.html']
const FILE_TYPE_ICONS = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,
  'application/pdf': File,
  'text/plain': FileText,
  'text/markdown': FileText,
  'text/html': FileText,
  'application/msword': FileText,
}

export const ImportDropZone = ({ 
  onFileSelect, 
  acceptedTypes = ACCEPTED_TYPES,
  className,
  compact = false 
}: ImportDropZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => prev + 1)
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => {
      const newCount = prev - 1
      if (newCount === 0) {
        setIsDragOver(false)
      }
      return newCount
    })
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setDragCounter(0)

    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase()
      return acceptedTypes.includes(extension)
    })

    if (validFiles.length > 0) {
      onFileSelect(validFiles)
    }
  }, [acceptedTypes, onFileSelect])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFileSelect(files)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }, [onFileSelect])

  if (compact) {
    return (
      <div className={cn("relative", className)}>
        <input
          type="file"
          id="import-file-input-compact"
          className="hidden"
          accept={acceptedTypes.join(',')}
          multiple
          onChange={handleFileInput}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('import-file-input-compact')?.click()}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          Import Files
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      <input
        type="file"
        id="import-file-input"
        className="hidden"
        accept={acceptedTypes.join(',')}
        multiple
        onChange={handleFileInput}
      />
      
      <Card
        className={cn(
          "border-2 border-dashed transition-all duration-200 cursor-pointer hover:shadow-soft",
          isDragOver 
            ? "border-primary bg-primary/5 shadow-soft" 
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById('import-file-input')?.click()}
      >
        <CardContent className="p-8 text-center space-y-4">
          <div className={cn(
            "w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-colors",
            isDragOver ? "bg-primary/10" : "bg-muted"
          )}>
            <Upload className={cn(
              "w-8 h-8 transition-colors",
              isDragOver ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {isDragOver ? "Drop files to import" : "Import Documents"}
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {isDragOver 
                ? "Release to import your documents"
                : "Drag and drop files here, or click to browse"
              }
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {acceptedTypes.map(type => (
              <span 
                key={type} 
                className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md font-mono"
              >
                {type}
              </span>
            ))}
          </div>

          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="w-4 h-4" />
            Choose Files
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}