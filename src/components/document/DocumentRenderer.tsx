import { Block } from '@/lib/document-model'
import { BlockRenderer } from './BlockRenderer'
import { CalloutBlock } from './CalloutBlock'
import { FigureBlock } from './FigureBlock'
import { TableEditor } from './TableEditor'
import { cn } from '@/lib/utils'

interface DocumentRendererProps {
  blocks: Block[]
  isEditing?: boolean
  selectedBlockId?: string
  showInvisibles?: boolean
  readingWidth?: 'optimal' | 'comfortable' | 'maximum' | 'full'
  onBlockSelect?: (blockId: string) => void
  onBlockChange?: (blockId: string, newContent: any) => void
  className?: string
}

const READING_WIDTH_CLASSES = {
  optimal: 'optimal-reading',
  comfortable: 'comfortable-reading', 
  maximum: 'maximum-reading',
  full: 'w-full'
} as const

export const DocumentRenderer = ({
  blocks,
  isEditing = false,
  selectedBlockId,
  showInvisibles = false,
  readingWidth = 'optimal',
  onBlockSelect,
  onBlockChange,
  className
}: DocumentRendererProps) => {
  const renderBlock = (block: Block) => {
    const isSelected = selectedBlockId === block.id
    const commonProps = {
      key: block.id,
      block,
      isSelected,
      isEditing,
      showInvisibles,
      onSelect: onBlockSelect,
      onContentChange: onBlockChange
    }

    // Handle special block types with custom components
    switch (block.type) {
      case 'callout':
        return <CalloutBlock {...commonProps} />
      
      case 'figure':
        return (
          <FigureBlock 
            data={block.content}
            isSelected={isSelected}
            isEditing={isEditing}
            showInvisibles={showInvisibles}
            onDataChange={(data) => onBlockChange?.(block.id, data)}
            onEditToggle={() => {/* handle edit toggle */}}
            onClick={() => onBlockSelect?.(block.id)}
          />
        )
      
      case 'table':
        return <TableEditor {...commonProps} />
      
      default:
        return <BlockRenderer {...commonProps} />
    }
  }

  return (
    <div 
      className={cn(
        "document-container document-content",
        READING_WIDTH_CLASSES[readingWidth],
        className
      )}
      role="document"
    >
      {blocks.length === 0 ? (
        <div className="text-muted-foreground text-center py-12">
          <p className="text-lg">Start writing your document...</p>
          <p className="text-sm mt-2">Click here to add your first block</p>
        </div>
      ) : (
        blocks
          .sort((a, b) => a.order - b.order)
          .map(renderBlock)
      )}
    </div>
  )
}