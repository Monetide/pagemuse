import { useState, useRef, useCallback, useEffect } from 'react'
import { Block } from '@/lib/document-model'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Minus, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  GripVertical,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TableEditorProps {
  block: Block
  onContentChange?: (blockId: string, newContent: any) => void
  onSelect?: (blockId: string) => void
  isSelected?: boolean
}

interface TableContent {
  headers: string[]
  rows: string[][]
  caption: string
  number: number
  columnAlignments?: ('left' | 'center' | 'right')[]
  columnWidths?: number[]
}

export const TableEditor = ({ 
  block, 
  onContentChange, 
  onSelect, 
  isSelected 
}: TableEditorProps) => {
  const tableContent = block.content as TableContent
  const [isEditing, setIsEditing] = useState(false)
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null)
  const [resizingColumn, setResizingColumn] = useState<number | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)
  const tableRef = useRef<HTMLTableElement>(null)
  
  const columnAlignments = tableContent.columnAlignments || 
    new Array(tableContent.headers.length).fill('left')
  const columnWidths = tableContent.columnWidths || 
    new Array(tableContent.headers.length).fill(100)

  const updateContent = useCallback((updates: Partial<TableContent>) => {
    const newContent = { ...tableContent, ...updates }
    onContentChange?.(block.id, newContent)
  }, [block.id, tableContent, onContentChange])

  const addColumn = useCallback(() => {
    const newHeaders = [...tableContent.headers, `Column ${tableContent.headers.length + 1}`]
    const newRows = tableContent.rows.map(row => [...row, ''])
    const newAlignments = [...columnAlignments, 'left']
    const newWidths = [...columnWidths, 100]
    
    updateContent({
      headers: newHeaders,
      rows: newRows,
      columnAlignments: newAlignments,
      columnWidths: newWidths
    })
  }, [tableContent, columnAlignments, columnWidths, updateContent])

  const removeColumn = useCallback((colIndex: number) => {
    if (tableContent.headers.length <= 1) return
    
    const newHeaders = tableContent.headers.filter((_, i) => i !== colIndex)
    const newRows = tableContent.rows.map(row => row.filter((_, i) => i !== colIndex))
    const newAlignments = columnAlignments.filter((_, i) => i !== colIndex)
    const newWidths = columnWidths.filter((_, i) => i !== colIndex)
    
    updateContent({
      headers: newHeaders,
      rows: newRows,
      columnAlignments: newAlignments,
      columnWidths: newWidths
    })
  }, [tableContent, columnAlignments, columnWidths, updateContent])

  const addRow = useCallback(() => {
    const newRow = new Array(tableContent.headers.length).fill('')
    const newRows = [...tableContent.rows, newRow]
    updateContent({ rows: newRows })
  }, [tableContent, updateContent])

  const removeRow = useCallback((rowIndex: number) => {
    if (tableContent.rows.length <= 1) return
    
    const newRows = tableContent.rows.filter((_, i) => i !== rowIndex)
    updateContent({ rows: newRows })
  }, [tableContent, updateContent])

  const updateCell = useCallback((row: number, col: number, value: string) => {
    if (row === -1) {
      // Header cell
      const newHeaders = [...tableContent.headers]
      newHeaders[col] = value
      updateContent({ headers: newHeaders })
    } else {
      // Data cell
      const newRows = [...tableContent.rows]
      newRows[row] = [...newRows[row]]
      newRows[row][col] = value
      updateContent({ rows: newRows })
    }
  }, [tableContent, updateContent])

  const updateColumnAlignment = useCallback((colIndex: number, alignment: 'left' | 'center' | 'right') => {
    const newAlignments = [...columnAlignments]
    newAlignments[colIndex] = alignment
    updateContent({ columnAlignments: newAlignments })
  }, [columnAlignments, updateContent])

  const handleMouseDown = useCallback((e: React.MouseEvent, colIndex: number) => {
    e.preventDefault()
    setResizingColumn(colIndex)
    setResizeStartX(e.clientX)
    setResizeStartWidth(columnWidths[colIndex])
  }, [columnWidths])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (resizingColumn === null) return
    
    const deltaX = e.clientX - resizeStartX
    const minWidth = 50
    const snapWidth = 25
    let newWidth = Math.max(minWidth, resizeStartWidth + deltaX)
    
    // Snap to grid
    newWidth = Math.round(newWidth / snapWidth) * snapWidth
    
    const newWidths = [...columnWidths]
    newWidths[resizingColumn] = newWidth
    updateContent({ columnWidths: newWidths })
  }, [resizingColumn, resizeStartX, resizeStartWidth, columnWidths, updateContent])

  const handleMouseUp = useCallback(() => {
    setResizingColumn(null)
    setResizeStartX(0)
    setResizeStartWidth(0)
  }, [])

  useEffect(() => {
    if (resizingColumn !== null) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [resizingColumn, handleMouseMove, handleMouseUp])

  const renderCell = (content: string, row: number, col: number) => {
    const isEditingThis = editingCell?.row === row && editingCell?.col === col
    const alignment = columnAlignments[col]
    const width = columnWidths[col]

    if (isEditingThis) {
      return (
        <Input
          value={content}
          onChange={(e) => updateCell(row, col, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
              setEditingCell(null)
            }
          }}
          className="h-8 border-0 bg-transparent px-2 text-sm"
          style={{ width: `${width}px`, textAlign: alignment }}
          autoFocus
        />
      )
    }

    return (
      <div
        className="px-2 py-1 cursor-text min-h-[2rem] flex items-center"
        style={{ width: `${width}px`, textAlign: alignment }}
        onClick={() => setEditingCell({ row, col })}
      >
        {content || (row === -1 ? `Column ${col + 1}` : '')}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "table-editor border rounded-lg overflow-hidden",
        isSelected ? "ring-2 ring-primary" : "border-border",
        "hover:border-primary/50 transition-colors"
      )}
      onClick={() => onSelect?.(block.id)}
    >
      {/* Table Controls */}
      <div className="flex items-center gap-2 p-2 bg-muted/30 border-b">
        <Button size="sm" variant="ghost" onClick={addColumn}>
          <Plus className="w-3 h-3 mr-1" />
          Column
        </Button>
        <Button size="sm" variant="ghost" onClick={addRow}>
          <Plus className="w-3 h-3 mr-1" />
          Row
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {tableContent.rows.length} rows × {tableContent.headers.length} columns
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table ref={tableRef} className="w-full" role="table" aria-label="Data table">
          {/* Headers */}
          <thead role="rowgroup">
            <tr className="bg-muted/50" role="row">
              {tableContent.headers.map((header, colIndex) => (
                <th
                  key={colIndex}
                  className="relative border-r border-border last:border-r-0 font-medium"
                  style={{ width: `${columnWidths[colIndex]}px` }}
                  role="columnheader"
                  aria-sort="none"
                >
                  {/* ... keep existing code (column controls) */}

                  {renderCell(header, -1, colIndex)}

                  {/* ... keep existing code (column resizer) */}
                </th>
              ))}
            </tr>
          </thead>

          {/* Rows */}
          <tbody role="rowgroup">
            {tableContent.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-border hover:bg-muted/20" role="row">
                {/* ... keep existing code (row controls) */}

                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className="border-r border-border last:border-r-0"
                    style={{ width: `${columnWidths[colIndex]}px` }}
                    role="cell"
                  >
                    {renderCell(cell, rowIndex, colIndex)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Caption */}
      <div className="p-2 border-t bg-muted/30">
        <Input
          value={tableContent.caption}
          onChange={(e) => updateContent({ caption: e.target.value })}
          placeholder="Table caption..."
          className="text-sm bg-transparent border-0 px-0"
        />
      </div>
    </div>
  )
}