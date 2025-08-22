import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Type, 
  AlignLeft, 
  Quote, 
  List, 
  ListOrdered, 
  Image, 
  Table, 
  BarChart,
  Link, 
  Minus, 
  Move,
  FileText,
  GripVertical,
  BookOpen,
  Sparkles
} from 'lucide-react'
import { Block } from '@/lib/document-model'
import { TemplateSnippet } from '@/lib/template-model'
import { cn } from '@/lib/utils'
import { useDragDropContext } from '@/contexts/DragDropContext'
import { SnippetPalette } from './SnippetPalette'

interface BlockType {
  type: Block['type']
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: 'text' | 'layout' | 'atomic'
}

const blockTypes: BlockType[] = [
  {
    type: 'heading',
    name: 'Heading',
    description: 'Section title',
    icon: Type,
    category: 'text'
  },
  {
    type: 'paragraph',
    name: 'Paragraph',
    description: 'Plain text',
    icon: AlignLeft,
    category: 'text'
  },
  {
    type: 'quote',
    name: 'Quote',
    description: 'Blockquote with attribution',
    icon: Quote,
    category: 'text'
  },
  {
    type: 'unordered-list',
    name: 'Bullet List',
    description: 'Bulleted list',
    icon: List,
    category: 'text'
  },
  {
    type: 'ordered-list',
    name: 'Numbered List',
    description: 'Numbered list',
    icon: ListOrdered,
    category: 'text'
  },
  {
    type: 'figure',
    name: 'Figure',
    description: 'Image with caption',
    icon: Image,
    category: 'atomic'
  },
  {
    type: 'table',
    name: 'Table',
    description: 'Data table',
    icon: Table,
    category: 'atomic'
  },
  {
    type: 'chart',
    name: 'Chart',
    description: 'Data visualization',
    icon: BarChart,
    category: 'atomic'
  },
  {
    type: 'cross-reference',
    name: 'Cross Reference',
    description: 'Link to other content',
    icon: Link,
    category: 'text'
  },
  {
    type: 'divider',
    name: 'Divider',
    description: 'Section break',
    icon: Minus,
    category: 'layout'
  },
  {
    type: 'spacer',
    name: 'Spacer',
    description: 'Vertical spacing',
    icon: Move,
    category: 'layout'
  },
  {
    type: 'table-of-contents',
    name: 'Table of Contents',
    description: 'Dynamic TOC with page numbers',
    icon: BookOpen,
    category: 'layout'
  }
]

const categories = [
  { key: 'text', label: 'Text' },
  { key: 'layout', label: 'Layout' },
  { key: 'atomic', label: 'Atomic' },
  { key: 'snippets', label: 'Snippets' }
] as const

interface BlockPaletteProps {
  onInsertBlock: (blockType: Block['type']) => void
  onInsertSnippet?: (snippet: TemplateSnippet) => void
  onDragStart?: (blockType: Block['type']) => void
  onDragEnd?: () => void
  templateSnippets?: TemplateSnippet[]
}

export const BlockPalette = ({ 
  onInsertBlock, 
  onInsertSnippet,
  onDragStart, 
  onDragEnd,
  templateSnippets = []
}: BlockPaletteProps) => {
  const { startDrag, endDrag } = useDragDropContext()

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, blockType: Block['type']) => {
    // Start drag with ghost position
    startDrag(
      { 
        type: 'block-type', 
        blockType,
        sourceElement: e.currentTarget
      },
      { 
        x: e.clientX, 
        y: e.clientY 
      }
    )
    
    // Set drag data for native drag events
    e.dataTransfer.setData('application/x-block-type', blockType)
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

    onDragStart?.(blockType)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    endDrag()
    onDragEnd?.()
  }

  const handleInsertSnippet = (snippet: TemplateSnippet) => {
    onInsertSnippet?.(snippet)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>, blockType: Block['type']) => {
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

  const hasSnippets = templateSnippets.length > 0

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Block Palette</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Add content blocks and patterns
        </p>
      </div>

      {hasSnippets ? (
        <Tabs defaultValue="blocks" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-2 grid w-auto grid-cols-2">
            <TabsTrigger value="blocks" className="text-xs">Blocks</TabsTrigger>
            <TabsTrigger value="snippets" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Snippets
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="blocks" className="flex-1 mt-2">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-6">
                {categories.filter(cat => cat.key !== 'snippets').map(category => {
                  const categoryBlocks = blockTypes.filter(b => b.category === category.key)
                  
                  return (
                    <div key={category.key}>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {category.label}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {categoryBlocks.map(block => (
                          <Button
                            key={block.type}
                            variant="ghost"
                            size="sm"
                            draggable
                            onDragStart={(e) => handleDragStart(e, block.type)}
                            onDragEnd={handleDragEnd}
                            onMouseDown={(e) => handleMouseDown(e, block.type)}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => onInsertBlock(block.type)}
                            className={cn(
                              'w-full justify-start h-auto p-3 hover:bg-accent',
                              'cursor-grab active:cursor-grabbing transition-all duration-150',
                              'group'
                            )}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className="flex items-center gap-2">
                                <GripVertical className="h-3 w-3 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10">
                                  <block.icon className="h-3 w-3 text-primary" />
                                </div>
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-medium text-sm">{block.name}</div>
                                <div className="text-xs text-muted-foreground">{block.description}</div>
                              </div>
                              {block.category === 'atomic' && (
                                <Badge variant="secondary" className="text-xs">
                                  Atomic
                                </Badge>
                              )}
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="snippets" className="flex-1 mt-2">
            <SnippetPalette 
              snippets={templateSnippets}
              onInsertSnippet={handleInsertSnippet}
              onDragStart={(snippet) => {
                // Handle snippet drag start
                console.log('Dragging snippet:', snippet.name)
              }}
              onDragEnd={() => {
                // Handle snippet drag end
                console.log('Snippet drag ended')
              }}
            />
          </TabsContent>
        </Tabs>
      ) : (
        // Original single-column layout when no snippets
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {categories.filter(cat => cat.key !== 'snippets').map(category => {
              const categoryBlocks = blockTypes.filter(b => b.category === category.key)
              
              return (
                <div key={category.key}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {category.label}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {categoryBlocks.map(block => (
                      <Button
                        key={block.type}
                        variant="ghost"
                        size="sm"
                        draggable
                        onDragStart={(e) => handleDragStart(e, block.type)}
                        onDragEnd={handleDragEnd}
                        onMouseDown={(e) => handleMouseDown(e, block.type)}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => onInsertBlock(block.type)}
                        className={cn(
                          'w-full justify-start h-auto p-3 hover:bg-accent',
                          'cursor-grab active:cursor-grabbing transition-all duration-150',
                          'group'
                        )}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-3 w-3 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10">
                              <block.icon className="h-3 w-3 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm">{block.name}</div>
                            <div className="text-xs text-muted-foreground">{block.description}</div>
                          </div>
                          {block.category === 'atomic' && (
                            <Badge variant="secondary" className="text-xs">
                              Atomic
                            </Badge>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}