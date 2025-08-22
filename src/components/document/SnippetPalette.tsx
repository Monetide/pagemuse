import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  BarChart3, 
  Quote, 
  Megaphone, 
  Grid3X3, 
  Clock, 
  GitCompare,
  Sparkles,
  GripVertical
} from 'lucide-react'
import { TemplateSnippet } from '@/lib/template-model'
import { cn } from '@/lib/utils'
import { useDragDropContext } from '@/contexts/DragDropContext'

interface SnippetCategory {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const snippetCategories: SnippetCategory[] = [
  { key: 'metrics', label: 'Metrics', icon: BarChart3 },
  { key: 'content', label: 'Content', icon: Quote },
  { key: 'marketing', label: 'Marketing', icon: Megaphone }
]

const snippetIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'kpi-strip': BarChart3,
  'pull-quote': Quote,
  'cta-card': Megaphone,
  'feature-grid': Grid3X3,
  'timeline': Clock,
  'comparison-table': GitCompare
}

interface SnippetPaletteProps {
  snippets: TemplateSnippet[]
  onInsertSnippet: (snippet: TemplateSnippet) => void
  onDragStart?: (snippet: TemplateSnippet) => void
  onDragEnd?: () => void
}

export const SnippetPalette = ({ 
  snippets, 
  onInsertSnippet, 
  onDragStart, 
  onDragEnd 
}: SnippetPaletteProps) => {
  const { startDrag, endDrag } = useDragDropContext()

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, snippet: TemplateSnippet) => {
    // Start drag with ghost position
    startDrag(
      { 
        type: 'snippet', 
        snippet,
        sourceElement: e.currentTarget
      },
      { 
        x: e.clientX, 
        y: e.clientY 
      }
    )
    
    // Set drag data for native drag events
    e.dataTransfer.setData('application/x-snippet', JSON.stringify(snippet))
    e.dataTransfer.effectAllowed = 'copy'
    
    // Create a transparent drag image to hide the native ghost
    const dragImage = document.createElement('div')
    dragImage.style.opacity = '0'
    dragImage.style.position = 'absolute'
    dragImage.style.top = '-1000px'
    dragImage.style.width = '1px'
    dragImage.style.height = '1px'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    
    // Clean up after a delay
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage)
      }
    }, 100)

    onDragStart?.(snippet)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    endDrag()
    onDragEnd?.()
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>, snippet: TemplateSnippet) => {
    // Add visual feedback for drag start
    e.currentTarget.style.transform = 'scale(0.95)'
    e.currentTarget.style.opacity = '0.8'
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Remove visual feedback
    e.currentTarget.style.transform = ''
    e.currentTarget.style.opacity = ''
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Remove visual feedback if mouse leaves while pressed
    e.currentTarget.style.transform = ''
    e.currentTarget.style.opacity = ''
  }

  if (snippets.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Template Snippets</h3>
          <p className="text-xs text-muted-foreground mt-1">
            No snippets available for this template
          </p>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No snippets defined</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Template Snippets</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Ready-to-use patterns styled for this template
        </p>
      </div>

      {/* Snippet Categories */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {snippetCategories.map(category => {
            const categorySnippets = snippets.filter(s => s.category === category.key)
            
            if (categorySnippets.length === 0) return null
            
            return (
              <div key={category.key}>
                <div className="flex items-center gap-2 mb-3">
                  <category.icon className="w-4 h-4 text-primary" />
                  <Badge variant="secondary" className="text-xs">
                    {category.label}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {categorySnippets.map(snippet => {
                    const SnippetIcon = snippetIcons[snippet.id] || Sparkles
                    
                    return (
                      <Card 
                        key={snippet.id}
                        className="group hover:border-primary/50 transition-colors cursor-pointer"
                      >
                        <CardContent className="p-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            draggable
                            onDragStart={(e) => handleDragStart(e, snippet)}
                            onDragEnd={handleDragEnd}
                            onMouseDown={(e) => handleMouseDown(e, snippet)}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => onInsertSnippet(snippet)}
                            className={cn(
                              'w-full justify-start h-auto p-3 hover:bg-accent/50',
                              'cursor-grab active:cursor-grabbing transition-all duration-150',
                              'group'
                            )}
                          >
                            <div className="flex items-start gap-3 w-full">
                              <div className="flex items-center gap-2">
                                <GripVertical className="h-3 w-3 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 border border-primary/20">
                                  <SnippetIcon className="h-4 w-4 text-primary" />
                                </div>
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-medium text-sm mb-1">{snippet.name}</div>
                                <div className="text-xs text-muted-foreground leading-relaxed">
                                  {snippet.description}
                                </div>
                                {snippet.keywords.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {snippet.keywords.slice(0, 3).map(keyword => (
                                      <Badge 
                                        key={keyword} 
                                        variant="outline" 
                                        className="text-xs px-1 py-0 h-4"
                                      >
                                        {keyword}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}