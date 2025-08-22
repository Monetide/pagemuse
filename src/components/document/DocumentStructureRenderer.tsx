import { SemanticDocument } from '@/lib/document-model'
import { SectionRenderer } from './SectionRenderer'
import { cn } from '@/lib/utils'

interface DocumentStructureRendererProps {
  document: SemanticDocument
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

/**
 * DocumentStructureRenderer - Renders the complete document structure
 * Enforces Flow Ownership - Document → Section → Flow → Block hierarchy
 */
export const DocumentStructureRenderer = ({
  document,
  isEditing = false,
  selectedBlockId,
  showInvisibles = false,
  readingWidth = 'optimal',
  onBlockSelect,
  onBlockChange,
  className
}: DocumentStructureRendererProps) => {
  if (!document.sections || document.sections.length === 0) {
    return (
      <div 
        className={cn(
          "document-container document-content empty-document",
          READING_WIDTH_CLASSES[readingWidth],
          className
        )}
        role="document"
      >
        <div className="text-muted-foreground text-center py-12">
          <p className="text-lg">Start writing your document...</p>
          <p className="text-sm mt-2">Click here to add your first section</p>
        </div>
      </div>
    )
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
      {/* Render all sections in the document */}
      {document.sections
        .sort((a, b) => a.order - b.order)
        .map(section => (
          <SectionRenderer
            key={section.id}
            section={section}
            isEditing={isEditing}
            selectedBlockId={selectedBlockId}
            showInvisibles={showInvisibles}
            readingWidth={readingWidth}
            onBlockSelect={onBlockSelect}
            onBlockChange={onBlockChange}
            className="document-section-wrapper"
          />
        ))}
    </div>
  )
}