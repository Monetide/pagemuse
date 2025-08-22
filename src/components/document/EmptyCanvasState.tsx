import { useState, useCallback } from 'react'
import { EditableText } from './EditableText'
import { PasteAutoStructureOverlay } from './PasteAutoStructureOverlay'
import { Block } from '@/lib/document-model'

interface EmptyCanvasStateProps {
  onNewBlock?: (afterBlockId: string, type: Block['type'], content?: any, metadata?: any) => void
  onMultipleBlocks?: (blocks: Block[]) => void
  sectionId: string
  documentTitle?: string
  onTitleChange?: (newTitle: string) => void
}

export const EmptyCanvasState = ({ 
  onNewBlock, 
  onMultipleBlocks,
  sectionId, 
  documentTitle = "Untitled Document",
  onTitleChange 
}: EmptyCanvasStateProps) => {
  const [titleContent, setTitleContent] = useState(documentTitle)
  const [hasStartedTyping, setHasStartedTyping] = useState(false)
  const [pasteOverlay, setPasteOverlay] = useState<{
    visible: boolean
    content: string
  }>({
    visible: false,
    content: ''
  })

  const handleTitleChange = (content: string) => {
    setTitleContent(content)
    onTitleChange?.(content)
    if (content.trim() && !hasStartedTyping) {
      setHasStartedTyping(true)
    }
  }

  const handleBodyInput = (content: string) => {
    if (content.trim()) {
      // User started typing in the body, create a paragraph block
      onNewBlock?.('create-first', 'paragraph', content, { sectionId })
    }
  }

  const handleNewBlock = (blockType: Block['type'], content?: any, metadata?: any) => {
    // When user selects a block type, create it
    onNewBlock?.('create-first', blockType, content, { sectionId, ...metadata })
  }

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const pastedText = e.clipboardData.getData('text/plain')
    
    // For new/near-empty docs, show overlay for large pastes (>1,000 chars)
    if (pastedText.length > 1000) {
      e.preventDefault()
      setPasteOverlay({
        visible: true,
        content: pastedText
      })
    }
    // For smaller pastes, let default behavior work
  }, [])

  const handlePasteOverlayConfirm = useCallback((blocks: Block[]) => {
    setPasteOverlay({ visible: false, content: '' })
    
    if (blocks.length === 1) {
      onNewBlock?.('create-first', blocks[0].type, blocks[0].content, { sectionId, ...blocks[0].metadata })
    } else if (blocks.length > 1) {
      // Insert multiple blocks sequentially starting from create-first
      let currentAfterId = 'create-first'
      blocks.forEach((block, index) => {
        onNewBlock?.(currentAfterId, block.type, block.content, { sectionId, ...block.metadata })
        // For subsequent blocks, update the afterId to maintain order
        currentAfterId = block.id || `block-${index}`
      })
    }
  }, [onNewBlock, sectionId])

  const handlePasteOverlayClose = useCallback(() => {
    setPasteOverlay({ visible: false, content: '' })
  }, [])

  return (
    <>
      <div className="min-h-[400px] p-8 space-y-6" onPaste={handlePaste}>
        {/* Title placeholder */}
        <div className="space-y-2">
          <EditableText
            content={titleContent}
            placeholder="Document Title"
            className="text-3xl font-bold text-foreground border-none outline-none resize-none w-full"
            onContentChange={handleTitleChange}
            multiline={false}
          />
        </div>

        {/* Hint text for body */}
        <div className="space-y-2">
          <EditableText
            content=""
            placeholder="Type to start • Press '/' for blocks • Paste to import"
            className="text-base text-foreground border-none outline-none resize-none w-full min-h-[1.5em]"
            onContentChange={handleBodyInput}
            onNewBlock={handleNewBlock}
            autoFocus={hasStartedTyping}
            multiline={true}
          />
        </div>

        {/* Subtle help text */}
        <div className="text-sm text-muted-foreground/70 mt-8">
          <p>Start typing to create your first paragraph, or press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">/</kbd> to insert blocks like headings, lists, and more.</p>
        </div>
      </div>

      {/* Paste Auto-structure Overlay */}
      <PasteAutoStructureOverlay
        isOpen={pasteOverlay.visible}
        pastedContent={pasteOverlay.content}
        onConfirm={handlePasteOverlayConfirm}
        onClose={handlePasteOverlayClose}
      />
    </>
  )
}