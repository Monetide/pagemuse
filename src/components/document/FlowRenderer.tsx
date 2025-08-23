import { Flow, Section } from '@/lib/document-model'
import { DocumentRenderer } from './DocumentRenderer'
import { cn } from '@/lib/utils'

interface FlowRendererProps {
  flow: Flow
  section: Section
  isEditing?: boolean
  selectedBlockId?: string
  showInvisibles?: boolean
  readingWidth?: 'optimal' | 'comfortable' | 'maximum' | 'full'
  onBlockSelect?: (blockId: string) => void
  onBlockChange?: (blockId: string, newContent: any) => void
  className?: string
}

/**
 * FlowRenderer - Renders a single flow with its blocks
 * Enforces Flow Ownership by only rendering blocks from flows
 */
export const FlowRenderer = ({
  flow,
  section,
  isEditing = false,
  selectedBlockId,
  showInvisibles = false,
  readingWidth = 'optimal',
  onBlockSelect,
  onBlockChange,
  className
}: FlowRendererProps) => {
  if (!flow.blocks || flow.blocks.length === 0) {
    return (
      <div 
        id={`flow-${flow.id}`}
        className={cn(
          "flow-container empty-flow",
          className
        )}
        data-flow-id={flow.id}
        data-section-id={section.id}
        data-flow-name={flow.name}
        data-block-count={0}
      >
        {isEditing && (
          <div className="text-muted-foreground text-center py-8">
            <p className="text-sm">Empty flow: {flow.name}</p>
            <p className="text-xs mt-1">Click to add content</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div 
      id={`flow-${flow.id}`}
      className={cn(
        "flow-container",
        flow.type === 'grid' && "flow-grid",
        flow.type === 'branching' && "flow-branching",
        className
      )}
      data-flow-id={flow.id}
      data-section-id={section.id}
      data-flow-name={flow.name}
      data-block-count={flow.blocks.length}
    >
      {/* Flow header - only shown in editing mode for non-main flows */}
      {isEditing && flow.name !== 'Main' && (
        <div className="flow-header mb-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            Flow: {flow.name}
          </h4>
        </div>
      )}
      
      <DocumentRenderer
        blocks={flow.blocks}
        isEditing={isEditing}
        selectedBlockId={selectedBlockId}
        showInvisibles={showInvisibles}
        readingWidth={readingWidth}
        onBlockSelect={onBlockSelect}
        onBlockChange={onBlockChange}
        className="flow-content"
      />
    </div>
  )
}