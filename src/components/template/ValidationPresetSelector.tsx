import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  Shield, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  Eye,
  Type,
  Palette,
  Layout,
  FileText,
  Settings
} from 'lucide-react'
import { TemplateValidationPreset, createValidationPresets } from '@/lib/template-model'

interface ValidationPresetSelectorProps {
  selectedPreset: string
  onPresetChange: (presetId: string) => void
  showDetails?: boolean
}

export function ValidationPresetSelector({ 
  selectedPreset, 
  onPresetChange,
  showDetails = false 
}: ValidationPresetSelectorProps) {
  const [previewPreset, setPreviewPreset] = useState<TemplateValidationPreset | null>(null)
  const presets = createValidationPresets()
  
  const selectedPresetData = presets.find(p => p.id === selectedPreset) || presets[0]

  const getSeverityColor = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error': return <Shield className="w-4 h-4" />
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      case 'info': return <Info className="w-4 h-4" />
    }
  }

  const getStrictnessLevel = (preset: TemplateValidationPreset): number => {
    const errorCount = Object.values(preset.severity).filter(s => s === 'error').length
    const warningCount = Object.values(preset.severity).filter(s => s === 'warning').length
    return (errorCount * 3 + warningCount * 2) * 20 // Scale to 0-100
  }

  const ValidationRulesSummary = ({ preset }: { preset: TemplateValidationPreset }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-primary" />
            <h5 className="font-medium">Typography</h5>
            <Badge 
              variant="outline" 
              className={getSeverityColor(preset.severity.typography)}
            >
              {getSeverityIcon(preset.severity.typography)}
              {preset.severity.typography}
            </Badge>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6">
            <li>• Min body font: {preset.rules.typography.minBodyFontSize}pt</li>
            <li>• Min heading: {preset.rules.typography.minHeadingFontSize}pt</li>
            <li>• Max line length: {preset.rules.typography.maxLineLength} chars</li>
            <li>• Hyphenation: {preset.rules.typography.hyphenationEnabled ? 'On' : 'Off'}</li>
          </ul>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            <h5 className="font-medium">Accessibility</h5>
            <Badge 
              variant="outline" 
              className={getSeverityColor(preset.severity.accessibility)}
            >
              {getSeverityIcon(preset.severity.accessibility)}
              {preset.severity.accessibility}
            </Badge>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6">
            <li>• Min contrast: {preset.rules.accessibility.minContrastRatio}:1</li>
            <li>• Alt text: {preset.rules.accessibility.requireAltText ? 'Required' : 'Optional'}</li>
            <li>• Click targets: ≥{preset.rules.accessibility.maxClickTargetSize}px</li>
          </ul>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-primary" />
            <h5 className="font-medium">Layout</h5>
            <Badge 
              variant="outline" 
              className={getSeverityColor(preset.severity.layout)}
            >
              {getSeverityIcon(preset.severity.layout)}
              {preset.severity.layout}
            </Badge>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6">
            <li>• Min margins: {preset.rules.layout.minMargins}"</li>
            <li>• Max columns: {preset.rules.layout.maxColumnsPerPage}</li>
            <li>• Grid alignment: {preset.rules.layout.enforceGridAlignment ? 'Required' : 'Optional'}</li>
          </ul>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h5 className="font-medium">Content</h5>
            <Badge 
              variant="outline" 
              className={getSeverityColor(preset.severity.content)}
            >
              {getSeverityIcon(preset.severity.content)}
              {preset.severity.content}
            </Badge>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6">
            <li>• Max orphans: {preset.rules.content.maxOrphans} lines</li>
            <li>• Max widows: {preset.rules.content.maxWidows} lines</li>
            <li>• Captions: {preset.rules.content.requireCaptions ? 'Required' : 'Optional'}</li>
          </ul>
        </div>
      </div>
    </div>
  )

  if (!showDetails) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Validation Preset</span>
        </div>
        <RadioGroup value={selectedPreset} onValueChange={onPresetChange}>
          {presets.map((preset) => (
            <div key={preset.id} className="flex items-center space-x-2">
              <RadioGroupItem value={preset.id} id={preset.id} />
              <Label htmlFor={preset.id} className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{preset.name}</span>
                    <p className="text-sm text-muted-foreground">{preset.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">
                      Strictness: {getStrictnessLevel(preset)}%
                    </div>
                    <Progress 
                      value={getStrictnessLevel(preset)} 
                      className="w-12 h-2"
                    />
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Validation Preset
        </h3>
        <p className="text-muted-foreground">
          Choose validation rules that will be applied to documents using this template
        </p>
      </div>

      <div className="grid gap-4">
        {presets.map((preset) => (
          <Card 
            key={preset.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedPreset === preset.id ? 'ring-2 ring-primary shadow-md' : ''
            }`}
            onClick={() => onPresetChange(preset.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <RadioGroup value={selectedPreset} onValueChange={onPresetChange}>
                    <RadioGroupItem value={preset.id} id={preset.id} />
                  </RadioGroup>
                  <div>
                    <CardTitle className="text-base">{preset.name}</CardTitle>
                    <CardDescription>{preset.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreviewPreset(previewPreset?.id === preset.id ? null : preset)
                    }}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground mb-1">Strictness</div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={getStrictnessLevel(preset)} 
                        className="w-16 h-2"
                      />
                      <span className="text-xs font-mono">
                        {getStrictnessLevel(preset)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {(selectedPreset === preset.id || previewPreset?.id === preset.id) && (
              <>
                <Separator />
                <CardContent className="pt-4">
                  <ValidationRulesSummary preset={preset} />
                </CardContent>
              </>
            )}
          </Card>
        ))}
      </div>

      {selectedPresetData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Active Validation Rules
            </CardTitle>
            <CardDescription>
              These rules will be enforced when this template is applied to documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="autofix">Auto-Fix Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="mt-4">
                <ValidationRulesSummary preset={selectedPresetData} />
              </TabsContent>
              <TabsContent value="autofix" className="mt-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    These categories will be automatically fixed when validation issues are detected:
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(selectedPresetData.autoFix).map(([category, enabled]) => (
                      <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="capitalize font-medium">{category}</span>
                        <Badge variant={enabled ? "default" : "secondary"}>
                          {enabled ? 'Auto-Fix' : 'Manual'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}