import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'
import { 
  Image, 
  Upload, 
  Link2, 
  RotateCcw, 
  Maximize2, 
  Minimize2,
  AlertTriangle,
  GripVertical,
  Crop,
  Edit3
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { ImageEditor } from './ImageEditor'

interface CropData {
  x: number
  y: number
  width: number
  height: number
}

interface FocalPoint {
  x: number // 0-1
  y: number // 0-1
}

interface FigureData {
  imageSrc?: string
  altText?: string
  caption?: string
  size?: 'column-width' | 'full-width'
  maxWidth?: number
  aspectRatio?: number
  aspectLock?: boolean
  originalWidth?: number
  originalHeight?: number
  crop?: CropData
  focalPoint?: FocalPoint
  cropAspectRatio?: number
}

interface FigureBlockProps {
  data: FigureData
  isSelected?: boolean
  isEditing?: boolean
  showInvisibles?: boolean
  onDataChange?: (data: FigureData) => void
  onEditToggle?: () => void
  onClick?: () => void
  className?: string
}

export const FigureBlock = ({
  data,
  isSelected = false,
  isEditing = false,
  showInvisibles = false,
  onDataChange,
  onEditToggle,
  onClick,
  className = ''
}: FigureBlockProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [showReplacePrompt, setShowReplacePrompt] = useState(false)
  const [newImageSrc, setNewImageSrc] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateData = useCallback((updates: Partial<FigureData>) => {
    const newData = { ...data, ...updates }
    onDataChange?.(newData)
  }, [data, onDataChange])

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload PNG, JPG, or SVG files only')
      return
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB')
      return
    }

    setIsUploading(true)
    
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      
      // Upload to Supabase Storage
      const { data: uploadData, error } = await supabase.storage
        .from('media')
        .upload(fileName, file)

      if (error) {
        console.error('Upload error:', error)
        toast.error('Failed to upload image')
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(fileName)

      // Get image dimensions and check for replace
      const img = document.createElement('img')
      img.onload = () => {
        const newImageData = {
          imageSrc: urlData.publicUrl,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight,
          aspectLock: true,
          size: data.size || 'column-width'
        }
        
        // If replacing existing image with crop/focal data, prompt user
        if (data.imageSrc && (data.crop || data.focalPoint)) {
          setNewImageSrc(urlData.publicUrl)
          setShowReplacePrompt(true)
        } else {
          updateData(newImageData)
        }
      }
      img.src = urlData.publicUrl
      
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }, [updateData, data.size])

  const handleUrlSubmit = useCallback(() => {
    if (!urlInput.trim()) return

    // Basic URL validation
    try {
      new URL(urlInput.trim())
    } catch {
      toast.error('Please enter a valid URL')
      return
    }

    // Load image to get dimensions
    const img = document.createElement('img')
    img.onload = () => {
      const newImageData = {
        imageSrc: urlInput,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
        aspectLock: true,
        size: data.size || 'column-width'
      }
      
      // If replacing existing image with crop/focal data, prompt user
      if (data.imageSrc && (data.crop || data.focalPoint)) {
        setNewImageSrc(urlInput)
        setShowReplacePrompt(true)
      } else {
        updateData(newImageData)
      }
      
      setUrlInput('')
      setShowUrlInput(false)
      toast.success('Image loaded successfully')
    }
    img.onerror = () => {
      toast.error('Failed to load image from URL')
    }
    img.crossOrigin = 'anonymous'
    img.src = urlInput
  }, [urlInput, updateData, data.size])

  const renderPlaceholder = () => (
    <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center bg-muted/10">
      <div className="flex flex-col items-center gap-4">
        <Image className="w-16 h-16 text-muted-foreground/50" />
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Add an image</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUrlInput(!showUrlInput)}
            >
              <Link2 className="w-4 h-4 mr-2" />
              URL
            </Button>
          </div>
        </div>
      </div>
      
      {showUrlInput && (
        <div className="mt-4 space-y-2">
          <Input
            placeholder="Paste image URL here..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
          />
          <div className="flex gap-2 justify-center">
            <Button size="sm" onClick={handleUrlSubmit}>Add Image</Button>
            <Button size="sm" variant="outline" onClick={() => setShowUrlInput(false)}>Cancel</Button>
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        className="hidden"
      />
    </div>
  )

  // Handle image editor save
  const handleImageEditorSave = useCallback((editorData: { crop?: CropData, focalPoint?: FocalPoint, aspectRatio?: number }) => {
    updateData({
      crop: editorData.crop,
      focalPoint: editorData.focalPoint,
      cropAspectRatio: editorData.aspectRatio
    })
    setShowImageEditor(false)
    toast.success('Image crop and focal point saved')
  }, [updateData])

  // Handle replace prompt
  const handleReplaceKeepCrop = useCallback(() => {
    if (!newImageSrc) return
    
    const img = document.createElement('img')
    img.onload = () => {
      updateData({
        imageSrc: newImageSrc,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
        // Keep existing crop and focal point
      })
    }
    img.src = newImageSrc
    
    setShowReplacePrompt(false)
    setNewImageSrc('')
  }, [newImageSrc, updateData])

  const handleReplaceResetCrop = useCallback(() => {
    if (!newImageSrc) return
    
    const img = document.createElement('img')
    img.onload = () => {
      updateData({
        imageSrc: newImageSrc,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
        aspectLock: true,
        crop: undefined,
        focalPoint: undefined,
        cropAspectRatio: undefined
      })
    }
    img.src = newImageSrc
    
    setShowReplacePrompt(false)
    setNewImageSrc('')
  }, [newImageSrc, updateData])

  const renderImage = () => {
    if (!data.imageSrc) return null

    const sizeClass = data.size === 'full-width' ? 'w-full' : 'max-w-full'
    const maxWidthStyle = data.maxWidth ? { maxWidth: `${data.maxWidth}px` } : {}
    
    // Calculate crop and focal point styles
    const cropStyle: React.CSSProperties = {}
    if (data.crop) {
      const { x, y, width, height } = data.crop
      cropStyle.objectPosition = `${(x + width/2) * 100}% ${(y + height/2) * 100}%`
      // Note: For true cropping, we'd need to use clip-path or container with overflow
    } else if (data.focalPoint) {
      cropStyle.objectPosition = `${data.focalPoint.x * 100}% ${data.focalPoint.y * 100}%`
    }

    return (
      <div className="relative group">
        {/* Drag Handle */}
        <div className="absolute -left-6 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
        </div>

        <img
          src={data.imageSrc}
          alt={data.altText || 'Figure'}
          className={`${sizeClass} h-auto rounded-lg shadow-sm cursor-pointer`}
          style={{
            ...maxWidthStyle,
            ...cropStyle,
            aspectRatio: data.aspectLock && data.aspectRatio ? data.aspectRatio : 'auto',
            objectFit: data.crop ? 'cover' : 'contain'
          }}
          role="img"
          aria-describedby={data.caption ? `caption-${Math.random()}` : undefined}
          onDoubleClick={() => setShowImageEditor(true)}
        />
        
        {isEditing && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-lg flex items-center justify-center">
            <div className="bg-background/90 p-2 rounded shadow-lg flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowImageEditor(true)}>
                <Edit3 className="w-3 h-3 mr-1" />
                Edit Image
              </Button>
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <RotateCcw className="w-3 h-3 mr-1" />
                Replace
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateData({ size: data.size === 'full-width' ? 'column-width' : 'full-width' })}
              >
                {data.size === 'full-width' ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        )}
        
        {/* Crop/Focal indicators */}
        {(data.crop || data.focalPoint) && !isEditing && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs">
              {data.crop && <Crop className="w-3 h-3 mr-1" />}
              Edited
            </Badge>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          className="hidden"
        />
      </div>
    )
  }

  const renderCaption = () => {
    if (!data.caption && !isEditing) return null

    return (
      <figcaption className="mt-3 text-sm text-muted-foreground text-center">
        {isEditing ? (
          <Textarea
            placeholder="Enter caption..."
            value={data.caption || ''}
            onChange={(e) => updateData({ caption: e.target.value })}
            className="text-center resize-none min-h-[60px]"
          />
        ) : (
          <span className="italic">{data.caption}</span>
        )}
        {showInvisibles && (
          <span className="text-purple-400/60 font-mono text-xs ml-1">¶</span>
        )}
      </figcaption>
    )
  }

  const renderPropertiesPanel = () => {
    if (!isEditing) return null

    const needsAltText = !data.altText?.trim()

    return (
      <Card className="mt-4 p-4 space-y-4 bg-muted/30">
        <div className="flex items-center gap-2">
          <Label className="font-semibold">Figure Properties</Label>
          {needsAltText && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Alt text required
            </Badge>
          )}
        </div>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="altText" className="text-sm">Alt Text *</Label>
            <Input
              id="altText"
              placeholder="Describe the image for accessibility..."
              value={data.altText || ''}
              onChange={(e) => updateData({ altText: e.target.value })}
              className={needsAltText ? 'border-destructive' : ''}
            />
            {needsAltText && (
              <p className="text-xs text-destructive mt-1">Alt text helps screen readers understand the image</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="size" className="text-sm">Size</Label>
              <Select 
                value={data.size || 'column-width'} 
                onValueChange={(value: 'column-width' | 'full-width') => updateData({ size: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="column-width">Column Width</SelectItem>
                  <SelectItem value="full-width">Full Width</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="maxWidth" className="text-sm">Max Width (px)</Label>
              <Input
                id="maxWidth"
                type="number"
                placeholder="Auto"
                value={data.maxWidth || ''}
                onChange={(e) => updateData({ maxWidth: e.target.value ? parseInt(e.target.value) : undefined })}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="aspectLock"
              checked={data.aspectLock !== false}
              onCheckedChange={(checked) => updateData({ aspectLock: checked })}
            />
            <Label htmlFor="aspectLock" className="text-sm">Lock aspect ratio</Label>
          </div>
          
          {data.originalWidth && data.originalHeight && (
            <div className="text-xs text-muted-foreground">
              Original: {data.originalWidth} × {data.originalHeight} px
              {data.aspectRatio && ` (${data.aspectRatio.toFixed(2)}:1)`}
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <>
      <figure 
        className={`
          relative mb-6 cursor-pointer transition-all
          ${isSelected ? 'ring-2 ring-primary' : ''}
          ${data.size === 'full-width' ? 'mx-auto' : ''}
          ${className}
        `}
        onClick={onClick}
        role="img"
        aria-label={data.altText || 'Figure'}
        tabIndex={0}
      >
        {data.imageSrc ? renderImage() : renderPlaceholder()}
        {renderCaption()}
        {renderPropertiesPanel()}
      </figure>
      
      {/* Image Editor Modal */}
      {showImageEditor && data.imageSrc && (
        <ImageEditor
          imageSrc={data.imageSrc}
          data={{
            crop: data.crop,
            focalPoint: data.focalPoint,
            aspectRatio: data.cropAspectRatio
          }}
          onSave={handleImageEditorSave}
          onCancel={() => setShowImageEditor(false)}
        />
      )}
      
      {/* Replace Prompt Modal */}
      {showReplacePrompt && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-background border rounded-lg shadow-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-4">Replace Image</h3>
            <p className="text-sm text-muted-foreground mb-6">
              This image has been cropped or has a focal point set. What would you like to do?
            </p>
            <div className="flex gap-3">
              <Button onClick={handleReplaceKeepCrop} className="flex-1">
                Keep Crop & Focal Point
              </Button>
              <Button onClick={handleReplaceResetCrop} variant="outline" className="flex-1">
                Reset All Edits
              </Button>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => setShowReplacePrompt(false)}
              className="w-full mt-3"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </>
  )
}