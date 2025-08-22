import { PageMaster, LayoutIntent } from '@/lib/document-model'
import { detectLayoutIntent } from '@/lib/layout-presets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface PageMasterSettingsProps {
  pageMaster: PageMaster
  layoutIntent?: LayoutIntent
  onUpdate: (pageMaster: PageMaster) => void
}

const PAGE_SIZES = {
  Letter: { 
    width: { portrait: 8.5, landscape: 11 }, 
    height: { portrait: 11, landscape: 8.5 }, 
    label: 'Letter (8.5" × 11")' 
  },
  A4: { 
    width: { portrait: 8.27, landscape: 11.69 }, 
    height: { portrait: 11.69, landscape: 8.27 }, 
    label: 'A4 (210 × 297 mm)' 
  },
  Legal: { 
    width: { portrait: 8.5, landscape: 14 }, 
    height: { portrait: 14, landscape: 8.5 }, 
    label: 'Legal (8.5" × 14")' 
  },
  Tabloid: { 
    width: { portrait: 11, landscape: 17 }, 
    height: { portrait: 17, landscape: 11 }, 
    label: 'Tabloid (11" × 17")' 
  }
}

export const PageMasterSettings = ({ pageMaster, layoutIntent, onUpdate }: PageMasterSettingsProps) => {
  const updatePageMaster = (updates: Partial<PageMaster>) => {
    onUpdate({ ...pageMaster, ...updates })
  }

  const updateMargins = (side: keyof PageMaster['margins'], value: number) => {
    updatePageMaster({
      margins: {
        ...pageMaster.margins,
        [side]: value
      }
    })
  }

  const currentIntent = layoutIntent || detectLayoutIntent(pageMaster)
  const isDataAppendix = currentIntent === 'data-appendix'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge variant="outline">Page Master</Badge>
          Settings
          {currentIntent !== 'custom' && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {currentIntent.charAt(0).toUpperCase() + currentIntent.slice(1).replace('-', ' ')}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Page Size & Orientation */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Page Size</Label>
            <Select value={pageMaster.pageSize} onValueChange={(value: PageMaster['pageSize']) => updatePageMaster({ pageSize: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAGE_SIZES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Orientation</Label>
            <Select 
              value={pageMaster.orientation || 'portrait'} 
              onValueChange={(value: 'portrait' | 'landscape') => updatePageMaster({ orientation: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
              </SelectContent>
            </Select>
            {isDataAppendix && (
              <p className="text-xs text-muted-foreground">
                Landscape orientation optimizes space for tables and wide content
              </p>
            )}
          </div>
        </div>

        {/* Margins */}
        <div className="space-y-3">
          <Label>Margins (inches)</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Top</Label>
              <Input
                type="number"
                step="0.125"
                min="0"
                max="4"
                value={pageMaster.margins.top}
                onChange={(e) => updateMargins('top', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Right</Label>
              <Input
                type="number"
                step="0.125"
                min="0"
                max="4"
                value={pageMaster.margins.right}
                onChange={(e) => updateMargins('right', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Bottom</Label>
              <Input
                type="number"
                step="0.125"
                min="0"
                max="4"
                value={pageMaster.margins.bottom}
                onChange={(e) => updateMargins('bottom', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Left</Label>
              <Input
                type="number"
                step="0.125"
                min="0"
                max="4"
                value={pageMaster.margins.left}
                onChange={(e) => updateMargins('left', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Table Rotation (Data Appendix) */}
        {(isDataAppendix || pageMaster.allowTableRotation) && (
          <>
            <div className="space-y-3">
              <Label>Data Visualization</Label>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Allow Table Rotation</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable 90° rotation for wide tables that don't fit in columns
                  </p>
                </div>
                <Switch 
                  checked={pageMaster.allowTableRotation || false}
                  onCheckedChange={(checked) => updatePageMaster({ allowTableRotation: checked })}
                />
              </div>
              {pageMaster.allowTableRotation && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-xs text-primary font-medium">
                    ✓ Tables wider than column width will automatically rotate for optimal display
                  </p>
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Layout */}
        <div className="space-y-4">
          <Label>Layout</Label>
          
          <div className="flex items-center gap-4">
            <Label className="text-sm">Columns</Label>
            <Select value={pageMaster.columns.toString()} onValueChange={(value) => updatePageMaster({ columns: parseInt(value) as 1 | 2 | 3 })}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {pageMaster.columns > 1 && (
            <div className="flex items-center gap-4">
              <Label className="text-sm">Column Gap</Label>
              <Input
                type="number"
                step="0.125"
                min="0"
                max="2"
                value={pageMaster.columnGap}
                onChange={(e) => updatePageMaster({ columnGap: parseFloat(e.target.value) || 0 })}
                className="w-24"
              />
              <span className="text-xs text-muted-foreground">inches</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Header/Footer */}
        <div className="space-y-3">
          <Label>Header & Footer</Label>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Include Header</Label>
            <Switch 
              checked={pageMaster.hasHeader}
              onCheckedChange={(checked) => updatePageMaster({ hasHeader: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Include Footer</Label>
            <Switch 
              checked={pageMaster.hasFooter}
              onCheckedChange={(checked) => updatePageMaster({ hasFooter: checked })}
            />
          </div>
        </div>

        <Separator />

        {/* Baseline Grid */}
        <div className="space-y-3">
          <Label>Baseline Grid</Label>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Show Baseline Grid</Label>
            <Switch 
              checked={pageMaster.baselineGrid}
              onCheckedChange={(checked) => updatePageMaster({ baselineGrid: checked })}
            />
          </div>
          {pageMaster.baselineGrid && (
            <div className="flex items-center gap-4">
              <Label className="text-sm">Grid Spacing</Label>
              <Input
                type="number"
                step="0.125"
                min="0.125"
                max="1"
                value={pageMaster.gridSpacing}
                onChange={(e) => updatePageMaster({ gridSpacing: parseFloat(e.target.value) || 0.125 })}
                className="w-24"
              />
              <span className="text-xs text-muted-foreground">inches</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}