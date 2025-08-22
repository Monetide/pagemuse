import { useState, useEffect } from 'react'
import { Block, SemanticDocument } from '@/lib/document-model'
import { useViewMode } from '@/contexts/ViewModeContext'
import { TOCEntry, TOCConfiguration, generateTOC, formatTOCEntry, defaultTOCConfig } from '@/lib/toc-generator'
import { LayoutResult } from '@/lib/layout-engine'
import { RefreshCw, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TOCRendererProps {
  block: Block
  document?: SemanticDocument | null
  layoutResults?: Map<string, LayoutResult>
  currentSectionId?: string
  onEntryClick?: (blockId: string, sectionId: string) => void
  className?: string
}

export const TOCRenderer = ({ 
  block, 
  document, 
  layoutResults = new Map(), 
  currentSectionId,
  onEntryClick,
  className = '' 
}: TOCRendererProps) => {
  const [entries, setEntries] = useState<TOCEntry[]>([])
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toISOString())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { viewMode } = useViewMode()

  // Get configuration from block content or use defaults
  const config: TOCConfiguration = {
    ...defaultTOCConfig,
    ...block.content,
    // Override page numbers based on view mode
    showPageNumbers: viewMode === 'print' ? (block.content?.showPageNumbers ?? true) : false
  }

  // Generate TOC entries
  useEffect(() => {
    if (document && layoutResults.size > 0) {
      const newEntries = generateTOC(document, layoutResults, config, currentSectionId)
      setEntries(newEntries)
      setLastUpdate(new Date().toISOString())
    }
  }, [document, layoutResults, config, currentSectionId])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh delay for UX
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (document) {
      const newEntries = generateTOC(document, layoutResults, config, currentSectionId)
      setEntries(newEntries)
      setLastUpdate(new Date().toISOString())
    }
    
    setIsRefreshing(false)
  }

  const handleEntryClick = (entry: TOCEntry) => {
    onEntryClick?.(entry.blockId, entry.sectionId)
  }

  const renderEntry = (entry: TOCEntry, index: number) => {
    const indentLevel = entry.level - 1
    const indentPixels = indentLevel * (config.indentPerLevel * 24) // Convert inches to pixels
    
    return (
      <div 
        key={entry.id}
        className={`toc-entry flex items-start group cursor-pointer py-1 ${
          config.linkStyle === 'always' ? 'text-primary underline' : 
          config.linkStyle === 'hover' ? 'hover:text-primary hover:underline' : ''
        }`}
        style={{ 
          paddingLeft: `${indentPixels}px`,
          marginBottom: `${config.itemSpacing * 12}px` // Convert inches to pixels
        }}
        onClick={() => handleEntryClick(entry)}
        role="button"
        tabIndex={0}
        aria-label={`Go to ${entry.text}`}
        title={`${entry.text} • ${entry.sectionName} — Page ${entry.pageNumber}`}
      >
        {config.pageNumberAlignment === 'right' ? (
          <>
            <div className="flex-1 min-w-0">
              <div className="truncate pr-2">{entry.text}</div>
            </div>
            {config.showPageNumbers && viewMode === 'print' && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {config.leader === 'dots' && (
                  <div className="flex-1 border-b border-dotted border-muted-foreground opacity-50 min-w-4"></div>
                )}
                {config.leader === 'dashes' && (
                  <div className="flex-1 border-b border-dashed border-muted-foreground opacity-50 min-w-4"></div>
                )}
                <span className="text-sm text-muted-foreground font-medium min-w-8 text-right">
                  {entry.pageNumber}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1">
            <span>{entry.text}</span>
            {config.showPageNumbers && config.pageNumberAlignment === 'inline' && viewMode === 'print' && (
              <span className="text-muted-foreground ml-1">(p. {entry.pageNumber})</span>
            )}
          </div>
        )}
      </div>
    )
  }

  const shouldShowContinued = config.allowPageBreaks && config.showContinued && entries.length > 20

  return (
    <div className={`toc-container ${className}`} role="navigation" aria-label="Table of Contents">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">{config.title}</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {config.autoUpdate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Updated
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 px-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* TOC Content */}
      {entries.length > 0 ? (
        <div 
          className={`toc-content ${config.columns === 2 ? 'columns-2' : ''}`}
          style={config.columns === 2 ? { 
            columnGap: `${config.columnGap * 24}px`,
            columnFill: 'balance'
          } : {}}
        >
          {entries.map((entry, index) => renderEntry(entry, index))}
          
          {shouldShowContinued && (
            <div className="text-xs text-muted-foreground italic mt-4 break-after-column">
              Continued on next page...
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No headings found</p>
          <p className="text-xs mt-1">Add headings to your document to see them here</p>
        </div>
      )}

      {/* Footer info */}
      <div className="mt-4 pt-2 border-t border-border text-xs text-muted-foreground">
        {entries.length > 0 && (
          <div className="flex justify-between items-center">
            <span>{entries.length} entries</span>
            <span>Last updated: {new Date(lastUpdate).toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}