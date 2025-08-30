import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  Image, 
  Table, 
  MessageSquare, 
  List, 
  Settings 
} from 'lucide-react'

export interface ObjectStyleSelection {
  styles?: {
    'figure-default'?: FigureStyle
    'table-default'?: TableStyle
    'callout-default'?: CalloutStyle
    'toc-item-default'?: TOCItemStyle
  }
}

export interface FigureStyle {
  id?: string
  name?: string
  type?: 'figure'
  properties?: {
    captionStyle?: 'caption' | 'body' | 'small'
    spacingAbove?: number
    spacingBelow?: number
    width?: 'column' | 'full'
  }
}

export interface TableStyle {
  id?: string
  name?: string
  type?: 'table'
  properties?: {
    headerRow?: boolean
    cellPadding?: number
    grid?: 'border' | 'subtle' | 'none'
    headerStyle?: 'caption-bold' | 'body-bold' | 'small-bold'
    alternateRows?: boolean
    repeatHeader?: boolean
  }
}

export interface CalloutStyle {
  id?: string
  name?: string
  type?: 'callout'
  properties?: {
    accentWidth?: number
    keepTogether?: boolean
    variants?: {
      info?: { accentColor?: 'brand', backgroundColor?: 'bg-section' }
      tip?: { accentColor?: 'brand-secondary', backgroundColor?: 'bg-section' }  
      warning?: { accentColor?: 'brand-accent', backgroundColor?: 'bg-section' }
    }
  }
}

export interface TOCItemStyle {
  id?: string
  name?: string
  type?: 'toc-item'
  properties?: {
    leader?: 'dots' | 'dashes' | 'none'
    numbers?: 'right' | 'inline'
    textStyle?: 'body' | 'caption' | 'small'
    indentUnit?: number
  }
}

interface ObjectStyleSelectorProps {
  selection?: ObjectStyleSelection
  onSelectionChange: (selection: ObjectStyleSelection) => void
  className?: string
}

const DEFAULT_STYLES = {
  'figure-default': {
    id: 'figure-default',
    name: 'Figure',
    type: 'figure' as const,
    properties: {
      captionStyle: 'caption' as const,
      spacingAbove: 16,
      spacingBelow: 16,
      width: 'column' as const
    }
  },
  'table-default': {
    id: 'table-default',
    name: 'Table',
    type: 'table' as const,
    properties: {
      headerRow: true,
      cellPadding: 8,
      grid: 'subtle' as const,
      headerStyle: 'caption-bold' as const,
      alternateRows: true,
      repeatHeader: true
    }
  },
  'callout-default': {
    id: 'callout-default',  
    name: 'Callout',
    type: 'callout' as const,
    properties: {
      accentWidth: 4,
      keepTogether: true,
      variants: {
        info: { accentColor: 'brand' as const, backgroundColor: 'bg-section' as const },
        tip: { accentColor: 'brand-secondary' as const, backgroundColor: 'bg-section' as const },
        warning: { accentColor: 'brand-accent' as const, backgroundColor: 'bg-section' as const }
      }
    }
  },
  'toc-item-default': {
    id: 'toc-item-default',
    name: 'TOC Item', 
    type: 'toc-item' as const,
    properties: {
      leader: 'dots' as const,
      numbers: 'right' as const,
      textStyle: 'body' as const,
      indentUnit: 16
    }
  }
}

const ObjectStyleSelector = React.memo(function ObjectStyleSelector({ 
  selection = { styles: {} }, 
  onSelectionChange, 
  className 
}: ObjectStyleSelectorProps) {

  const updateStyle = <T extends keyof ObjectStyleSelection['styles']>(
    styleId: T, 
    updates: Partial<NonNullable<ObjectStyleSelection['styles']>[T]>
  ) => {
    const currentStyles = selection.styles || {}
    const currentStyle = currentStyles[styleId] || DEFAULT_STYLES[styleId]
    const updatedStyle = { ...currentStyle, ...updates }
    
    onSelectionChange({
      ...selection,
      styles: {
        ...currentStyles,
        [styleId]: updatedStyle
      }
    })
  }

  const getStyle = <T extends keyof ObjectStyleSelection['styles']>(styleId: T) => {
    return selection.styles?.[styleId] || DEFAULT_STYLES[styleId]
  }

  const figureStyle = getStyle('figure-default') as FigureStyle
  const tableStyle = getStyle('table-default') as TableStyle
  const calloutStyle = getStyle('callout-default') as CalloutStyle
  const tocStyle = getStyle('toc-item-default') as TOCItemStyle

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Object Styles
        </CardTitle>
        <CardDescription>
          Configure styling for document elements with explicit token bindings
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Figure Styles */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Image className="w-4 h-4" />
              Figure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Caption Style</Label>
                <Select 
                  value={figureStyle.properties?.captionStyle || 'caption'}
                  onValueChange={(value: 'caption' | 'body' | 'small') => 
                    updateStyle('figure-default', {
                      properties: { ...figureStyle.properties, captionStyle: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caption">Caption</SelectItem>
                    <SelectItem value="body">Body</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Width</Label>
                <Select 
                  value={figureStyle.properties?.width || 'column'}
                  onValueChange={(value: 'column' | 'full') => 
                    updateStyle('figure-default', {
                      properties: { ...figureStyle.properties, width: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="column">Column</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Spacing Above (pt)</Label>
                <Input 
                  type="number" 
                  value={figureStyle.properties?.spacingAbove || 16}
                  onChange={(e) => updateStyle('figure-default', {
                    properties: { 
                      ...figureStyle.properties, 
                      spacingAbove: parseInt(e.target.value) || 16 
                    }
                  })}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Spacing Below (pt)</Label>
                <Input 
                  type="number" 
                  value={figureStyle.properties?.spacingBelow || 16}
                  onChange={(e) => updateStyle('figure-default', {
                    properties: { 
                      ...figureStyle.properties, 
                      spacingBelow: parseInt(e.target.value) || 16 
                    }
                  })}
                />
              </div>
            </div>
            
            {/* Token Preview */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <Label className="text-xs font-medium text-muted-foreground">Token Output:</Label>
              <code className="text-xs block mt-1 font-mono">
                captionStyle: "{figureStyle.properties?.captionStyle || 'caption'}", spacingAbove: {figureStyle.properties?.spacingAbove || 16}, spacingBelow: {figureStyle.properties?.spacingBelow || 16}, width: "{figureStyle.properties?.width || 'column'}"
              </code>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Table Styles */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Table className="w-4 h-4" />
              Table
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Header Row</Label>
              <Switch 
                checked={tableStyle.properties?.headerRow || true}
                onCheckedChange={(checked) => updateStyle('table-default', {
                  properties: { ...tableStyle.properties, headerRow: checked }
                })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Cell Padding (px)</Label>
                <Input 
                  type="number" 
                  value={tableStyle.properties?.cellPadding || 8}
                  onChange={(e) => updateStyle('table-default', {
                    properties: { ...tableStyle.properties, cellPadding: parseInt(e.target.value) || 8 }
                  })}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Grid</Label>
                <Select 
                  value={tableStyle.properties?.grid || 'subtle'}
                  onValueChange={(value: 'border' | 'subtle' | 'none') => 
                    updateStyle('table-default', {
                      properties: { ...tableStyle.properties, grid: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="border">Border</SelectItem>
                    <SelectItem value="subtle">Subtle</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Header Style</Label>
              <Select 
                value={tableStyle.properties?.headerStyle || 'caption-bold'}
                onValueChange={(value: 'caption-bold' | 'body-bold' | 'small-bold') => 
                  updateStyle('table-default', {
                    properties: { ...tableStyle.properties, headerStyle: value }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="caption-bold">Caption (Bold)</SelectItem>
                  <SelectItem value="body-bold">Body (Bold)</SelectItem>
                  <SelectItem value="small-bold">Small (Bold)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Alternate Rows</Label>
              <Switch 
                checked={tableStyle.properties?.alternateRows || true}
                onCheckedChange={(checked) => updateStyle('table-default', {
                  properties: { ...tableStyle.properties, alternateRows: checked }
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Repeat Header</Label>
              <Switch 
                checked={tableStyle.properties?.repeatHeader || true}
                onCheckedChange={(checked) => updateStyle('table-default', {
                  properties: { ...tableStyle.properties, repeatHeader: checked }
                })}
              />
            </div>
            
            {/* Token Preview */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <Label className="text-xs font-medium text-muted-foreground">Token Output:</Label>
              <code className="text-xs block mt-1 font-mono">
                headerRow: {(tableStyle.properties?.headerRow || true).toString()}, cellPadding: {tableStyle.properties?.cellPadding || 8}, grid: "border/{tableStyle.properties?.grid || 'subtle'}", headerStyle: "{tableStyle.properties?.headerStyle || 'caption-bold'}"
              </code>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Callout Styles */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="w-4 h-4" />
              Callout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Accent Width (px)</Label>
                <Input 
                  type="number" 
                  value={calloutStyle.properties?.accentWidth || 4}
                  onChange={(e) => updateStyle('callout-default', {
                    properties: { ...calloutStyle.properties, accentWidth: parseInt(e.target.value) || 4 }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Keep Together</Label>
                <Switch 
                  checked={calloutStyle.properties?.keepTogether || true}
                  onCheckedChange={(checked) => updateStyle('callout-default', {
                    properties: { ...calloutStyle.properties, keepTogether: checked }
                  })}
                />
              </div>
            </div>
            
            {/* Variant previews with color tokens */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Variants & Color Tokens</Label>
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-primary rounded-full" />
                    <div>
                      <div className="font-medium text-sm">Info</div>
                      <div className="text-xs text-muted-foreground">General information</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">brand</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-secondary rounded-full" />
                    <div>
                      <div className="font-medium text-sm">Tip</div>
                      <div className="text-xs text-muted-foreground">Helpful suggestion</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">brand-secondary</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-accent rounded-full" />
                    <div>
                      <div className="font-medium text-sm">Warning</div>
                      <div className="text-xs text-muted-foreground">Important notice</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">brand-accent</Badge>
                </div>
              </div>
            </div>
            
            {/* Token Preview */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <Label className="text-xs font-medium text-muted-foreground">Token Output:</Label>
              <code className="text-xs block mt-1 font-mono">
                accentWidth: {calloutStyle.properties?.accentWidth || 4}, variants: info→brand, tip→brand-secondary, warning→brand-accent
              </code>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* TOC Item Styles */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <List className="w-4 h-4" />
              TOC Item
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Leader</Label>
                <Select 
                  value={tocStyle.properties?.leader || 'dots'}
                  onValueChange={(value: 'dots' | 'dashes' | 'none') => 
                    updateStyle('toc-item-default', {
                      properties: { ...tocStyle.properties, leader: value }
                    })
                  }
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
              <div>
                <Label className="text-sm font-medium">Numbers</Label>
                <Select 
                  value={tocStyle.properties?.numbers || 'right'}
                  onValueChange={(value: 'right' | 'inline') => 
                    updateStyle('toc-item-default', {
                      properties: { ...tocStyle.properties, numbers: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="right">Right</SelectItem>
                    <SelectItem value="inline">Inline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Text Style</Label>
                <Select 
                  value={tocStyle.properties?.textStyle || 'body'}
                  onValueChange={(value: 'body' | 'caption' | 'small') => 
                    updateStyle('toc-item-default', {
                      properties: { ...tocStyle.properties, textStyle: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="body">Body</SelectItem>
                    <SelectItem value="caption">Caption</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Indent Unit (px)</Label>
                <Input 
                  type="number" 
                  value={tocStyle.properties?.indentUnit || 16}
                  onChange={(e) => updateStyle('toc-item-default', {
                    properties: { ...tocStyle.properties, indentUnit: parseInt(e.target.value) || 16 }
                  })}
                />
              </div>
            </div>
            
            {/* Preview */}
            <div className="p-3 border rounded-lg bg-background">
              <Label className="text-xs font-medium text-muted-foreground mb-2 block">Preview:</Label>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>1. Introduction</span>
                  {(tocStyle.properties?.leader || 'dots') === 'dots' && <span className="flex-1 mx-2 border-b border-dotted"></span>}
                  {(tocStyle.properties?.leader || 'dots') === 'dashes' && <span className="flex-1 mx-2 border-b border-dashed"></span>}
                  {(tocStyle.properties?.numbers || 'right') === 'right' && <span>1</span>}
                  {(tocStyle.properties?.numbers || 'right') === 'inline' && <span></span>}
                </div>
                <div className="flex justify-between pl-4">
                  <span>1.1 Overview</span>
                  {(tocStyle.properties?.leader || 'dots') === 'dots' && <span className="flex-1 mx-2 border-b border-dotted"></span>}
                  {(tocStyle.properties?.leader || 'dots') === 'dashes' && <span className="flex-1 mx-2 border-b border-dashed"></span>}
                  {(tocStyle.properties?.numbers || 'right') === 'right' && <span>2</span>}
                </div>
              </div>
            </div>
            
            {/* Token Preview */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <Label className="text-xs font-medium text-muted-foreground">Token Output:</Label>
              <code className="text-xs block mt-1 font-mono">
                leader: "{tocStyle.properties?.leader || 'dots'}", numbers: "{tocStyle.properties?.numbers || 'right'}", textStyle: "{tocStyle.properties?.textStyle || 'body'}"
              </code>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
})

export { ObjectStyleSelector }