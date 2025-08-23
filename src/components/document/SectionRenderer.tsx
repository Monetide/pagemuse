import { Section } from '@/lib/document-model'
import { FlowRenderer } from './FlowRenderer'
import { cn } from '@/lib/utils'

interface SectionRendererProps {
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
 * SectionRenderer - Renders a section with all its flows
 * Enforces Flow Ownership - blocks can only exist within flows, never directly in sections
 */
export const SectionRenderer = ({
  section,
  isEditing = false,
  selectedBlockId,
  showInvisibles = false,
  readingWidth = 'optimal',
  onBlockSelect,
  onBlockChange,
  className
}: SectionRendererProps) => {
  // Schema guard: Warn if section has orphaned blocks (shouldn't happen with migration)
  if ((section as any).blocks) {
    console.warn(`Section "${section.name}" has orphaned blocks - these should be migrated to flows`, (section as any).blocks)
  }

  if (!section.flows || section.flows.length === 0) {
    return (
    <section 
      id={`section-${section.id}`}
      className={cn(
        "document-section empty-section",
        className
      )}
      data-section-id={section.id}
      data-section-name={section.name}
    >
        {isEditing && (
          <div className="text-muted-foreground text-center py-12">
            <p className="text-lg">Empty section: {section.name}</p>
            <p className="text-sm mt-2">This section has no flows. Click to add content.</p>
          </div>
        )}
      </section>
    )
  }

  return (
    <section 
      id={`section-${section.id}`}
      className={cn(
        "document-section",
        section.layoutIntent && `layout-${section.layoutIntent}`,
        className
      )}
      data-section-id={section.id}
      data-section-name={section.name}
      data-layout-intent={section.layoutIntent}
    >
      {/* Section header - only shown in editing mode for multi-section documents */}
      {isEditing && section.name !== 'Main Section' && (
        <div className="section-header mb-6">
          <h3 className="text-lg font-semibold text-foreground">
            {section.name}
          </h3>
          {section.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {section.description}
            </p>
          )}
        </div>
      )}
      
      {/* Render all flows in the section */}
      <div className="section-flows">
        {section.flows
          .sort((a, b) => a.order - b.order)
          .map(flow => (
            <FlowRenderer
              key={flow.id}
              flow={flow}
              section={section}
              isEditing={isEditing}
              selectedBlockId={selectedBlockId}
              showInvisibles={showInvisibles}
              readingWidth={readingWidth}
              onBlockSelect={onBlockSelect}
              onBlockChange={onBlockChange}
              className="section-flow"
            />
          ))}
      </div>
    </section>
  )
}