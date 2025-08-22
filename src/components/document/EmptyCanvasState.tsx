import { useState } from 'react'
import { EditableText } from './EditableText'
import { Block } from '@/lib/document-model'

interface EmptyCanvasStateProps {
  onNewBlock?: (afterBlockId: string, type: Block['type'], content?: any, metadata?: any) => void
  sectionId: string
  documentTitle?: string
  onTitleChange?: (newTitle: string) => void
}

export const EmptyCanvasState = ({ 
  onNewBlock, 
  sectionId, 
  documentTitle = "Untitled Document",
  onTitleChange 
}: EmptyCanvasStateProps) => {
  const [titleContent, setTitleContent] = useState(documentTitle)
  const [hasStartedTyping, setHasStartedTyping] = useState(false)

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

  return (
    <div className="min-h-[400px] p-8 space-y-6">
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
  )
}