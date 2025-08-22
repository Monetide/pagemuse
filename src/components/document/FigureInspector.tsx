import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Block } from '@/lib/document-model'
import { 
  Upload, 
  Link2, 
  RotateCcw, 
  Trash2,
  Copy,
  AlertTriangle,
  Image
} from 'lucide-react'

interface FigureInspectorProps {
  block: Block
  onUpdate: (updates: Partial<Block>) => void
  onDelete: () => void
  onDuplicate: () => void
}

export const FigureInspector = ({ 
  block, 
  onUpdate, 
  onDelete, 
  onDuplicate 
}: FigureInspectorProps) => {
  const [urlInput, setUrlInput] = useState('')
  
  const figureData = block.content || {}
  
  const updateContent = (updates: any) => {
    onUpdate({
      ...block,
      content: { ...figureData, ...updates }
    })
  }

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return
    
    // Basic URL validation
    try {
      new URL(urlInput.trim())
      updateContent({ imageSrc: urlInput.trim() })
      setUrlInput('')
    } catch {
      console.error('Invalid URL')
    }
  }

  const needsAltText = !figureData.altText?.trim()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Figure Properties
            {needsAltText && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Missing Alt Text
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Source */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Image Source</Label>
            {figureData.imageSrc ? (
              <div className="space-y-2">
                <div className="relative">
                  <img
                    src={figureData.imageSrc}
                    alt={figureData.altText || 'Figure preview'}
                    className="w-full max-w-48 h-auto rounded border"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateContent({ imageSrc: undefined })}
                >
                  <RotateCcw className="w-3 h-3 mr-2" />
                  Replace Image
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste image URL..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  />
                  <Button size="sm" onClick={handleUrlSubmit}>
                    <Link2 className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Or use the upload button in the figure block
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Alt Text */}
          <div className="space-y-2">
            <Label htmlFor="altText" className="text-sm font-medium">
              Alt Text *
            </Label>
            <Input
              id="altText"
              placeholder="Describe the image for accessibility..."
              value={figureData.altText || ''}
              onChange={(e) => updateContent({ altText: e.target.value })}
              className={needsAltText ? 'border-destructive' : ''}
            />
            {needsAltText && (
              <p className="text-xs text-destructive">
                Alt text is required for accessibility
              </p>
            )}
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption" className="text-sm font-medium">
              Caption
            </Label>
            <Textarea
              id="caption"
              placeholder="Optional figure caption..."
              value={figureData.caption || ''}
              onChange={(e) => updateContent({ caption: e.target.value })}
              className="min-h-[60px] resize-none"
            />
          </div>

          <Separator />

          {/* Layout & Sizing */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Layout & Sizing</Label>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="size" className="text-xs">Size</Label>
                <Select 
                  value={figureData.size || 'column-width'} 
                  onValueChange={(value) => updateContent({ size: value })}
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
                <Label htmlFor="maxWidth" className="text-xs">Max Width (px)</Label>
                <Input
                  id="maxWidth"
                  type="number"
                  placeholder="Auto"
                  value={figureData.maxWidth || ''}
                  onChange={(e) => updateContent({ 
                    maxWidth: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="aspectLock"
                checked={figureData.aspectLock !== false}
                onCheckedChange={(checked) => updateContent({ aspectLock: checked })}
              />
              <Label htmlFor="aspectLock" className="text-xs">
                Lock aspect ratio
              </Label>
            </div>

            {figureData.originalWidth && figureData.originalHeight && (
              <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                <strong>Original dimensions:</strong> {figureData.originalWidth} × {figureData.originalHeight} px
                {figureData.aspectRatio && (
                  <span className="block">
                    <strong>Aspect ratio:</strong> {figureData.aspectRatio.toFixed(2)}:1
                  </span>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDuplicate}
              className="flex-1"
            >
              <Copy className="w-3 h-3 mr-2" />
              Duplicate
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="flex-1"
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}