import { useState } from 'react'
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Settings, 
  Plus,
  BarChart3,
  Quote,
  ArrowRight
} from 'lucide-react'
import { DEFAULT_OBJECT_STYLES, DEFAULT_SNIPPETS, type ObjectStyle, type Snippet } from '@/lib/object-styles'

export interface ObjectStyleSelection {
  styles?: Record<string, ObjectStyle>
  snippets?: string[]
}

interface ObjectStyleSelectorProps {
  selection?: ObjectStyleSelection
  onSelectionChange: (selection: ObjectStyleSelection) => void
  className?: string
}

const ObjectStyleSelector = React.memo(function ObjectStyleSelector({ 
  selection = { styles: {}, snippets: [] }, 
  onSelectionChange, 
  className 
}: ObjectStyleSelectorProps) {
  const [activeTab, setActiveTab] = useState('styles')

  const updateStyle = (styleId: string, updates: Partial<ObjectStyle>) => {
    const currentStyles = selection.styles || {}
    const currentStyle = currentStyles[styleId] || DEFAULT_OBJECT_STYLES.find(s => s.id === styleId)!
    const updatedStyle = { ...currentStyle, ...updates }
    
    onSelectionChange({
      ...selection,
      styles: {
        ...currentStyles,
        [styleId]: updatedStyle
      }
    })
  }

  const toggleSnippet = (snippetId: string) => {
    const currentSnippets = selection.snippets || []
    const newSnippets = currentSnippets.includes(snippetId)
      ? currentSnippets.filter(id => id !== snippetId)
      : [...currentSnippets, snippetId]
    
    onSelectionChange({
      ...selection,
      snippets: newSnippets
    })
  }

  const getStyleIcon = (type: string) => {
    switch (type) {
      case 'figure': return <Image className="w-4 h-4" />
      case 'table': return <Table className="w-4 h-4" />
      case 'callout': return <MessageSquare className="w-4 h-4" />
      case 'toc-item': return <List className="w-4 h-4" />
      default: return <Settings className="w-4 h-4" />
    }
  }

  const getSnippetIcon = (category: string) => {
    switch (category) {
      case 'metrics': return <BarChart3 className="w-4 h-4" />
      case 'content': return <Quote className="w-4 h-4" />
      case 'navigation': return <ArrowRight className="w-4 h-4" />
      default: return <Plus className="w-4 h-4" />
    }
  }

  const renderStyleEditor = (style: ObjectStyle) => {
    const currentStyles = selection.styles || {}
    const currentStyle = currentStyles[style.id] || style

    return (
      <Card key={style.id} className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getStyleIcon(style.type)}
            {style.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {style.type === 'figure' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Caption Style</Label>
                  <Select 
                    value={currentStyle.properties.captionStyle}
                    onValueChange={(value) => updateStyle(style.id, {
                      properties: { ...currentStyle.properties, captionStyle: value }
                    })}
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
                  <Label className="text-sm">Default Width</Label>
                  <Select 
                    value={currentStyle.properties.defaultWidth}
                    onValueChange={(value) => updateStyle(style.id, {
                      properties: { ...currentStyle.properties, defaultWidth: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="column">Column Width</SelectItem>
                      <SelectItem value="full">Full Width</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Top Spacing (pt)</Label>
                  <Input 
                    type="number" 
                    value={currentStyle.properties.spacing.top}
                    onChange={(e) => updateStyle(style.id, {
                      properties: { 
                        ...currentStyle.properties, 
                        spacing: { ...currentStyle.properties.spacing, top: parseInt(e.target.value) || 16 }
                      }
                    })}
                  />
                </div>
                <div>
                  <Label className="text-sm">Bottom Spacing (pt)</Label>
                  <Input 
                    type="number" 
                    value={currentStyle.properties.spacing.bottom}
                    onChange={(e) => updateStyle(style.id, {
                      properties: { 
                        ...currentStyle.properties, 
                        spacing: { ...currentStyle.properties.spacing, bottom: parseInt(e.target.value) || 16 }
                      }
                    })}
                  />
                </div>
              </div>
            </>
          )}

          {style.type === 'table' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Header Style</Label>
                  <Select 
                    value={currentStyle.properties.headerStyle}
                    onValueChange={(value) => updateStyle(style.id, {
                      properties: { ...currentStyle.properties, headerStyle: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="caption-bold">Caption Bold</SelectItem>
                      <SelectItem value="body-bold">Body Bold</SelectItem>
                      <SelectItem value="small-bold">Small Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Cell Padding (px)</Label>
                  <Input 
                    type="number" 
                    value={currentStyle.properties.cellPadding}
                    onChange={(e) => updateStyle(style.id, {
                      properties: { ...currentStyle.properties, cellPadding: parseInt(e.target.value) || 8 }
                    })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Repeat Header on Breaks</Label>
                <Switch 
                  checked={currentStyle.properties.repeatHeader}
                  onCheckedChange={(checked) => updateStyle(style.id, {
                    properties: { ...currentStyle.properties, repeatHeader: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Alternate Row Colors</Label>
                <Switch 
                  checked={currentStyle.properties.alternateRows}
                  onCheckedChange={(checked) => updateStyle(style.id, {
                    properties: { ...currentStyle.properties, alternateRows: checked }
                  })}
                />
              </div>
            </>
          )}

          {style.type === 'callout' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Accent Width (px)</Label>
                  <Input 
                    type="number" 
                    value={currentStyle.properties.accentWidth}
                    onChange={(e) => updateStyle(style.id, {
                      properties: { ...currentStyle.properties, accentWidth: parseInt(e.target.value) || 4 }
                    })}
                  />
                </div>
                <div>
                  <Label className="text-sm">Border Radius (px)</Label>
                  <Input 
                    type="number" 
                    value={currentStyle.properties.borderRadius}
                    onChange={(e) => updateStyle(style.id, {
                      properties: { ...currentStyle.properties, borderRadius: parseInt(e.target.value) || 8 }
                    })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Keep Together on Pagination</Label>
                <Switch 
                  checked={currentStyle.properties.keepTogether}
                  onCheckedChange={(checked) => updateStyle(style.id, {
                    properties: { ...currentStyle.properties, keepTogether: checked }
                  })}
                />
              </div>
              
              {/* Variant previews */}
              <div className="space-y-2">
                <Label className="text-sm">Variants Preview</Label>
                <div className="grid gap-2">
                  {Object.entries(currentStyle.variants || {}).map(([variant, props]: [string, any]) => (
                    <div key={variant} className="flex items-center gap-2 p-2 border rounded text-xs">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: `hsl(var(--${props.accentColor}))` }}
                      />
                      <span className="capitalize font-medium">{variant}</span>
                      <Badge variant="outline" className="ml-auto text-xs">{props.accentColor}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {style.type === 'toc-item' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Text Style</Label>
                  <Select 
                    value={currentStyle.properties.textStyle}
                    onValueChange={(value) => updateStyle(style.id, {
                      properties: { ...currentStyle.properties, textStyle: value }
                    })}
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
                  <Label className="text-sm">Indent Unit (px)</Label>
                  <Input 
                    type="number" 
                    value={currentStyle.properties.indentUnit}
                    onChange={(e) => updateStyle(style.id, {
                      properties: { ...currentStyle.properties, indentUnit: parseInt(e.target.value) || 16 }
                    })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Dot Leader</Label>
                <Switch 
                  checked={currentStyle.properties.dotLeader}
                  onCheckedChange={(checked) => updateStyle(style.id, {
                    properties: { ...currentStyle.properties, dotLeader: checked }
                  })}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderSnippetCard = (snippet: Snippet) => {
    const currentSnippets = selection.snippets || []
    const isSelected = currentSnippets.includes(snippet.id)

    return (
      <div
        key={snippet.id}
        className={`border rounded-lg p-3 cursor-pointer transition-all hover:border-primary/50 ${
          isSelected ? 'border-primary bg-primary/5' : 'border-border'
        }`}
        onClick={() => toggleSnippet(snippet.id)}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-md ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            {getSnippetIcon(snippet.category)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{snippet.name}</h4>
              <Badge variant="outline" className="text-xs capitalize">
                {snippet.category}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{snippet.description}</p>
            <div className="text-xs font-mono bg-muted/50 rounded px-2 py-1 mt-2">
              {snippet.preview}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Object Styles & Snippets
        </CardTitle>
        <CardDescription>
          Configure styling for document elements and add reusable content snippets
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="styles">Object Styles</TabsTrigger>
            <TabsTrigger value="snippets">Snippets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="styles" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground">
              Customize how different document elements appear and behave.
            </div>
            {DEFAULT_OBJECT_STYLES.map(renderStyleEditor)}
          </TabsContent>
          
          <TabsContent value="snippets" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground">
              Select content snippets to include in your template.
            </div>
            
            <div className="space-y-3">
              {['metrics', 'content', 'navigation'].map(category => {
                const categorySnippets = DEFAULT_SNIPPETS.filter(s => s.category === category)
                
                return (
                  <div key={category}>
                    <h4 className="font-medium text-sm mb-2 capitalize">{category}</h4>
                    <div className="space-y-2">
                      {categorySnippets.map(renderSnippetCard)}
                    </div>
                  </div>
                )
              })}
            </div>
            
            <Separator />
            
            <div className="text-xs text-muted-foreground">
              Selected: {selection.snippets?.length || 0} snippet{(selection.snippets?.length || 0) !== 1 ? 's' : ''}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
})

export { ObjectStyleSelector }

