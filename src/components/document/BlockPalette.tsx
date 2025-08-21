import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Type,
  AlignLeft,
  List,
  ListOrdered,
  Quote,
  Minus,
  Square,
  Image,
  Table,
  AlertCircle,
  GripVertical,
} from 'lucide-react'

export interface BlockType {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  category: string
}

const blockTypes: BlockType[] = [
  {
    id: 'heading',
    name: 'Heading',
    icon: Type,
    description: 'Section title',
    category: 'Text'
  },
  {
    id: 'paragraph',
    name: 'Paragraph',
    icon: AlignLeft,
    description: 'Plain text',
    category: 'Text'
  },
  {
    id: 'ordered-list',
    name: 'Ordered List',
    icon: ListOrdered,
    description: 'Numbered list',
    category: 'Text'
  },
  {
    id: 'unordered-list',
    name: 'Bullet List',
    icon: List,
    description: 'Bulleted list',
    category: 'Text'
  },
  {
    id: 'quote',
    name: 'Quote',
    icon: Quote,
    description: 'Blockquote',
    category: 'Text'
  },
  {
    id: 'divider',
    name: 'Divider',
    icon: Minus,
    description: 'Section break',
    category: 'Layout'
  },
  {
    id: 'spacer',
    name: 'Spacer',
    icon: Square,
    description: 'Vertical space',
    category: 'Layout'
  },
  {
    id: 'figure',
    name: 'Figure',
    icon: Image,
    description: 'Image with caption',
    category: 'Media'
  },
  {
    id: 'table',
    name: 'Table',
    icon: Table,
    description: 'Data table',
    category: 'Media'
  },
  {
    id: 'callout',
    name: 'Callout',
    icon: AlertCircle,
    description: 'Important note',
    category: 'Text'
  }
]

const categories = ['Text', 'Layout', 'Media']

interface DraggableBlockItemProps {
  blockType: BlockType
  onClick: () => void
}

function DraggableBlockItem({ blockType, onClick }: DraggableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `palette-${blockType.id}`,
    data: {
      type: 'block-type',
      blockType: blockType.id,
    },
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined

  const Icon = blockType.icon

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={onClick}
    >
      <div
        className="cursor-grab hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </div>
      
      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{blockType.name}</div>
        <div className="text-xs text-muted-foreground truncate">
          {blockType.description}
        </div>
      </div>
    </div>
  )
}

interface BlockPaletteProps {
  onInsertBlock: (blockType: string) => void
  onDragStart?: (blockType: string) => void
  onDragEnd?: () => void
}

export function BlockPalette({ onInsertBlock, onDragStart, onDragEnd }: BlockPaletteProps) {
  const [activeBlockType, setActiveBlockType] = useState<string | null>(null)

  function handleDragStart(event: DragStartEvent) {
    const blockType = event.active.data.current?.blockType
    if (blockType) {
      setActiveBlockType(blockType)
      onDragStart?.(blockType)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveBlockType(null)
    onDragEnd?.()
  }

  const activeBlock = activeBlockType 
    ? blockTypes.find(b => b.id === activeBlockType)
    : null

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-sm">Block Palette</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Drag to canvas or click to insert
          </p>
        </div>

        {/* Block Categories */}
        <div className="flex-1 overflow-auto">
          {categories.map(category => {
            const categoryBlocks = blockTypes.filter(b => b.category === category)
            
            return (
              <div key={category} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {categoryBlocks.map(blockType => (
                    <DraggableBlockItem
                      key={blockType.id}
                      blockType={blockType}
                      onClick={() => onInsertBlock(blockType.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeBlock && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-primary bg-background shadow-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
              <activeBlock.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="font-medium text-sm">{activeBlock.name}</div>
              <div className="text-xs text-muted-foreground">
                {activeBlock.description}
              </div>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}