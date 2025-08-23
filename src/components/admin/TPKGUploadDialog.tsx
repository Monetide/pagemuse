import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  FileArchive, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Package
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

interface TPKGFile {
  file: File
  manifest?: TPKGManifest
  isValid: boolean
  errors: string[]
}

interface TPKGManifest {
  name: string
  version: string
  description?: string
  category: string
  author?: string
  preview?: string
  assets?: string[]
  themeTokens?: Record<string, any>
  objectStyles?: Record<string, any>
  metadata?: Record<string, any>
}

interface TPKGUploadDialogProps {
  onUploadComplete?: () => void
}

export function TPKGUploadDialog({ onUploadComplete }: TPKGUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<TPKGFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [result, setResult] = useState<any>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    console.log('File dropped:', file.name)
    
    // For demo purposes, we'll create a mock manifest
    // In a real implementation, you'd extract and parse the zip file
    const mockManifest: TPKGManifest = {
      name: file.name.replace(/\.(tpkg|zip)$/, ''),
      version: '1.0.0',
      description: 'Imported TPKG template',
      category: 'Business',
      author: 'Admin',
      preview: 'preview.jpg',
      assets: ['preview.jpg'],
      themeTokens: {
        primary: 'hsl(222, 84%, 5%)',
        secondary: 'hsl(210, 40%, 98%)',
        accent: 'hsl(217, 91%, 60%)'
      },
      objectStyles: {
        heading: { fontFamily: 'Inter', fontWeight: 600 },
        body: { fontFamily: 'Inter', lineHeight: 1.6 }
      },
      metadata: {
        complexity: 'intermediate',
        estimatedPages: 20
      }
    }

    // Validate the manifest
    const errors = validateManifest(mockManifest)
    
    setUploadedFile({
      file,
      manifest: mockManifest,
      isValid: errors.length === 0,
      errors
    })
  }, [])

  const validateManifest = (manifest: TPKGManifest): string[] => {
    const errors: string[] = []
    
    if (!manifest.name) errors.push('Template name is required')
    if (!manifest.category) errors.push('Template category is required')
    if (!manifest.version) errors.push('Template version is required')
    
    return errors
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.tpkg']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024 // 50MB
  })

  const handleUpload = async () => {
    if (!uploadedFile || !user || !uploadedFile.manifest) return

    setIsProcessing(true)
    setUploadProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      // Create form data for the edge function
      const formData = new FormData()
      formData.append('file', uploadedFile.file)
      formData.append('userId', user.id)
      formData.append('manifest', JSON.stringify(uploadedFile.manifest))

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('process-tpkg', {
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (error) {
        throw error
      }

      console.log('TPKG upload result:', data)
      setResult(data)

      toast({
        title: 'TPKG Uploaded Successfully',
        description: `Template "${uploadedFile.manifest.name}" has been created as a draft.`
      })

      onUploadComplete?.()

    } catch (error) {
      console.error('TPKG upload failed:', error)
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload TPKG',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setUploadedFile(null)
    setResult(null)
    setUploadProgress(0)
    setIsProcessing(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Package className="w-4 h-4" />
          Upload TPKG
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileArchive className="w-5 h-5 text-primary" />
            Upload Template Package (TPKG)
          </DialogTitle>
          <DialogDescription>
            Upload a TPKG file containing a template with assets and configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!result ? (
            <>
              {/* File Drop Zone */}
              <Card>
                <CardContent className="p-6">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    {isDragActive ? (
                      <p className="text-lg font-medium">Drop the TPKG file here...</p>
                    ) : (
                      <>
                        <p className="text-lg font-medium mb-2">
                          Drag & drop a TPKG file here
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          or click to select a file
                        </p>
                        <Button variant="outline" size="sm">
                          Select File
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* File Preview */}
              {uploadedFile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {uploadedFile.isValid ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      {uploadedFile.file.name}
                    </CardTitle>
                    <CardDescription>
                      {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </CardDescription>
                  </CardHeader>
                  {uploadedFile.manifest && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Name:</span> {uploadedFile.manifest.name}
                        </div>
                        <div>
                          <span className="font-medium">Version:</span> {uploadedFile.manifest.version}
                        </div>
                        <div>
                          <span className="font-medium">Category:</span> {uploadedFile.manifest.category}
                        </div>
                        <div>
                          <span className="font-medium">Author:</span> {uploadedFile.manifest.author || 'Unknown'}
                        </div>
                      </div>
                      
                      {uploadedFile.manifest.description && (
                        <p className="text-sm text-muted-foreground">
                          {uploadedFile.manifest.description}
                        </p>
                      )}

                      {uploadedFile.errors.length > 0 && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <AlertDescription>
                            <strong>Validation Errors:</strong>
                            <ul className="mt-1 ml-4 list-disc">
                              {uploadedFile.errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Upload Progress */}
              {isProcessing && (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Processing TPKG...</span>
                        <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={!uploadedFile?.isValid || isProcessing}
                  className="gap-2"
                >
                  {isProcessing ? 'Processing...' : 'Upload Template'}
                </Button>
              </div>
            </>
          ) : (
            /* Success Result */
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  Template Created Successfully
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {result.template?.name}
                  </div>
                  <div>
                    <span className="font-medium">Category:</span> {result.template?.category}
                  </div>
                  <div className="col-span-2">
                    <Badge variant="secondary">
                      Status: {result.template?.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-green-700">
                  The template has been created as a draft and is now available in the admin templates list.
                </p>
                <Button onClick={handleClose} className="w-full">
                  Done
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}