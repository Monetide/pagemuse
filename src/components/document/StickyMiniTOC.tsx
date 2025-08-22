import { useState, useEffect } from 'react'
import { SemanticDocument } from '@/lib/document-model'
import { TOCEntry, generateTOC, defaultTOCConfig } from '@/lib/toc-generator'
import { LayoutResult } from '@/lib/layout-engine'
import { useTOCNavigation } from '@/hooks/useTOCNavigation'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BookOpen, ChevronRight } from 'lucide-react'
import { useViewMode } from '@/contexts/ViewModeContext'

interface StickyMiniTOCProps {
  document: SemanticDocument | null
  layoutResults?: Map<string, LayoutResult>
  className?: string
}

export const StickyMiniTOC = ({ 
  document, 
  layoutResults = new Map(), 
  className = '' 
}: StickyMiniTOCProps) => {
  const [entries, setEntries] = useState<TOCEntry[]>([])
  const [activeEntry, setActiveEntry] = useState<string | null>(null)
  const { jumpToHeading } = useTOCNavigation()
  const { preferences } = useViewMode()

  // Don't show if not enabled in preferences
  if (!preferences.stickyTOC) return null

  // Generate TOC entries without page numbers for screen mode
  useEffect(() => {
    if (document && layoutResults.size > 0) {
      const config = {
        ...defaultTOCConfig,
        showPageNumbers: false, // Screen mode doesn't show page numbers
        includeLevels: [true, true, true, false, false, false] // H1-H3 for mini TOC
      }
      
      const newEntries = generateTOC(document, layoutResults, config)
      setEntries(newEntries)
    }
  }, [document, layoutResults])

  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const headings = entries.map(entry => ({
        id: entry.blockId,
        element: globalThis.document?.getElementById(`block-${entry.blockId}`)
      })).filter(h => h.element)

      let activeId = null
      for (const heading of headings) {
        const rect = heading.element!.getBoundingClientRect()
        if (rect.top <= 100) { // 100px offset from top
          activeId = heading.id
        } else {
          break
        }
      }

      setActiveEntry(activeId)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [entries])

  const handleEntryClick = (entry: TOCEntry) => {
    jumpToHeading(entry.blockId, entry.sectionId)
  }

  if (entries.length === 0) return null

  return (
    <Card className={`sticky-mini-toc fixed left-4 top-1/2 transform -translate-y-1/2 w-64 shadow-lg z-30 ${className}`}>
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Contents</span>
        </div>
      </div>
      
      <ScrollArea className="max-h-96">
        <div className="p-2">
          {entries.map((entry) => {
            const isActive = activeEntry === entry.blockId
            const indentClass = entry.level === 1 ? '' : 
                               entry.level === 2 ? 'ml-3' : 'ml-6'
            
            return (
              <button
                key={entry.id}
                onClick={() => handleEntryClick(entry)}
                className={`
                  w-full text-left text-xs py-1.5 px-2 rounded transition-colors
                  ${indentClass}
                  ${isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }
                `}
              >
                <div className="flex items-center gap-1">
                  {isActive && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                  <span className="truncate">{entry.text}</span>
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </Card>
  )
}