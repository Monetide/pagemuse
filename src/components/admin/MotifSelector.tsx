import { useState, useEffect, useRef } from 'react'
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shuffle, Shapes, Eye, Download } from 'lucide-react'
import { generateMotifAssets, shuffleMotifs, type MotifAsset, type MotifVariant, type MotifColors } from '@/lib/svg-motif-generator'

interface MotifSelection {
  'body-bg': string
  'divider': string
  'cover-shape': string
}

interface MotifSelectorProps {
  colors?: MotifColors
  selectedMotifs?: Partial<MotifSelection>
  onSelectionChange: (selection: MotifSelection, assets: MotifAsset[]) => void
}

const MotifSelector = React.memo(function MotifSelector({ colors, selectedMotifs, onSelectionChange }: MotifSelectorProps) {
  const [motifAssets, setMotifAssets] = useState<MotifAsset[]>([])
  const [selection, setSelection] = useState<MotifSelection>({
    'body-bg': 'isometric-grid-faint',
    'divider': 'thin-rule',
    'cover-shape': 'tilted-ribbon'
  })

  // Keep a stable reference to the callback
  const onSelectionChangeRef = useRef(onSelectionChange)
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange
  }, [onSelectionChange])

  // Generate motifs when colors change
  useEffect(() => {
    if (colors) {
      const assets = generateMotifAssets(colors)
      setMotifAssets(assets)
    }
  }, [colors])

  // Update selection when selectedMotifs prop changes
  useEffect(() => {
    if (selectedMotifs) {
      setSelection(prev => ({
        ...prev,
        ...selectedMotifs
      }))
    }
  }, [selectedMotifs])

  // Notify parent when selection changes - using ref to avoid dependency loops
  useEffect(() => {
    if (motifAssets.length > 0) {
      onSelectionChangeRef.current(selection, motifAssets)
    }
  }, [selection, motifAssets]) // Removed onSelectionChange from deps

  const handleVariantSelect = (assetType: keyof MotifSelection, variantId: string) => {
    const newSelection = { ...selection, [assetType]: variantId }
    setSelection(newSelection)
  }

  const handleShuffle = () => {
    if (motifAssets.length > 0) {
      const shuffled = shuffleMotifs(motifAssets)
      setSelection(shuffled)
    }
  }

  const downloadSVG = (variant: MotifVariant, filename: string) => {
    const blob = new Blob([variant.svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!colors || motifAssets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shapes className="w-5 h-5 text-muted-foreground" />
            SVG Motifs
          </CardTitle>
          <CardDescription>
            Select a colorway to generate brand-aware vector assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Shapes className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Motifs will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getAssetLabel = (type: string) => {
    switch (type) {
      case 'body-bg': return 'Background Pattern'
      case 'divider': return 'Divider Rule'
      case 'cover-shape': return 'Cover Shape'
      default: return type
    }
  }

  const getAssetDescription = (type: string) => {
    switch (type) {
      case 'body-bg': return 'Subtle large-scale geometry for page backgrounds'
      case 'divider': return 'Clean rules for section separation'
      case 'cover-shape': return 'Hero shapes for covers and headers'
      default: return ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shapes className="w-5 h-5 text-primary" />
              SVG Motifs
            </CardTitle>
            <CardDescription>
              Brand-aware procedural vector assets
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShuffle}
            className="flex items-center gap-2"
          >
            <Shuffle className="w-4 h-4" />
            Shuffle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {motifAssets.map((asset) => (
            <div key={asset.type} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">{getAssetLabel(asset.type)}</h4>
                  <p className="text-xs text-muted-foreground">{getAssetDescription(asset.type)}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {asset.variants.length} variants
                </Badge>
              </div>
              
          <div className="grid grid-cols-4 gap-3">{asset.variants.map((variant) => {
                  const isSelected = selection[asset.type] === variant.id
                  
                  return (
                    <Button
                      key={variant.id}
                      variant="outline"
                      className={`h-auto p-3 flex flex-col items-center gap-2 transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => handleVariantSelect(asset.type as keyof MotifSelection, variant.id)}
                    >
                      {/* SVG Preview */}
                      <div className="w-full h-16 bg-background rounded border overflow-hidden flex items-center justify-center">
                        <img 
                          src={variant.preview}
                          alt={variant.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      
                      {/* Variant Info */}
                      <div className="text-center">
                        <div className="text-xs font-medium">{variant.name}</div>
                        {isSelected && (
                          <Badge className="text-xs mt-1 bg-primary/10 text-primary border-primary/20">
                            Selected
                          </Badge>
                        )}
                      </div>
                    </Button>
                  )
                })}
              </div>
              
              {/* Selected Variant Actions */}
              {selection[asset.type] && (
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">
                      Selected: {asset.variants.find(v => v.id === selection[asset.type])?.name}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const variant = asset.variants.find(v => v.id === selection[asset.type])
                      if (variant) {
                        const filename = `${asset.type}-${variant.id}.svg`
                        downloadSVG(variant, filename)
                      }
                    }}
                    className="text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    SVG
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Preview All Selected */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="text-sm font-medium mb-3">Selected Motifs Preview</div>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(selection).map(([type, variantId]) => {
              const asset = motifAssets.find(a => a.type === type)
              const variant = asset?.variants.find(v => v.id === variantId)
              
              if (!variant) return null
              
              return (
                <div key={type} className="space-y-2">
                  <div className="text-xs text-muted-foreground text-center font-medium">
                    {getAssetLabel(type)}
                  </div>
                  <div className="h-20 bg-muted/20 rounded border flex items-center justify-center">
                    <img 
                      src={variant.preview}
                      alt={variant.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="text-xs text-center text-muted-foreground">
                    {variant.name}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

export { MotifSelector }
export type { MotifSelection, MotifAsset }