import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BookOpen, List, Settings2 } from 'lucide-react'
import { AutoTOCConfig, defaultAutoTOCConfig } from '@/lib/auto-toc-inserter'

interface AutoTOCSettingsProps {
  config: AutoTOCConfig
  onConfigChange: (config: AutoTOCConfig) => void
  className?: string
}

export const AutoTOCSettings = ({ 
  config, 
  onConfigChange, 
  className = '' 
}: AutoTOCSettingsProps) => {
  const updateConfig = (updates: Partial<AutoTOCConfig>) => {
    onConfigChange({ ...config, ...updates })
  }

  const headingLevels = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6']

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="w-4 h-4" />
          Auto-TOC Configuration
        </CardTitle>
        <CardDescription>
          Configure automatic table of contents insertion and appearance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Auto-TOC */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Enable Auto-TOC</Label>
            <p className="text-xs text-muted-foreground">
              Automatically insert table of contents after cover page
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(enabled) => updateConfig({ enabled })}
          />
        </div>

        {config.enabled && (
          <>
            <Separator />
            
            {/* Insertion Point */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Insertion Point</Label>
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="insertion"
                    checked={config.insertAfterCover}
                    onChange={() => updateConfig({ 
                      insertAfterCover: true, 
                      insertAfterTitle: false 
                    })}
                    className="w-3 h-3"
                  />
                  <span className="text-xs">After Cover Page (Recommended)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="insertion"
                    checked={config.insertAfterTitle}
                    onChange={() => updateConfig({ 
                      insertAfterCover: false, 
                      insertAfterTitle: true 
                    })}
                    className="w-3 h-3"
                  />
                  <span className="text-xs">After Main Title</span>
                </label>
              </div>
            </div>

            {/* Depth & Scope */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Depth & Scope</Label>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Include Heading Levels:</Label>
                <div className="grid grid-cols-3 gap-2">
                  {headingLevels.map((level, index) => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={config.includeLevels[index]}
                        onCheckedChange={(checked) => {
                          const newIncludeLevels = [...config.includeLevels]
                          newIncludeLevels[index] = Boolean(checked)
                          updateConfig({ includeLevels: newIncludeLevels })
                        }}
                        className="w-3 h-3"
                      />
                      <span className="text-xs">{level}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Layout */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Layout</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Columns</Label>
                  <Select
                    value={config.columns.toString()}
                    onValueChange={(value) => 
                      updateConfig({ columns: parseInt(value) as 1 | 2 })
                    }
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Column</SelectItem>
                      <SelectItem value="2">2 Columns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Leader Style</Label>
                  <Select
                    value={config.leader}
                    onValueChange={(value) => 
                      updateConfig({ leader: value as 'dots' | 'dashes' | 'none' })
                    }
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dots">Dots (...)</SelectItem>
                      <SelectItem value="dashes">Dashes (---)</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Page Numbers */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Page Numbers</Label>
              
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-muted-foreground">Show Page Numbers</Label>
                <Switch
                  checked={config.showPageNumbers}
                  onCheckedChange={(showPageNumbers) => 
                    updateConfig({ showPageNumbers })
                  }
                />
              </div>

              {config.showPageNumbers && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Alignment</Label>
                  <Select
                    value={config.pageNumberAlignment}
                    onValueChange={(value) => 
                      updateConfig({ 
                        pageNumberAlignment: value as 'right' | 'inline' 
                      })
                    }
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="right">Right-aligned</SelectItem>
                      <SelectItem value="inline">Inline (text p. 123)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default AutoTOCSettings