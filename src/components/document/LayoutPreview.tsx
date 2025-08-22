import { Section } from '@/lib/document-model'
import { generateLayout } from '@/lib/layout-engine'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface LayoutPreviewProps {
  section: Section
}

export const LayoutPreview = ({ section }: LayoutPreviewProps) => {
  const layoutResult = generateLayout(section)

  const getRuleChipColor = (rule: string) => {
    switch (rule) {
      case 'keepWithNext':
        return 'bg-blue-100 text-blue-800'
      case 'breakBefore':
        return 'bg-red-100 text-red-800'
      case 'breakAfter':
        return 'bg-orange-100 text-orange-800'
      case 'breakAvoid':
        return 'bg-green-100 text-green-800'
      case 'atomic':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getBlockRules = (block: any) => {
    const rules = []
    if (block.paginationRules?.keepWithNext) rules.push('keepWithNext')
    if (block.paginationRules?.breakBefore) rules.push('breakBefore')
    if (block.paginationRules?.breakAfter) rules.push('breakAfter')
    if (block.paginationRules?.breakAvoid) rules.push('breakAvoid')
    if (['figure', 'table'].includes(block.type)) rules.push('atomic')
    return rules
  }

  return (
    <Card className="w-80 h-full">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          🔧 Layout Preview
          <Badge variant="outline" className="text-xs">
            Debug
          </Badge>
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Pages: {layoutResult.totalPages} • 
          {layoutResult.hasOverflow && ' Overflow detected'}
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {layoutResult.pages.map((page, pageIndex) => (
            <div key={page.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Page {pageIndex + 1}</h4>
                {page.hasOverflow && (
                  <Badge variant="destructive" className="text-xs">
                    Overflow
                  </Badge>
                )}
              </div>
              
              <div className="border border-dashed border-border rounded p-2 space-y-2">
                {/* Page Master Info */}
                <div className="text-xs text-muted-foreground">
                  {page.pageMaster.pageSize} • {page.pageMaster.columns} col • 
                  {page.pageMaster.margins.top}"/{page.pageMaster.margins.right}"/{page.pageMaster.margins.bottom}"/{page.pageMaster.margins.left}" margins
                </div>
                
                {/* Columns */}
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${page.pageMaster.columns}, 1fr)` }}>
                  {page.columnBoxes.map((column, colIndex) => (
                    <div key={column.id} className="border border-border rounded p-2 bg-muted/20">
                      <div className="text-xs font-medium mb-1">
                        Col {colIndex + 1} ({column.content.length} blocks)
                      </div>
                      
                      <div className="space-y-1">
                        {column.content.map((block, blockIndex) => {
                          const rules = getBlockRules(block)
                          return (
                            <div key={`${block.id}-${blockIndex}`} className="text-xs">
                              <div className="flex items-center gap-1 mb-1">
                                <span className="font-mono text-[10px] bg-background px-1 rounded">
                                  {block.type}
                                </span>
                                {block.metadata?.isChunk && (
                                  <Badge variant="outline" className="text-[8px] px-1 h-4">
                                    chunk
                                  </Badge>
                                )}
                              </div>
                              
                              {rules.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {rules.map(rule => (
                                    <span 
                                      key={rule}
                                      className={`text-[8px] px-1 py-0.5 rounded ${getRuleChipColor(rule)}`}
                                    >
                                      {rule}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                        
                        {column.content.length === 0 && (
                          <div className="text-[10px] text-muted-foreground italic">
                            Empty column
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {pageIndex < layoutResult.pages.length - 1 && (
                <Separator className="my-2" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  )
}