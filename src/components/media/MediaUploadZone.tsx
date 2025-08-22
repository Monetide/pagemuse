import { useCallback, useState } from 'react'
import { Upload, FileImage, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { UploadProgress } from '@/hooks/useMediaLibrary'

interface MediaUploadZoneProps {
  onUpload: (files: File[]) => void
  uploadProgress: UploadProgress[]
  className?: string
}

export const MediaUploadZone = ({ onUpload, uploadProgress, className }: MediaUploadZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/') || 
      file.type.startsWith('video/') ||
      file.type === 'application/pdf'
    )
    
    if (files.length > 0) {
      onUpload(files)
    }
  }, [onUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onUpload(files)
    }
    // Reset input
    e.target.value = ''
  }, [onUpload])

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusColor = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return 'bg-blue-500'
      case 'complete':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Zone */}
      <Card 
        className={cn(
          "border-2 border-dashed transition-all duration-200",
          isDragOver 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-12 text-center">
          <Upload className={cn(
            "w-12 h-12 mx-auto mb-4 transition-colors",
            isDragOver ? "text-primary" : "text-muted-foreground"
          )} />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Drop files here or click to upload
          </h3>
          <p className="text-muted-foreground mb-6">
            Support for PNG, JPG, SVG images and MP4 videos up to 10MB each
          </p>
          <input
            type="file"
            multiple
            accept="image/*,video/mp4,.pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button asChild>
              <span className="cursor-pointer">
                <FileImage className="w-4 h-4 mr-2" />
                Choose Files
              </span>
            </Button>
          </label>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold text-foreground mb-4">Uploading files...</h4>
            <div className="space-y-4">
              {uploadProgress.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getStatusIcon(item.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.file.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(item.file.size)}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.file.type.split('/')[0]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {item.status === 'error' ? (
                        <span className="text-xs text-red-600">Failed</span>
                      ) : item.status === 'complete' ? (
                        <span className="text-xs text-green-600">Complete</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {item.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {item.status !== 'complete' && item.status !== 'error' && (
                    <Progress 
                      value={item.progress} 
                      className="h-2"
                    />
                  )}
                  
                  {item.error && (
                    <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {item.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}