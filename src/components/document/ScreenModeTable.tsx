import { Block } from '@/lib/document-model'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table } from 'lucide-react'

interface ScreenModeTableProps {
  block: Block
  className?: string
}

export const ScreenModeTable = ({ block, className = '' }: ScreenModeTableProps) => {
  const tableData = block.content || { headers: [], rows: [] }
  const isTableChunk = block.metadata?.isTableChunk
  const chunkIndex = block.metadata?.chunkIndex

  return (
    <div className={`screen-mode-table mb-6 ${className}`}>
      {/* Table chunk indicator */}
      {isTableChunk && chunkIndex! > 0 && (
        <div className="text-sm text-accent font-medium mb-3 flex items-center gap-2">
          <Table className="w-4 h-4" />
          Table continued from above
        </div>
      )}

      {/* Responsive table container */}
      <div className="border border-border rounded-lg overflow-hidden bg-background shadow-sm">
        <ScrollArea className="w-full">
          <div className="min-w-full">
            <table className="w-full text-sm border-collapse">
              {/* Sticky header */}
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr>
                  {(tableData.headers || []).map((header: string, index: number) => (
                    <th 
                      key={index} 
                      className="px-4 py-3 text-left font-semibold border-r border-border last:border-r-0 min-w-32"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              
              {/* Table body */}
              <tbody>
                {(tableData.rows || []).map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex} className="border-t border-border hover:bg-muted/20">
                    {row.map((cell, cellIndex) => (
                      <td 
                        key={cellIndex} 
                        className="px-4 py-3 border-r border-border last:border-r-0 align-top"
                      >
                        <div className="min-w-0 break-words">
                          {cell}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </div>

      {/* Caption */}
      {tableData.caption && (
        <div className="text-sm text-center text-muted-foreground italic mt-3 px-4">
          <strong>Table {tableData.number || '1'}:</strong> {tableData.caption}
        </div>
      )}
    </div>
  )
}