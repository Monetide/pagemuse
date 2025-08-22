import { Block, SemanticDocument } from '@/lib/document-model'
import { Minus, Image, Table, BarChart, FileText, BookOpen } from 'lucide-react'
import { FootnoteMarkerRenderer } from './FootnoteMarkerRenderer'
import { TOCRenderer } from './TOCRenderer'
import { LayoutResult } from '@/lib/layout-engine'

interface BlockRendererProps {
  block: Block
  document?: SemanticDocument | null
  layoutResults?: Map<string, LayoutResult>
  currentSectionId?: string
  onTOCEntryClick?: (blockId: string, sectionId: string) => void
  className?: string
}

export const BlockRenderer = ({ 
  block, 
  document, 
  layoutResults,
  currentSectionId,
  onTOCEntryClick,
  className = '' 
}: BlockRendererProps) => {
  const isChunk = block.metadata?.isChunk
  const chunkIndex = block.metadata?.chunkIndex
  const isTableChunk = block.metadata?.isTableChunk

  const renderContent = () => {
    switch (block.type) {
      case 'heading':
        const level = block.metadata?.level || 1
        const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements
        const headingClass = level === 1 ? 'text-xl font-bold' : level === 2 ? 'text-lg font-semibold' : 'text-base font-medium'
        
        return (
          <HeadingTag className={`${headingClass} text-foreground mb-2`}>
            {block.content}
          </HeadingTag>
        )
      
      case 'paragraph':
        const content = typeof block.content === 'string' ? block.content : block.content?.text || ''
        const footnoteMarkers = block.metadata?.footnoteMarkers || []
        
        return (
          <p className="text-sm text-foreground leading-relaxed mb-3">
            {content}
            {footnoteMarkers.map((marker: any) => (
              <FootnoteMarkerRenderer key={marker.id} marker={marker} />
            ))}
          </p>
        )
      
      case 'ordered-list':
        const orderedItems = Array.isArray(block.content) ? block.content : [block.content]
        return (
          <ol className="list-decimal list-inside text-sm text-foreground space-y-1 mb-3 ml-2">
            {orderedItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ol>
        )
      
      case 'unordered-list':
        const unorderedItems = Array.isArray(block.content) ? block.content : [block.content]
        return (
          <ul className="list-disc list-inside text-sm text-foreground space-y-1 mb-3 ml-2">
            {unorderedItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )
      
      case 'quote':
        return (
          <blockquote className="border-l-4 border-accent pl-4 py-2 text-sm text-muted-foreground italic mb-3 bg-muted/20">
            "{block.content}"
          </blockquote>
        )
      
      case 'figure':
        const figureData = block.content || {}
        
        // Apply oversized element policies for figures
        if (block.metadata?.oversizedPolicy === 'scaled' && block.metadata?.scaleRatio) {
          const scaleStyle = {
            transform: `scale(${block.metadata.scaleRatio})`,
            transformOrigin: 'top left',
            width: `${100 / block.metadata.scaleRatio}%`
          }
          
          return (
            <figure className="mb-4 p-2 border border-border rounded bg-muted/10" style={scaleStyle}>
              <div className="text-xs text-amber-600 font-medium mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-500 rounded-full" />
                Scaled to {Math.round(block.metadata.scaleRatio * 100)}% for legibility
              </div>
              <div className="flex items-center justify-center bg-muted/20 border border-dashed border-muted-foreground/30 rounded mb-2" 
                   style={{ height: `${(block.metadata?.imageHeight || 2) * 24}px` }}>
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Image className="w-8 h-8" />
                  <span className="text-xs">{figureData.imageUrl || 'Image placeholder'}</span>
                  <span className="text-xs opacity-60">{block.metadata?.imageHeight || 2}" tall</span>
                </div>
              </div>
              {figureData.caption && (
                <figcaption className="text-xs text-center text-muted-foreground italic mt-2">
                  <strong>Figure {figureData.number || '1'}:</strong> {figureData.caption}
                </figcaption>
              )}
            </figure>
          )
        }
        
        // Handle dedicated page figures
        if (block.metadata?.oversizedPolicy === 'dedicated-page') {
          return (
            <figure className="mb-4 p-2 border border-border rounded bg-muted/10">
              <div className="text-xs text-blue-600 font-medium mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                Full-page figure (dedicated page)
              </div>
              <div className="flex items-center justify-center bg-muted/20 border border-dashed border-muted-foreground/30 rounded mb-2" 
                   style={{ height: `${(block.metadata?.imageHeight || 2) * 24}px` }}>
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Image className="w-8 h-8" />
                  <span className="text-xs">{figureData.imageUrl || 'Image placeholder'}</span>
                  <span className="text-xs opacity-60">{block.metadata?.imageHeight || 2}" tall</span>
                </div>
              </div>
              {figureData.caption && (
                <figcaption className="text-xs text-center text-muted-foreground italic mt-2">
                  <strong>Figure {figureData.number || '1'}:</strong> {figureData.caption}
                </figcaption>
              )}
            </figure>
          )
        }
        
        // Handle auto-landscape figures
        if (block.metadata?.oversizedPolicy === 'auto-landscape') {
          return (
            <figure className="mb-4 p-2 border border-border rounded bg-muted/10">
              <div className="text-xs text-green-600 font-medium mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Page rotated to landscape for optimal viewing
              </div>
              <div className="flex items-center justify-center bg-muted/20 border border-dashed border-muted-foreground/30 rounded mb-2" 
                   style={{ height: `${(block.metadata?.imageHeight || 2) * 24}px` }}>
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Image className="w-8 h-8" />
                  <span className="text-xs">{figureData.imageUrl || 'Image placeholder'}</span>
                  <span className="text-xs opacity-60">{block.metadata?.imageHeight || 2}" tall</span>
                </div>
              </div>
              {figureData.caption && (
                <figcaption className="text-xs text-center text-muted-foreground italic mt-2">
                  <strong>Figure {figureData.number || '1'}:</strong> {figureData.caption}
                </figcaption>
              )}
            </figure>
          )
        }
        
        // Regular figure rendering
        return (
          <figure className="mb-4 p-2 border border-border rounded bg-muted/10">
            <div className="flex items-center justify-center bg-muted/20 border border-dashed border-muted-foreground/30 rounded mb-2" 
                 style={{ height: `${(block.metadata?.imageHeight || 2) * 24}px` }}>
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Image className="w-8 h-8" />
                <span className="text-xs">{figureData.imageUrl || 'Image placeholder'}</span>
                <span className="text-xs opacity-60">{block.metadata?.imageHeight || 2}" tall</span>
              </div>
            </div>
            {figureData.caption && (
              <figcaption className="text-xs text-center text-muted-foreground italic mt-2">
                <strong>Figure {figureData.number || '1'}:</strong> {figureData.caption}
              </figcaption>
            )}
          </figure>
        )
      
      case 'table':
        const tableData = block.content || { headers: [], rows: [] }
        return (
          <div className="mb-4">
            {/* Show oversized element policy indicators */}
            {block.metadata?.oversizedPolicy === 'scaled' && block.metadata?.scaleRatio && (
              <div className="text-xs text-amber-600 font-medium mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-500 rounded-full" />
                Table scaled to {Math.round(block.metadata.scaleRatio * 100)}% for legibility
              </div>
            )}
            {block.metadata?.oversizedPolicy === 'auto-landscape' && (
              <div className="text-xs text-green-600 font-medium mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Page rotated to landscape for wide table
              </div>
            )}
            {block.metadata?.oversizedPolicy === 'dedicated-page' && (
              <div className="text-xs text-blue-600 font-medium mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                Wide table on dedicated page
              </div>
            )}
            {isTableChunk && chunkIndex! > 0 && (
              <div className="text-xs text-accent font-medium mb-2 flex items-center gap-1">
                <Table className="w-3 h-3" />
                Table continued from previous page/column
              </div>
            )}
            <div className="border border-border rounded overflow-hidden bg-background"
                 style={block.metadata?.oversizedPolicy === 'scaled' && block.metadata?.scaleRatio ? {
                   transform: `scale(${block.metadata.scaleRatio})`,
                   transformOrigin: 'top left',
                   width: `${100 / block.metadata.scaleRatio}%`
                 } : {}}>
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    {(tableData.headers || []).map((header: string, index: number) => (
                      <th key={index} className="px-2 py-1 text-left font-semibold border-r border-border last:border-r-0">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(tableData.rows || []).map((row: string[], rowIndex: number) => (
                    <tr key={rowIndex} className="border-t border-border hover:bg-muted/20">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-2 py-1 border-r border-border last:border-r-0">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tableData.caption && (
              <div className="text-xs text-center text-muted-foreground italic mt-2">
                <strong>Table {tableData.number || '1'}:</strong> {tableData.caption}
                {block.metadata?.policyApplied && (
                  <span className="ml-2 text-xs opacity-70">
                    ({block.metadata.policyApplied})
                  </span>
                )}
              </div>
            )}
          </div>
        )
      
      case 'chart':
        const chartData = block.content || {}
        return (
          <div className="mb-4">
            {chartData.title && (
              <h3 className="text-base font-semibold mb-2 text-center">{chartData.title}</h3>
            )}
            <div className="border border-border rounded p-4 bg-muted/10">
              <div className="flex items-center justify-center bg-muted/20 border border-dashed border-muted-foreground/30 rounded mb-2" 
                   style={{ height: `${chartData.size === 'full-width' ? 400 : 300}px` }}>
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <BarChart className="w-8 h-8" />
                  <span className="text-xs">{chartData.chartType || 'Bar'} Chart</span>
                  <span className="text-xs opacity-60">{chartData.data?.length || 0} data points</span>
                </div>
              </div>
            </div>
            {chartData.caption && (
              <div className="text-xs text-center text-muted-foreground italic mt-2">
                <strong>Chart {chartData.number || '1'}:</strong> {chartData.caption}
              </div>
            )}
          </div>
        )
      
      case 'divider':
        return (
          <div className="flex justify-center my-4">
            <Minus className="w-12 h-px text-border" />
          </div>
        )
      
      case 'spacer':
        const height = block.metadata?.height || 0.5
        return (
          <div 
            className="w-full bg-transparent"
            style={{ height: `${height * 24}px` }} // 24px per 0.5 inch approx
          />
        )
      
      case 'footnote':
        const footnoteData = block.content || {}
        return (
          <div className="mb-2 text-xs border-l-2 border-accent pl-2 bg-muted/10 rounded-r">
            <div className="flex items-start gap-2">
              <FileText className="w-3 h-3 mt-0.5 text-accent flex-shrink-0" />
              <div>
                <div className="font-medium text-foreground mb-1">
                  Footnote {footnoteData.number || '?'}
                </div>
                <div className="text-muted-foreground">
                  {footnoteData.content || 'Footnote content'}
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'table-of-contents':
        return (
          <TOCRenderer
            block={block}
            document={document}
            layoutResults={layoutResults}
            currentSectionId={currentSectionId}
            onEntryClick={onTOCEntryClick}
            className="mb-4"
          />
        )
      
      default:
        return (
          <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded border border-dashed">
            Unknown block type: {block.type}
          </div>
        )
    }
  }

  return (
    <div className={`block-content ${className}`}>
      {(isChunk || isTableChunk) && (
        <div className="text-xs text-accent font-medium mb-1 flex items-center gap-1">
          <span className="w-2 h-2 bg-accent rounded-full" />
          {isTableChunk 
            ? `Table continued (part ${chunkIndex! + 1})`
            : `Continued from previous column (part ${chunkIndex! + 1})`
          }
        </div>
      )}
      {renderContent()}
    </div>
  )
}