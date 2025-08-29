import { useState, useCallback } from 'react'
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Columns, 
  Columns2, 
  Palette, 
  GripVertical,
  Plus,
  Database
} from 'lucide-react'
import { PAGE_MASTER_PRESETS, type PageMasterPreset } from '@/lib/page-masters'
import { DragDropProvider, useDragDropContext } from '@/contexts/DragDropContext'

export interface PageMasterSelection {
  cover?: string | null
  selected?: { id: string; order: number }[]
}

interface PageMasterSelectorProps {
  selection?: PageMasterSelection
  onSelectionChange: (selection: PageMasterSelection) => void
  className?: string
  usageType?: string
}

const PageMasterSelector = React.memo(function PageMasterSelector({ 
  selection = { cover: null, selected: [] }, 
  onSelectionChange, 
  className,
  usageType
}: PageMasterSelectorProps) {
  const [pageSize, setPageSize] = useState<'Letter' | 'A4'>('Letter')

  const coverPresets = PAGE_MASTER_PRESETS.filter(p => p.layoutType === 'cover-fullbleed' && p.pageSize === pageSize)
  
  // Available layout options for multi-select
  const availableLayouts = [
    {
      id: 'body-1col',
      name: 'Body — 1-column',
      description: 'Single column body layout',
      presets: PAGE_MASTER_PRESETS.filter(p => p.layoutType === 'body-1col' && p.pageSize === pageSize)
    },
    {
      id: 'body-2col',
      name: 'Body — 2-column',
      description: 'Two column body layout',
      presets: PAGE_MASTER_PRESETS.filter(p => p.layoutType === 'body-2col' && p.pageSize === pageSize)
    },
    {
      id: 'body-2col-sidebar',
      name: 'Body — 2-column + Sidebar',
      description: 'Two column body layout with sidebar',
      presets: PAGE_MASTER_PRESETS.filter(p => p.layoutType === 'body-2col-sidebar' && p.pageSize === pageSize)
    },
    {
      id: 'data-portrait',
      name: 'Data (portrait)',
      description: 'Portrait data layout for tables and charts',
      presets: PAGE_MASTER_PRESETS.filter(p => p.layoutType === 'data-portrait' && p.pageSize === pageSize)
    }
  ]

  const updateSelection = useCallback((type: 'cover', presetId: string) => {
    const newSelection = { ...selection, [type]: presetId }
    onSelectionChange(newSelection)
  }, [selection, onSelectionChange])

  const toggleLayoutSelection = useCallback((layoutType: string) => {
    const currentSelected = selection.selected || []
    const isSelected = currentSelected.some(item => item.id.includes(layoutType))
    
    if (isSelected) {
      // Remove this layout type
      const newSelected = currentSelected.filter(item => !item.id.includes(layoutType))
      onSelectionChange({
        ...selection,
        selected: newSelected.map((item, index) => ({ ...item, order: index }))
      })
    } else {
      // Add this layout type - use the first preset of this type
      const layout = availableLayouts.find(l => l.id === layoutType)
      if (layout && layout.presets.length > 0) {
        const newSelected = [
          ...currentSelected,
          { id: layout.presets[0].id, order: currentSelected.length }
        ]
        onSelectionChange({
          ...selection,
          selected: newSelected
        })
      }
    }
  }, [selection, onSelectionChange, availableLayouts])

  const moveSelectedItem = useCallback((fromIndex: number, toIndex: number) => {
    const currentSelected = selection.selected || []
    const newSelected = [...currentSelected]
    const [movedItem] = newSelected.splice(fromIndex, 1)
    newSelected.splice(toIndex, 0, movedItem)
    
    // Update order values
    const reorderedSelected = newSelected.map((item, index) => ({ ...item, order: index }))
    
    onSelectionChange({
      ...selection,
      selected: reorderedSelected
    })
  }, [selection, onSelectionChange])

  const getLayoutIcon = (layoutType: string) => {
    switch (layoutType) {
      case 'cover-fullbleed':
        return <FileText className="w-4 h-4" />
      case 'body-1col':
        return <Columns className="w-4 h-4" />
      case 'body-2col':
        return <Columns2 className="w-4 h-4" />
      case 'body-2col-sidebar':
        return <Columns2 className="w-4 h-4" />
      case 'data-portrait':
        return <Database className="w-4 h-4" />
      case 'data-appendix':
        return <Palette className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const renderCoverSelection = () => (
    <div>
      <Label className="text-sm font-medium mb-3 block">
        Cover (full-bleed) — <Badge variant="secondary" className="text-xs">Always ON</Badge>
      </Label>
      <div className="space-y-2">
        {coverPresets.map(preset => {
          const isSelected = selection.cover === preset.id
          return (
            <div
              key={preset.id}
              className={`relative border rounded-lg p-3 cursor-pointer transition-all hover:border-primary/50 ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border'
              }`}
              onClick={() => updateSelection('cover', preset.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-md ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {getLayoutIcon(preset.layoutType)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{preset.name}</h4>
                    <div className={`w-4 h-4 rounded border-2 ${
                      isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderLayoutCheckboxes = () => {
    const currentSelected = selection.selected || []
    
    return (
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Body & Data Layouts — Multi-select + Drag to Order
        </Label>
        <div className="space-y-3">
          {availableLayouts.map((layout) => {
            const isSelected = currentSelected.some(item => item.id.includes(layout.id))
            
            return (
              <div key={layout.id} className="flex items-center space-x-3">
                <Checkbox
                  id={layout.id}
                  checked={isSelected}
                  onCheckedChange={() => toggleLayoutSelection(layout.id)}
                />
                <div className="flex-1">
                  <Label htmlFor={layout.id} className="font-medium cursor-pointer">
                    {layout.name}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {layout.description}
                  </p>
                </div>
                <div className={`p-2 rounded-md ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {getLayoutIcon(layout.id)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderSelectedOrder = () => {
    const currentSelected = selection.selected || []
    if (currentSelected.length === 0) return null

    const sortedSelected = [...currentSelected].sort((a, b) => a.order - b.order)

    return (
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Selected Order — Drag to Reorder
        </Label>
        <div className="space-y-2">
          {sortedSelected.map((item, index) => {
            const preset = PAGE_MASTER_PRESETS.find(p => p.id === item.id)
            if (!preset) return null

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 border border-primary/20 bg-primary/5 rounded-lg"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {index + 1}
                  </Badge>
                  <div className="p-1.5 rounded bg-primary text-primary-foreground">
                    {getLayoutIcon(preset.layoutType)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-muted-foreground">{preset.description}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Page Masters
        </CardTitle>
        <CardDescription>
          Select layout templates with multi-select checkboxes and drag-to-order priority
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Page Size Selector */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Page Size</Label>
          <Tabs value={pageSize} onValueChange={(value) => setPageSize(value as 'Letter' | 'A4')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="Letter">Letter (8.5"×11")</TabsTrigger>
              <TabsTrigger value="A4">A4 (210×297mm)</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Cover Master Selection - Always ON */}
        {renderCoverSelection()}

        {/* Multi-select Layout Checkboxes */}
        {renderLayoutCheckboxes()}

        {/* Selected Items Order */}
        {renderSelectedOrder()}
      </CardContent>
    </Card>
  )
})

const PageMasterSelectorWithDragDrop = (props: PageMasterSelectorProps) => {
  return (
    <DragDropProvider>
      <PageMasterSelector {...props} />
    </DragDropProvider>
  )
}

export { PageMasterSelectorWithDragDrop as PageMasterSelector }