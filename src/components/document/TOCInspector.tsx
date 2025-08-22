import { Block, Section } from '@/lib/document-model'
import { TOCConfiguration, defaultTOCConfig } from '@/lib/toc-generator'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { RefreshCw, Settings } from 'lucide-react'

interface TOCInspectorProps {
  block: Block
  sections: Section[]
  currentSectionId?: string
  onUpdate: (content: TOCConfiguration) => void
  onRefresh?: () => void
}

export const TOCInspector = ({ 
  block, 
  sections, 
  currentSectionId, 
  onUpdate, 
  onRefresh 
}: TOCInspectorProps) => {
  const config: TOCConfiguration = {
    ...defaultTOCConfig,
    ...block.content
  }

  const updateConfig = (updates: Partial<TOCConfiguration>) => {
    const newConfig = { ...config, ...updates }
    onUpdate(newConfig)
  }

  const headingLevels = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4" />
        <h3 className="font-medium">Table of Contents</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="ml-auto h-7 px-2"
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="toc-title">Title</Label>
        <Input
          id="toc-title"
          value={config.title}
          onChange={(e) => updateConfig({ title: e.target.value })}
          placeholder="Table of Contents"
        />
      </div>

      <Separator />

      {/* Scope & Depth */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Scope & Depth</h4>
        
        {/* Include heading levels */}
        <div className="space-y-2">
          <Label className="text-xs">Include heading levels</Label>
          <div className="grid grid-cols-3 gap-2">
            {headingLevels.map((level, index) => (
              <div key={level} className="flex items-center space-x-2">
                <Checkbox
                  id={`level-${index}`}
                  checked={config.includeLevels[index]}
                  onCheckedChange={(checked) => {
                    const newLevels = [...config.includeLevels]
                    newLevels[index] = !!checked
                    updateConfig({ includeLevels: newLevels })
                  }}
                />
                <Label htmlFor={`level-${index}`} className="text-xs">
                  {level}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Exclude sections */}
        <div className="space-y-2">
          <Label className="text-xs">Exclude sections</Label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {sections.map((section) => (
              <div key={section.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`section-${section.id}`}
                  checked={config.excludeSections.includes(section.id) || section.id === currentSectionId}
                  disabled={section.id === currentSectionId}
                  onCheckedChange={(checked) => {
                    const newExcluded = checked
                      ? [...config.excludeSections, section.id]
                      : config.excludeSections.filter(id => id !== section.id)
                    updateConfig({ excludeSections: newExcluded })
                  }}
                />
                <Label htmlFor={`section-${section.id}`} className="text-xs truncate">
                  {section.name}
                  {section.id === currentSectionId && (
                    <span className="text-muted-foreground ml-1">(current)</span>
                  )}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* Appearance */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Appearance</h4>
        
        {/* Layout columns */}
        <div className="space-y-2">
          <Label className="text-xs">Layout</Label>
          <Select
            value={config.columns.toString()}
            onValueChange={(value) => updateConfig({ columns: parseInt(value) as 1 | 2 })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Column</SelectItem>
              <SelectItem value="2">2 Columns</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Column gap */}
        {config.columns === 2 && (
          <div className="space-y-2">
            <Label className="text-xs">Column gap: {config.columnGap}"</Label>
            <Slider
              value={[config.columnGap]}
              onValueChange={([value]) => updateConfig({ columnGap: value })}
              min={0.25}
              max={1}
              step={0.25}
              className="w-full"
            />
          </div>
        )}

        {/* Indentation per level */}
        <div className="space-y-2">
          <Label className="text-xs">Indentation per level: {config.indentPerLevel}"</Label>
          <Slider
            value={[config.indentPerLevel]}
            onValueChange={([value]) => updateConfig({ indentPerLevel: value })}
            min={0}
            max={0.5}
            step={0.125}
            className="w-full"
          />
        </div>

        {/* Item spacing */}
        <div className="space-y-2">
          <Label className="text-xs">Item spacing: {config.itemSpacing}"</Label>
          <Slider
            value={[config.itemSpacing]}
            onValueChange={([value]) => updateConfig({ itemSpacing: value })}
            min={0}
            max={0.5}
            step={0.125}
            className="w-full"
          />
        </div>
      </div>

      <Separator />

      {/* Page Numbers */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Page Numbers</h4>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="show-page-numbers" className="text-xs">Show page numbers</Label>
          <Switch
            id="show-page-numbers"
            checked={config.showPageNumbers}
            onCheckedChange={(checked) => updateConfig({ showPageNumbers: checked })}
          />
        </div>

        {config.showPageNumbers && (
          <>
            <div className="space-y-2">
              <Label className="text-xs">Alignment</Label>
              <Select
                value={config.pageNumberAlignment}
                onValueChange={(value: 'right' | 'inline') => updateConfig({ pageNumberAlignment: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="right">Right aligned</SelectItem>
                  <SelectItem value="inline">Inline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.pageNumberAlignment === 'right' && (
              <div className="space-y-2">
                <Label className="text-xs">Leader</Label>
                <Select
                  value={config.leader}
                  onValueChange={(value: 'dots' | 'dashes' | 'none') => updateConfig({ leader: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dots">Dots</SelectItem>
                    <SelectItem value="dashes">Dashes</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}
      </div>

      <Separator />

      {/* Link Style */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Link Style</h4>
        
        <div className="space-y-2">
          <Label className="text-xs">Underline</Label>
          <Select
            value={config.linkStyle}
            onValueChange={(value: 'hover' | 'always' | 'none') => updateConfig({ linkStyle: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hover">On hover</SelectItem>
              <SelectItem value="always">Always</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Behavior */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Behavior</h4>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-update" className="text-xs">Auto-update</Label>
          <Switch
            id="auto-update"
            checked={config.autoUpdate}
            onCheckedChange={(checked) => updateConfig({ autoUpdate: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="allow-page-breaks" className="text-xs">Allow page breaks</Label>
          <Switch
            id="allow-page-breaks"
            checked={config.allowPageBreaks}
            onCheckedChange={(checked) => updateConfig({ allowPageBreaks: checked })}
          />
        </div>

        {config.allowPageBreaks && (
          <div className="flex items-center justify-between">
            <Label htmlFor="show-continued" className="text-xs">Show "continued" label</Label>
            <Switch
              id="show-continued"
              checked={config.showContinued}
              onCheckedChange={(checked) => updateConfig({ showContinued: checked })}
            />
          </div>
        )}
      </div>
    </div>
  )
}