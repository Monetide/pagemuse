import { SemanticDocument, Block } from '@/lib/document-model'
import { useViewMode } from '@/contexts/ViewModeContext'
import { ScreenModeRenderer } from './ScreenModeRenderer'
import { EditorCanvas } from './EditorCanvas'
import { StickyMiniTOC } from './StickyMiniTOC'
import { LayoutResult } from '@/lib/layout-engine'

interface ViewModeAwareDocumentRendererProps {
  document: SemanticDocument
  layoutResults?: Map<string, LayoutResult>
  selectedBlockId?: string
  selectedSectionId?: string
  onBlockSelect?: (blockId: string) => void
  onSectionSelect?: (sectionId: string) => void
  onContentChange?: (blockId: string, newContent: any) => void
  onNewBlock?: (afterBlockId: string, type: Block['type'], content?: any, metadata?: any) => void
  onDeleteBlock?: (blockId: string) => void
  onBlockTypeChange?: (blockId: string, type: Block['type'], metadata?: any) => void
  showInvisibles?: boolean
  showPageOverlays?: boolean
  showRulers?: boolean
  showSnapGuides?: boolean
  showBaseline?: boolean
}

export const ViewModeAwareDocumentRenderer = ({
  document,
  layoutResults,
  selectedBlockId,
  selectedSectionId,
  onBlockSelect,
  onSectionSelect,
  onContentChange,
  onNewBlock,
  onDeleteBlock,
  onBlockTypeChange,
  showInvisibles = false,
  showPageOverlays = false,
  showRulers = false,
  showSnapGuides = false,
  showBaseline = false
}: ViewModeAwareDocumentRendererProps) => {
  const { viewMode, preferences } = useViewMode()

  if (viewMode === 'screen') {
    return (
      <div className="relative">
        <ScreenModeRenderer
          document={document}
          layoutResults={layoutResults}
          selectedBlockId={selectedBlockId}
          onBlockSelect={onBlockSelect}
          onContentChange={onContentChange}
          onNewBlock={onNewBlock}
          onDeleteBlock={onDeleteBlock}
          onBlockTypeChange={onBlockTypeChange}
          showInvisibles={showInvisibles}
        />
        
        {/* Sticky mini TOC for wide viewports */}
        {preferences.stickyTOC && window.innerWidth > 1200 && (
          <StickyMiniTOC
            document={document}
            layoutResults={layoutResults}
          />
        )}
      </div>
    )
  }

  // Print mode - use existing EditorCanvas with current section
  const currentSection = document.sections.find(s => s.id === selectedSectionId) || document.sections[0]
  
  return (
    <EditorCanvas
      section={currentSection}
      document={document}
      selectedBlockId={selectedBlockId}
      onBlockSelect={onBlockSelect}
      onContentChange={onContentChange}
      onNewBlock={onNewBlock}
      onDeleteBlock={onDeleteBlock}
      onBlockTypeChange={onBlockTypeChange}
    />
  )
}