import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useValidation } from '@/contexts/ValidationContext'
import { ValidationConfig, defaultValidationConfig } from '@/lib/validation-engine'

interface ValidationSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export const ValidationSettings = ({ isOpen, onClose }: ValidationSettingsProps) => {
  const { config, updateConfig } = useValidation()
  const [localConfig, setLocalConfig] = useState<ValidationConfig>(config)

  const handleSave = () => {
    updateConfig(localConfig)
    onClose()
  }

  const handleReset = () => {
    setLocalConfig(defaultValidationConfig)
    updateConfig(defaultValidationConfig)
  }

  const updateRule = (ruleId: string, enabled: boolean, severity?: string) => {
    setLocalConfig(prev => ({
      ...prev,
      rules: {
        ...prev.rules,
        [ruleId]: {
          ...prev.rules[ruleId],
          enabled,
          ...(severity && { severity: severity as any })
        }
      }
    }))
  }

  const updateThreshold = (key: keyof ValidationConfig['thresholds'], value: number) => {
    setLocalConfig(prev => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [key]: value
      }
    }))
  }

  const ruleDescriptions = {
    'stranded-heading': 'Detect headings that appear isolated at the end of pages or columns',
    'figure-without-caption': 'Flag figures that are missing descriptive captions',
    'table-without-header': 'Identify tables without proper header rows',
    'missing-alt-text': 'Find images and charts missing accessibility alt text',
    'long-heading': 'Alert when headings exceed the recommended character limit',
    'orphaned-callout': 'Detect callouts with insufficient surrounding content',
    'low-contrast': 'Check text color contrast against WCAG guidelines',
    'excessive-hyphenation': 'Flag paragraphs with too much hyphenation',
    'broken-cross-reference': 'Find links pointing to non-existent targets',
    'overflowing-text': 'Detect text that extends beyond its container'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Validation Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* General Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">General</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto-run on changes</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically validate document when changes are made
                </p>
              </div>
              <Switch
                checked={localConfig.autoRunOnChanges}
                onCheckedChange={(checked) => 
                  setLocalConfig(prev => ({ ...prev, autoRunOnChanges: checked }))
                }
              />
            </div>
          </div>

          <Separator />

          {/* Thresholds */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Thresholds</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="long-heading">Long heading (characters)</Label>
                <Input
                  id="long-heading"
                  type="number"
                  value={localConfig.thresholds.longHeadingLength}
                  onChange={(e) => updateThreshold('longHeadingLength', parseInt(e.target.value) || 85)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hyphenation">Hyphenation limit (per 5 lines)</Label>
                <Input
                  id="hyphenation"
                  type="number"
                  value={localConfig.thresholds.hyphenationLimit}
                  onChange={(e) => updateThreshold('hyphenationLimit', parseInt(e.target.value) || 2)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contrast">Contrast ratio</Label>
                <Input
                  id="contrast"
                  type="number"
                  step="0.1"
                  value={localConfig.thresholds.contrastRatio}
                  onChange={(e) => updateThreshold('contrastRatio', parseFloat(e.target.value) || 4.5)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="orphan-lines">Orphaned callout (lines)</Label>
                <Input
                  id="orphan-lines"
                  type="number"
                  value={localConfig.thresholds.orphanedCalloutLines}
                  onChange={(e) => updateThreshold('orphanedCalloutLines', parseInt(e.target.value) || 2)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Rules */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Validation Rules</h3>
            
            <div className="space-y-4">
              {Object.entries(localConfig.rules).map(([ruleId, ruleConfig]) => (
                <div key={ruleId} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="font-medium">
                        {ruleId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      <Badge variant={ruleConfig.severity === 'error' ? 'destructive' : 
                                   ruleConfig.severity === 'warning' ? 'secondary' : 'outline'}>
                        {ruleConfig.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {ruleDescriptions[ruleId as keyof typeof ruleDescriptions]}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Select
                      value={ruleConfig.severity}
                      onValueChange={(value) => updateRule(ruleId, ruleConfig.enabled, value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Switch
                      checked={ruleConfig.enabled}
                      onCheckedChange={(checked) => updateRule(ruleId, checked)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              Restore Defaults
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}