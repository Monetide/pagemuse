import { Block } from '@/lib/document-model'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, Table2 } from 'lucide-react'

interface TableInspectorProps {
  block: Block
  onContentChange?: (blockId: string, newContent: any) => void
  onMetadataChange?: (blockId: string, metadata: any) => void
}

interface TableContent {
  headers: string[]
  rows: string[][]
  caption: string
  number: number
  columnAlignments?: ('left' | 'center' | 'right')[]
  columnWidths?: number[]
}

interface TableMetadata {
  repeatHeaders?: boolean
  allowRowSplit?: boolean
  borderStyle?: 'none' | 'simple' | 'grid' | 'professional'
  striped?: boolean
  compact?: boolean
}

export const TableInspector = ({ 
  block, 
  onContentChange, 
  onMetadataChange 
}: TableInspectorProps) => {
  const content = block.content as TableContent
  const metadata = (block.metadata || {}) as TableMetadata

  const updateContent = (updates: Partial<TableContent>) => {
    onContentChange?.(block.id, { ...content, ...updates })
  }

  const updateMetadata = (updates: Partial<TableMetadata>) => {
    onMetadataChange?.(block.id, { ...metadata, ...updates })
  }

  const addColumn = () => {
    const newHeaders = [...content.headers, `Column ${content.headers.length + 1}`]
    const newRows = content.rows.map(row => [...row, ''])
    const newAlignments = [...(content.columnAlignments || []), 'left' as 'left' | 'center' | 'right']
    const newWidths = [...(content.columnWidths || []), 100]
    
    updateContent({
      headers: newHeaders,
      rows: newRows,
      columnAlignments: newAlignments,
      columnWidths: newWidths
    })
  }

  const removeColumn = () => {
    if (content.headers.length <= 1) return
    
    const newHeaders = content.headers.slice(0, -1)
    const newRows = content.rows.map(row => row.slice(0, -1))
    const newAlignments = content.columnAlignments?.slice(0, -1)
    const newWidths = content.columnWidths?.slice(0, -1)
    
    updateContent({
      headers: newHeaders,
      rows: newRows,
      columnAlignments: newAlignments,
      columnWidths: newWidths
    })
  }

  const addRow = () => {
    const newRow = new Array(content.headers.length).fill('')
    updateContent({ rows: [...content.rows, newRow] })
  }

  const removeRow = () => {
    if (content.rows.length <= 1) return
    updateContent({ rows: content.rows.slice(0, -1) })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Table2 className="w-4 h-4" />
        <span className="font-medium">Table Properties</span>
        <Badge variant="secondary" className="ml-auto">
          Table {content.number}
        </Badge>
      </div>

      {/* Dimensions */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Dimensions</Label>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Columns</Label>
            <div className="flex items-center gap-1 mt-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={removeColumn}
                disabled={content.headers.length <= 1}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="text-sm font-mono bg-muted px-2 py-1 rounded text-center min-w-[3rem]">
                {content.headers.length}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={addColumn}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground">Rows</Label>
            <div className="flex items-center gap-1 mt-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={removeRow}
                disabled={content.rows.length <= 1}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="text-sm font-mono bg-muted px-2 py-1 rounded text-center min-w-[3rem]">
                {content.rows.length}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={addRow}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Caption and Number */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Caption & Numbering</Label>
        
        <div>
          <Label className="text-xs text-muted-foreground">Caption</Label>
          <Input
            value={content.caption}
            onChange={(e) => updateContent({ caption: e.target.value })}
            placeholder="Enter table caption..."
            className="mt-1"
          />
        </div>
        
        <div>
          <Label className="text-xs text-muted-foreground">Table Number</Label>
          <Input
            type="number"
            value={content.number}
            onChange={(e) => updateContent({ number: parseInt(e.target.value) || 1 })}
            className="mt-1"
            min={1}
          />
        </div>
      </div>

      <Separator />

      {/* Pagination Behavior */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Pagination</Label>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-xs">Repeat Headers</Label>
            <p className="text-xs text-muted-foreground">
              Repeat header row on new pages
            </p>
          </div>
          <Switch
            checked={metadata.repeatHeaders !== false}
            onCheckedChange={(checked) => updateMetadata({ repeatHeaders: checked })}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-xs">Prevent Row Split</Label>
            <p className="text-xs text-muted-foreground">
              Keep rows together across pages
            </p>
          </div>
          <Switch
            checked={metadata.allowRowSplit === false}
            onCheckedChange={(checked) => updateMetadata({ allowRowSplit: !checked })}
          />
        </div>
      </div>

      <Separator />

      {/* Styling */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Style</Label>
        
        <div>
          <Label className="text-xs text-muted-foreground">Border Style</Label>
          <Select
            value={metadata.borderStyle || 'simple'}
            onValueChange={(value: 'none' | 'simple' | 'grid' | 'professional') => 
              updateMetadata({ borderStyle: value })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Borders</SelectItem>
              <SelectItem value="simple">Simple</SelectItem>
              <SelectItem value="grid">Grid</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-xs">Striped Rows</Label>
            <p className="text-xs text-muted-foreground">
              Alternate row background colors
            </p>
          </div>
          <Switch
            checked={metadata.striped || false}
            onCheckedChange={(checked) => updateMetadata({ striped: checked })}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-xs">Compact Mode</Label>
            <p className="text-xs text-muted-foreground">
              Reduced padding for denser layout
            </p>
          </div>
          <Switch
            checked={metadata.compact || false}
            onCheckedChange={(checked) => updateMetadata({ compact: checked })}
          />
        </div>
      </div>
    </div>
  )
}