import { useState } from 'react'
import { LayoutIntent } from '@/lib/document-model'
import { LAYOUT_PRESETS, applyLayoutPreset } from '@/lib/layout-presets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Monitor, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LayoutPresetDemoProps {
  onPresetApply?: (intent: LayoutIntent) => void
  className?: string
}

export const LayoutPresetDemo = ({ onPresetApply, className }: LayoutPresetDemoProps) => {
  const [selectedPreset, setSelectedPreset] = useState<LayoutIntent>('data-appendix')
  
  const handlePresetSelect = (intent: LayoutIntent) => {
    setSelectedPreset(intent)
    const pageMaster = applyLayoutPreset(intent)
    console.log(`Applied ${intent} preset:`, pageMaster)
    onPresetApply?.(intent)
  }

  const currentPreset = LAYOUT_PRESETS[selectedPreset]

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Layout Presets Demo
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the layout presets system - notice how Data Appendix enables landscape rotation
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Preset Selection */}
        <div className="grid grid-cols-2 gap-3">
          {Object.values(LAYOUT_PRESETS).slice(0, 4).map((preset) => (
            <Button
              key={preset.id}
              variant={selectedPreset === preset.id ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetSelect(preset.id)}
              className="flex items-center gap-2 h-auto p-3 text-left"
            >
              <span className="text-lg">{preset.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{preset.name}</div>
                <div className="text-xs opacity-70 truncate">
                  {preset.pageMaster.columns} col, {preset.pageMaster.orientation}
                </div>
              </div>
            </Button>
          ))}
        </div>

        {/* Current Preset Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Current: {currentPreset.name}</h4>
            <div className="flex items-center gap-2">
              {currentPreset.pageMaster.orientation === 'landscape' && (
                <Badge variant="secondary" className="text-xs">
                  <Monitor className="w-3 h-3 mr-1" />
                  Landscape
                </Badge>
              )}
              {currentPreset.pageMaster.allowTableRotation && (
                <Badge variant="default" className="text-xs">
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Table Rotation
                </Badge>
              )}
            </div>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <p className="text-sm text-muted-foreground">{currentPreset.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Page Size:</span> {currentPreset.pageMaster.pageSize}
              </div>
              <div>
                <span className="font-medium">Orientation:</span> {currentPreset.pageMaster.orientation}
              </div>
              <div>
                <span className="font-medium">Columns:</span> {currentPreset.pageMaster.columns}
              </div>
              <div>
                <span className="font-medium">Margins:</span> {currentPreset.pageMaster.margins.top}"
              </div>
            </div>

            {/* Special Data Appendix Features */}
            {selectedPreset === 'data-appendix' && (
              <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <h5 className="font-medium text-primary mb-2">🎯 Data Appendix Features</h5>
                <ul className="text-sm space-y-1 text-primary/80">
                  <li>✓ Landscape orientation (11" × 8.5")</li>
                  <li>✓ Table rotation enabled for wide data</li>
                  <li>✓ Minimal margins (0.5") for maximum content space</li>
                  <li>✓ Optimized for charts, tables, and data visualization</li>
                </ul>
              </div>
            )}

            {/* Features List */}
            <div className="flex flex-wrap gap-1 mt-3">
              {currentPreset.features.map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}