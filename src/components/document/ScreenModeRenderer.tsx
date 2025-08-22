import { SemanticDocument, Section, Block } from '@/lib/document-model'
import { useViewMode } from '@/contexts/ViewModeContext'
import { EditableBlockRenderer } from './EditableBlockRenderer'
import { LayoutResult } from '@/lib/layout-engine'
import { useTOCNavigation } from '@/hooks/useTOCNavigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ScreenModeRendererProps {
  document: SemanticDocument
  layoutResults?: Map<string, LayoutResult>
  selectedBlockId?: string
  onBlockSelect?: (blockId: string) => void
  onContentChange?: (blockId: string, newContent: any) => void
  onNewBlock?: (afterBlockId: string, type: Block['type'], content?: any, metadata?: any) => void
  onDeleteBlock?: (blockId: string) => void
  onBlockTypeChange?: (blockId: string, type: Block['type'], metadata?: any) => void
  showInvisibles?: boolean
}

export const ScreenModeRenderer = ({
  document,
  layoutResults,
  selectedBlockId,
  onBlockSelect,
  onContentChange,
  onNewBlock,
  onDeleteBlock,
  onBlockTypeChange,
  showInvisibles = false
}: ScreenModeRendererProps) => {
  const { jumpToHeading } = useTOCNavigation()

  const handleTOCEntryClick = (blockId: string, sectionId: string) => {
    jumpToHeading(blockId, sectionId)
  }

  const renderSection = (section: Section, sectionIndex: number) => {
    // Flatten all blocks from all flows in reading order
    const allBlocks: (Block & { sectionId: string; flowId: string })[] = []
    
    section.flows
      .sort((a, b) => a.order - b.order)
      .forEach(flow => {
        flow.blocks
          .sort((a, b) => a.order - b.order)
          .forEach(block => {
            allBlocks.push({
              ...block,
              sectionId: section.id,
              flowId: flow.id
            })
          })
      })

    return (
      <div key={section.id} className="screen-section">
        {/* Section Header */}
        {sectionIndex > 0 && (
          <div className="section-divider mb-8 mt-12">
            <Card className="border-l-4 border-l-primary bg-muted/20">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    Section {sectionIndex + 1}
                  </Badge>
                  <h2 className="text-xl font-semibold">{section.name}</h2>
                </div>
                {section.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {section.description}
                  </p>
                )}
                <Separator className="mt-4" />
              </div>
            </Card>
          </div>
        )}

        {/* Section Content */}
        <div className="section-content space-y-4 max-w-none">
          {allBlocks.map((block, blockIndex) => (
            <div key={block.id} id={`block-${block.id}`} className="block-container">
              <EditableBlockRenderer
                block={block}
                document={document}
                layoutResults={layoutResults}
                className=""
                onContentChange={onContentChange}
                onNewBlock={onNewBlock}
                onMultipleBlocks={onNewBlock ? (afterBlockId: string, blocks: Block[]) => {
                  // Insert multiple blocks sequentially
                  let currentAfterId = afterBlockId
                  blocks.forEach((newBlock, index) => {
                    onNewBlock(currentAfterId, newBlock.type, newBlock.content, newBlock.metadata)
                    // For subsequent blocks, we'll need to find the newly created block ID
                    // This is a simplified approach - in a real implementation, we'd need proper ID tracking
                    if (index < blocks.length - 1) {
                      currentAfterId = `${currentAfterId}-${index}`
                    }
                  })
                } : undefined}
                onDeleteBlock={onDeleteBlock}
                onBlockTypeChange={onBlockTypeChange}
                isSelected={selectedBlockId === block.id}
                onSelect={onBlockSelect}
                onTOCEntryClick={handleTOCEntryClick}
                showInvisibles={showInvisibles}
                sectionId={block.sectionId}
                flowId={block.flowId}
                index={blockIndex}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="screen-mode-container min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Document Title */}
        <div className="document-header mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {document.title}
          </h1>
          {document.description && (
            <p className="text-lg text-muted-foreground">
              {document.description}
            </p>
          )}
        </div>

        {/* Sections */}
        <div className="document-content space-y-0">
          {document.sections
            .sort((a, b) => a.order - b.order)
            .map((section, index) => renderSection(section, index))}
        </div>
      </div>
    </div>
  )
}