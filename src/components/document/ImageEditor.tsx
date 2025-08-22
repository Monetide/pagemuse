import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Crop, 
  RotateCcw, 
  Check, 
  X, 
  Move, 
  Grid3x3,
  Target
} from 'lucide-react'

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

interface ImageEditorData {
  crop?: CropData
  focalPoint?: FocalPoint
  aspectRatio?: number
}

interface ImageEditorProps {
  imageSrc: string
  data?: ImageEditorData
  onSave: (data: ImageEditorData) => void
  onCancel: () => void
}

const ASPECT_RATIOS = [
  { label: 'Original', value: null },
  { label: 'Free', value: 0 },
  { label: '1:1', value: 1 },
  { label: '3:2', value: 1.5 },
  { label: '4:3', value: 1.333 },
  { label: '16:9', value: 1.778 }
]

export const ImageEditor = ({ imageSrc, data = {}, onSave, onCancel }: ImageEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 })
  
  // Editor state
  const [mode, setMode] = useState<'crop' | 'focal'>('crop')
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number | null>(data.aspectRatio ?? null)
  const [showGrid, setShowGrid] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState<'move' | 'resize' | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  // Crop and focal state
  const [crop, setCrop] = useState<CropData>(
    data.crop || { x: 0, y: 0, width: 1, height: 1 }
  )
  const [focalPoint, setFocalPoint] = useState<FocalPoint>(
    data.focalPoint || { x: 0.5, y: 0.5 }
  )

  // Handle image load
  const handleImageLoad = useCallback(() => {
    if (!imageRef.current) return
    
    const img = imageRef.current
    const naturalWidth = img.naturalWidth
    const naturalHeight = img.naturalHeight
    const displayWidth = img.clientWidth
    const displayHeight = img.clientHeight
    
    setImageDimensions({ width: naturalWidth, height: naturalHeight })
    setDisplayDimensions({ width: displayWidth, height: displayHeight })
    setImageLoaded(true)
    
    // If no crop exists, initialize to full image
    if (!data.crop) {
      setCrop({ x: 0, y: 0, width: 1, height: 1 })
    }
  }, [data.crop])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!imageLoaded) return
      
      const nudgeAmount = 0.01
      const resizeAmount = 0.02
      
      switch (e.key) {
        case 'Escape':
          onCancel()
          break
        case 'ArrowUp':
          if (mode === 'crop') {
            if (e.shiftKey) {
              setCrop(prev => ({ ...prev, height: Math.max(0.1, prev.height - resizeAmount) }))
            } else {
              setCrop(prev => ({ ...prev, y: Math.max(0, prev.y - nudgeAmount) }))
            }
          } else {
            setFocalPoint(prev => ({ ...prev, y: Math.max(0, prev.y - nudgeAmount) }))
          }
          e.preventDefault()
          break
        case 'ArrowDown':
          if (mode === 'crop') {
            if (e.shiftKey) {
              setCrop(prev => ({ ...prev, height: Math.min(1 - prev.y, prev.height + resizeAmount) }))
            } else {
              setCrop(prev => ({ ...prev, y: Math.min(1 - prev.height, prev.y + nudgeAmount) }))
            }
          } else {
            setFocalPoint(prev => ({ ...prev, y: Math.min(1, prev.y + nudgeAmount) }))
          }
          e.preventDefault()
          break
        case 'ArrowLeft':
          if (mode === 'crop') {
            if (e.shiftKey) {
              setCrop(prev => ({ ...prev, width: Math.max(0.1, prev.width - resizeAmount) }))
            } else {
              setCrop(prev => ({ ...prev, x: Math.max(0, prev.x - nudgeAmount) }))
            }
          } else {
            setFocalPoint(prev => ({ ...prev, x: Math.max(0, prev.x - nudgeAmount) }))
          }
          e.preventDefault()
          break
        case 'ArrowRight':
          if (mode === 'crop') {
            if (e.shiftKey) {
              setCrop(prev => ({ ...prev, width: Math.min(1 - prev.x, prev.width + resizeAmount) }))
            } else {
              setCrop(prev => ({ ...prev, x: Math.min(1 - prev.width, prev.x + nudgeAmount) }))
            }
          } else {
            setFocalPoint(prev => ({ ...prev, x: Math.min(1, prev.x + nudgeAmount) }))
          }
          e.preventDefault()
          break
        case 'g':
          setShowGrid(!showGrid)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [imageLoaded, mode, showGrid, onCancel])

  // Handle aspect ratio change
  const handleAspectRatioChange = (ratio: string) => {
    const numRatio = ratio === 'original' ? null : ratio === 'free' ? 0 : parseFloat(ratio)
    setSelectedAspectRatio(numRatio)
    
    if (numRatio && numRatio > 0) {
      // Adjust crop to match aspect ratio
      const centerX = crop.x + crop.width / 2
      const centerY = crop.y + crop.height / 2
      
      const imageAspect = imageDimensions.width / imageDimensions.height
      const cropAspect = numRatio / imageAspect
      
      let newWidth = crop.width
      let newHeight = crop.height
      
      if (cropAspect > crop.width / crop.height) {
        newHeight = crop.width / cropAspect
      } else {
        newWidth = crop.height * cropAspect
      }
      
      setCrop({
        x: Math.max(0, Math.min(1 - newWidth, centerX - newWidth / 2)),
        y: Math.max(0, Math.min(1 - newHeight, centerY - newHeight / 2)),
        width: newWidth,
        height: newHeight
      })
    }
  }

  // Handle mouse events for cropping
  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize') => {
    if (mode !== 'crop') return
    
    setIsDragging(true)
    setDragType(type)
    
    const rect = imageRef.current?.getBoundingClientRect()
    if (!rect) return
    
    setDragStart({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    })
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !imageRef.current || dragType !== 'move') return
    
    const rect = imageRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    
    const deltaX = x - dragStart.x
    const deltaY = y - dragStart.y
    
    setCrop(prev => ({
      ...prev,
      x: Math.max(0, Math.min(1 - prev.width, prev.x + deltaX)),
      y: Math.max(0, Math.min(1 - prev.height, prev.y + deltaY))
    }))
    
    setDragStart({ x, y })
  }, [isDragging, dragType, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragType(null)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Handle focal point click
  const handleImageClick = (e: React.MouseEvent) => {
    if (mode !== 'focal' || !imageRef.current) return
    
    const rect = imageRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    
    setFocalPoint({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) })
  }

  const handleSave = () => {
    const cropToSave = (crop.x === 0 && crop.y === 0 && crop.width === 1 && crop.height === 1) 
      ? undefined 
      : crop
    
    const focalToSave = (focalPoint.x === 0.5 && focalPoint.y === 0.5) 
      ? undefined 
      : focalPoint
    
    onSave({
      crop: cropToSave,
      focalPoint: focalToSave,
      aspectRatio: selectedAspectRatio || undefined
    })
  }

  const handleReset = () => {
    setCrop({ x: 0, y: 0, width: 1, height: 1 })
    setFocalPoint({ x: 0.5, y: 0.5 })
    setSelectedAspectRatio(null)
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-background border rounded-lg shadow-lg max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Crop className="w-5 h-5" />
              Image Editor
            </h3>
            
            <div className="flex gap-2">
              <Button
                variant={mode === 'crop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('crop')}
              >
                <Crop className="w-4 h-4 mr-2" />
                Crop
              </Button>
              <Button
                variant={mode === 'focal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('focal')}
              >
                <Target className="w-4 h-4 mr-2" />
                Focal Point
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
            <Button onClick={handleSave}>
              <Check className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
        </div>

        {/* Controls */}
        {mode === 'crop' && (
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Aspect Ratio:</Label>
                <Select
                  value={selectedAspectRatio === null ? 'original' : selectedAspectRatio === 0 ? 'free' : selectedAspectRatio.toString()}
                  onValueChange={handleAspectRatioChange}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map(ratio => (
                      <SelectItem 
                        key={ratio.label} 
                        value={ratio.value === null ? 'original' : ratio.value === 0 ? 'free' : ratio.value.toString()}
                      >
                        {ratio.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant={showGrid ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowGrid(!showGrid)}
              >
                <Grid3x3 className="w-4 h-4 mr-2" />
                Grid
              </Button>
              
              <Badge variant="outline" className="text-xs">
                Use arrow keys to nudge • Shift + arrows to resize • G for grid
              </Badge>
            </div>
          </div>
        )}

        {mode === 'focal' && (
          <div className="p-4 border-b bg-muted/30">
            <Badge variant="outline" className="text-xs">
              Click on the image to set focal point • Arrow keys to nudge • Focal point affects how image scales
            </Badge>
          </div>
        )}

        {/* Image Container */}
        <div className="flex-1 p-4 overflow-auto">
          <div 
            ref={containerRef}
            className="relative max-w-full max-h-full flex items-center justify-center"
          >
            <div className="relative">
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Edit image"
                className="max-w-full max-h-[60vh] object-contain"
                onLoad={handleImageLoad}
                onClick={handleImageClick}
                style={{ cursor: mode === 'focal' ? 'crosshair' : 'default' }}
              />
              
              {imageLoaded && (
                <>
                  {/* Rule of thirds grid */}
                  {showGrid && mode === 'crop' && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Vertical lines */}
                      <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/60" />
                      <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/60" />
                      {/* Horizontal lines */}
                      <div className="absolute top-1/3 left-0 right-0 h-px bg-white/60" />
                      <div className="absolute top-2/3 left-0 right-0 h-px bg-white/60" />
                    </div>
                  )}
                  
                  {/* Crop overlay */}
                  {mode === 'crop' && (
                    <>
                      {/* Darkened areas outside crop */}
                      <div className="absolute inset-0 bg-black/50 pointer-events-none">
                        <div
                          className="bg-transparent"
                          style={{
                            position: 'absolute',
                            left: `${crop.x * 100}%`,
                            top: `${crop.y * 100}%`,
                            width: `${crop.width * 100}%`,
                            height: `${crop.height * 100}%`,
                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                          }}
                        />
                      </div>
                      
                      {/* Crop rectangle */}
                      <div
                        className="absolute border-2 border-white cursor-move"
                        style={{
                          left: `${crop.x * 100}%`,
                          top: `${crop.y * 100}%`,
                          width: `${crop.width * 100}%`,
                          height: `${crop.height * 100}%`
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'move')}
                      >
                        {/* Crop handles */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-gray-300" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-gray-300" />
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-gray-300" />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-gray-300" />
                        
                        {/* Center move indicator */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <Move className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Focal point indicator */}
                  {mode === 'focal' && (
                    <div
                      className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{
                        left: `${focalPoint.x * 100}%`,
                        top: `${focalPoint.y * 100}%`
                      }}
                    >
                      <div className="w-4 h-4 rounded-full border-2 border-white bg-red-500 shadow-lg" />
                      <div className="absolute inset-1 rounded-full border border-white/60" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}