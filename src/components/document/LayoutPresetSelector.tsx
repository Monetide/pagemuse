import { useState } from 'react'
import { LayoutIntent, PageMaster } from '@/lib/document-model'
import { LAYOUT_PRESETS, applyLayoutPreset, detectLayoutIntent } from '@/lib/layout-presets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Check, Palette, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LayoutPresetSelectorProps {
  currentPageMaster: PageMaster
  currentIntent?: LayoutIntent
  onPresetSelect: (intent: LayoutIntent, pageMaster: PageMaster) => void
  onCustomize?: () => void
}

export const LayoutPresetSelector = ({
  currentPageMaster,
  currentIntent,
  onPresetSelect,
  onCustomize
}: LayoutPresetSelectorProps) => {
  const [selectedIntent, setSelectedIntent] = useState<LayoutIntent>(
    currentIntent || detectLayoutIntent(currentPageMaster)
  )

  const handlePresetSelect = (intent: LayoutIntent) => {
    setSelectedIntent(intent)
    
    if (intent === 'custom') {
      onCustomize?.()
      return
    }
    
    const newPageMaster = applyLayoutPreset(intent)
    onPresetSelect(intent, newPageMaster)
  }

  const presets = Object.values(LAYOUT_PRESETS)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Layout Presets
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose a layout intent to optimize your section for specific content types
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {presets.map((preset) => {
            const isSelected = selectedIntent === preset.id
            
            return (
              <div
                key={preset.id}
                className={cn(
                  "relative p-4 border rounded-lg cursor-pointer transition-all",
                  isSelected 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                )}
                onClick={() => handlePresetSelect(preset.id)}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="default" className="text-xs">
                      <Check className="w-3 h-3 mr-1" />
                      Selected
                    </Badge>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{preset.icon}</div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{preset.name}</h3>
                      {preset.id === 'data-appendix' && (
                        <Badge variant="secondary" className="text-xs">
                          Landscape
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {preset.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      {preset.features.slice(0, 2).map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {preset.features.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{preset.features.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Technical specs */}
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">Columns:</span> {preset.pageMaster.columns}
                    </div>
                    <div>
                      <span className="font-medium">Margins:</span> {preset.pageMaster.margins.top}"
                    </div>
                    <div>
                      <span className="font-medium">Orientation:</span> {preset.pageMaster.orientation}
                    </div>
                  </div>
                  
                  {preset.id === 'data-appendix' && preset.pageMaster.allowTableRotation && (
                    <div className="mt-2 text-xs text-primary font-medium">
                      ✓ Table rotation enabled for wide data
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        <Separator />
        
        {selectedIntent !== 'custom' && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCustomize}
            className="w-full"
          >
            <Settings className="w-4 h-4 mr-2" />
            Customize Layout
          </Button>
        )}
      </CardContent>
    </Card>
  )
}