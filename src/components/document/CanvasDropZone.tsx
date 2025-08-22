import { useState, useCallback, useRef, useEffect } from 'react'
import { Upload, FileText, FileImage, File } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CanvasDropZoneProps {
  onFileDrop: (files: File[]) => void
  isVisible: boolean
  className?: string
}

const SUPPORTED_TYPES = [
  '.docx', '.pdf', '.md', '.txt', '.html'
]

const getFileIcon = (fileName: string) => {
  const ext = fileName.toLowerCase().split('.').pop()
  switch (ext) {
    case 'docx':
    case 'doc':
      return <FileText className="w-8 h-8 text-blue-500" />
    case 'pdf':
      return <FileText className="w-8 h-8 text-red-500" />
    case 'md':
    case 'txt':
      return <FileText className="w-8 h-8 text-gray-500" />
    case 'html':
      return <FileText className="w-8 h-8 text-orange-500" />
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <FileImage className="w-8 h-8 text-green-500" />
    default:
      return <File className="w-8 h-8 text-muted-foreground" />
  }
}

const isValidFileType = (file: File): boolean => {
  const fileName = file.name.toLowerCase()
  return SUPPORTED_TYPES.some(type => fileName.endsWith(type))
}

export const CanvasDropZone = ({ 
  onFileDrop, 
  isVisible, 
  className 
}: CanvasDropZoneProps) => {
  const [draggedFiles, setDraggedFiles] = useState<File[]>([])
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Get files from drag event
    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(isValidFileType)
    setDraggedFiles(validFiles)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Only clear if leaving the overlay entirely
    if (overlayRef.current && !overlayRef.current.contains(e.relatedTarget as Node)) {
      setDraggedFiles([])
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(isValidFileType)
    
    if (validFiles.length > 0) {
      onFileDrop(validFiles)
    }
    
    setDraggedFiles([])
  }, [onFileDrop])

  // Reset state when visibility changes
  useEffect(() => {
    if (!isVisible) {
      setDraggedFiles([])
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div
      ref={overlayRef}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-background/80 backdrop-blur-sm",
        "border-2 border-dashed border-primary/50",
        "transition-all duration-200 ease-in-out",
        className
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="text-center space-y-6 p-8 max-w-md">
        {/* Main drop icon */}
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-primary/10 border-2 border-primary/20">
            <Upload className="w-12 h-12 text-primary animate-bounce" />
          </div>
        </div>

        {/* Drop message */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            Drop to import
          </h3>
          <p className="text-muted-foreground">
            Import documents into your project
          </p>
        </div>

        {/* File previews */}
        {draggedFiles.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {draggedFiles.length} file{draggedFiles.length !== 1 ? 's' : ''} ready to import:
            </p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {draggedFiles.slice(0, 5).map((file, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                >
                  {getFileIcon(file.name)}
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
              ))}
              {draggedFiles.length > 5 && (
                <div className="text-center text-sm text-muted-foreground">
                  and {draggedFiles.length - 5} more files...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Supported formats */}
        <div className="text-xs text-muted-foreground">
          Supported: {SUPPORTED_TYPES.join(', ')}
        </div>
      </div>
    </div>
  )
}