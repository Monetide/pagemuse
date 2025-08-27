import { useState, useEffect, useRef } from 'react'
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Palette, Check, Shield } from 'lucide-react'
import { generateColorways, type Colorway } from '@/lib/colorway-generator'

interface ColorwaySelectorProps {
  brandColor: string
  selectedColorway?: string
  onSelectionChange: (colorway: Colorway) => void
}

const ColorwaySelector = React.memo(function ColorwaySelector({ brandColor, selectedColorway, onSelectionChange }: ColorwaySelectorProps) {
  const [colorways, setColorways] = useState<Colorway[]>([])
  const [activeColorway, setActiveColorway] = useState<string>(selectedColorway || 'primary')
  
  // Keep a stable reference to the callback
  const onSelectionChangeRef = useRef(onSelectionChange)
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange
  }, [onSelectionChange])

  // Generate colorways when brand color changes - removed callback from deps
  useEffect(() => {
    if (brandColor && brandColor.match(/^#[0-9A-F]{6}$/i)) {
      const generated = generateColorways(brandColor)
      setColorways(generated)
      
      // Auto-select first compliant colorway only if no selectedColorway exists
      const compliantColorway = generated.find(c => c.isCompliant) || generated[0]
      if (compliantColorway && !selectedColorway) {
        setActiveColorway(compliantColorway.id)
        onSelectionChangeRef.current(compliantColorway)
      }
    }
  }, [brandColor, selectedColorway]) // Removed onSelectionChange from deps

  const handleColorwaySelect = (colorway: Colorway) => {
    setActiveColorway(colorway.id)
    onSelectionChange(colorway)
  }

  if (!colorways.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-muted-foreground" />
            Colorways
          </CardTitle>
          <CardDescription>
            Select a primary color to generate AA-safe colorways
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Palette className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Colorways will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Colorways
        </CardTitle>
        <CardDescription>
          AA-compliant color palettes derived from your brand color
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {colorways.map((colorway) => {
            const isSelected = activeColorway === colorway.id
            
            return (
              <Button
                key={colorway.id}
                variant="outline"
                className={`h-auto p-4 justify-start text-left transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleColorwaySelect(colorway)}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}
                      `}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base">{colorway.name}</span>
                          {colorway.isCompliant ? (
                            <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                              <Shield className="w-3 h-3 mr-1" />
                              AA
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              Needs Review
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{colorway.description}</div>
                      </div>
                    </div>

                    {/* Color Swatches */}
                    <div className="ml-8 space-y-3">
                      {/* Brand Colors */}
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Brand Colors</div>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border border-border shadow-sm"
                            style={{ backgroundColor: colorway.colors.brand }}
                            title={`Brand: ${colorway.colors.brand}`}
                          />
                          <div 
                            className="w-6 h-6 rounded border border-border shadow-sm"
                            style={{ backgroundColor: colorway.colors.brandSecondary }}
                            title={`Secondary: ${colorway.colors.brandSecondary}`}
                          />
                          <div 
                            className="w-6 h-6 rounded border border-border shadow-sm"
                            style={{ backgroundColor: colorway.colors.brandAccent }}
                            title={`Accent: ${colorway.colors.brandAccent}`}
                          />
                        </div>
                      </div>

                      {/* Text & Background Preview */}
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Text & Backgrounds</div>
                        
                        {/* Page Background Sample */}
                        <div 
                          className="rounded border border-border p-2 text-xs"
                          style={{ 
                            backgroundColor: colorway.colors.bgPage,
                            color: colorway.colors.textBody 
                          }}
                        >
                          <div className="font-medium">Body text on page</div>
                          <div 
                            className="text-xs mt-1"
                            style={{ color: colorway.colors.textMuted }}
                          >
                            Muted text • Ratio: {colorway.colors.contrastRatios.bodyOnPage.toFixed(1)}:1
                          </div>
                        </div>

                        {/* Section Background Sample */}
                        <div 
                          className="rounded border border-border p-2 text-xs"
                          style={{ 
                            backgroundColor: colorway.colors.bgSection,
                            color: colorway.colors.textBody 
                          }}
                        >
                          <div className="font-medium">Body text on section</div>
                          <div 
                            className="text-xs mt-1"
                            style={{ color: colorway.colors.textMuted }}
                          >
                            Muted text • Ratio: {colorway.colors.contrastRatios.bodyOnSection.toFixed(1)}:1
                          </div>
                        </div>
                      </div>

                      {/* Compliance Status */}
                      <div className="pt-2 border-t border-border/50">
                        <div className="text-xs text-muted-foreground mb-1">Accessibility Compliance</div>
                        <div className="grid grid-cols-2 gap-1">
                          {Object.entries(colorway.colors.contrastRatios).map(([key, ratio]) => {
                            const isCompliant = ratio >= 4.5
                            const label = key.replace(/([A-Z])/g, ' $1').toLowerCase()
                            
                            return (
                              <div key={key} className="flex items-center justify-between text-xs">
                                <span className="capitalize">{label}:</span>
                                <Badge 
                                  variant={isCompliant ? "default" : "destructive"}
                                  className="text-xs px-1.5 py-0"
                                >
                                  {ratio.toFixed(1)}:1
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
})

export { ColorwaySelector }
export type { Colorway }
export { generateColorways }