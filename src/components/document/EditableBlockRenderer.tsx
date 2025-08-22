import { Block, SemanticDocument } from '@/lib/document-model'
import { Minus, Image, Table, FileText, BookOpen } from 'lucide-react'
import { FootnoteInserter } from './FootnoteInserter'
import { TOCRenderer } from './TOCRenderer'
import { LayoutResult } from '@/lib/layout-engine'
import { useState, useRef, useCallback, KeyboardEvent, useEffect } from 'react'
import { SlashCommand } from './SlashCommand'
import { FormattingToolbar } from './FormattingToolbar'
import { TextInvisibles, InvisibleMarkers } from './TextInvisibles'
import { FigureBlock } from './FigureBlock'
import { TableEditor } from './TableEditor'
import { ChartBlock } from './ChartBlock'
import { BoundarySlashCommand } from './BoundarySlashCommand'
import { CrossReference } from './CrossReference'
import { CrossReferenceInserter } from './CrossReferenceInserter'
import { useCrossReferences } from '@/hooks/useCrossReferences'
import { PasteAutoStructureOverlay } from './PasteAutoStructureOverlay'

interface EditableBlockRendererProps {
  block: Block
  document?: SemanticDocument | null
  layoutResults?: Map<string, LayoutResult>
  className?: string
  onContentChange?: (blockId: string, newContent: any) => void
  onNewBlock?: (afterBlockId: string, type: Block['type'], content?: any, metadata?: any) => void
  onMultipleBlocks?: (afterBlockId: string, blocks: Block[]) => void
  onDeleteBlock?: (blockId: string) => void
  onBlockTypeChange?: (blockId: string, type: Block['type'], metadata?: any) => void
  isSelected?: boolean
  onSelect?: (blockId: string) => void
  onTOCEntryClick?: (blockId: string, sectionId: string) => void
  showInvisibles?: boolean
  sectionId: string
  flowId: string
  index: number
}

export const EditableBlockRenderer = ({ 
  block, 
  document,
  layoutResults,
  className = '',
  onContentChange,
  onNewBlock,
  onMultipleBlocks,
  onDeleteBlock,
  onBlockTypeChange,
  isSelected,
  onSelect,
  onTOCEntryClick,
  showInvisibles = false,
  sectionId,
  flowId,
  index
}: EditableBlockRendererProps) => {
  const [isEditing, setIsEditing] = useState(false)
const initialText = typeof block.content === 'string' ? block.content : (block.content as any)?.text || ''
const [editContent, setEditContent] = useState(initialText)
  const [slashCommand, setSlashCommand] = useState<{
    visible: boolean
    query: string
    position: { x: number; y: number }
  }>({
    visible: false,
    query: '',
    position: { x: 0, y: 0 }
  })
  const [formattingToolbar, setFormattingToolbar] = useState<{
    visible: boolean
    position: { x: number; y: number }
    selectedText: string
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    selectedText: ''
  })
  const [boundarySlashCommand, setBoundarySlashCommand] = useState<{
    visible: boolean
    query: string
    position: { x: number; y: number }
  }>({
    visible: false,
    query: '',
    position: { x: 0, y: 0 }
  })
  const [crossRefInserter, setCrossRefInserter] = useState<{
    visible: boolean
    position: { x: number; y: number }
  }>({
    visible: false,
    position: { x: 0, y: 0 }
  })
  const [pasteOverlay, setPasteOverlay] = useState<{
    visible: boolean
    content: string
  }>({
    visible: false,
    content: ''
  })
  const [footnoteInserter, setFootnoteInserter] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)
  const seededRef = useRef(false)
  
  const { getElementById, referenceableElements } = useCrossReferences(document)
  
  // Seed contentEditable only once on edit start to avoid caret jump
  useEffect(() => {
    if (isEditing) {
      if (textRef.current && !seededRef.current) {
        const value = typeof block.content === 'string' ? block.content : (block.content as any)?.text || ''
        textRef.current.textContent = value
        seededRef.current = true
      }
    } else {
      seededRef.current = false
    }
  }, [isEditing])
  
  // Get the current element's label if it's referenceable
  const currentElement = referenceableElements.find(el => el.id === block.id)
  
  const isChunk = block.metadata?.isChunk
  const chunkIndex = block.metadata?.chunkIndex
  const isTableChunk = block.metadata?.isTableChunk

  const handleClick = useCallback(() => {
    onSelect?.(block.id)
    
    // For non-text blocks, set up boundary slash command handling
    if (!['paragraph', 'heading', 'quote'].includes(block.type)) {
      // Enable keyboard events for boundary slash commands
      const blockElement = globalThis.document.getElementById(`block-${block.id}`)
      if (blockElement) {
        blockElement.focus()
      }
    } else if (['paragraph', 'heading', 'quote'].includes(block.type)) {
      setIsEditing(true)
    }
  }, [block.id, block.type, onSelect])

  const handleMouseUp = useCallback(() => {
    if (!isEditing || !textRef.current) return

    const selection = window.getSelection()
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      
      setFormattingToolbar({
        visible: true,
        position: {
          x: rect.left + (rect.width / 2),
          y: rect.top
        },
        selectedText: selection.toString()
      })
    } else {
      setFormattingToolbar(prev => ({ ...prev, visible: false }))
    }
  }, [isEditing])

  const handleContentEdit = useCallback((newContent: string) => {
    onContentChange?.(block.id, newContent)
    
    // Check for slash command
    const lastChar = newContent[newContent.length - 1]
    if (lastChar === '/' && textRef.current) {
      const rect = textRef.current.getBoundingClientRect()
      const selection = window.getSelection()
      const range = selection?.getRangeAt(0)
      
      if (range) {
        const rangeRect = range.getBoundingClientRect()
        setSlashCommand({
          visible: true,
          query: '',
          position: {
            x: rangeRect.left || rect.left + 20,
            y: rangeRect.bottom || rect.bottom + 5
          }
        })
      }
    } else if (slashCommand.visible) {
      // Check if we're still typing after the slash
      const slashIndex = newContent.lastIndexOf('/')
      if (slashIndex !== -1) {
        const query = newContent.substring(slashIndex + 1)
        setSlashCommand(prev => ({
          ...prev,
          query
        }))
      } else {
        // No slash found, hide menu
        setSlashCommand(prev => ({
          ...prev,
          visible: false
        }))
      }
    }
  }, [block.id, onContentChange, slashCommand.visible])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // If slash command is visible, let it handle the keys
    if (slashCommand.visible && ['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) {
      return // Let SlashCommand component handle these
    }
    
    if (e.key === 'Enter' && !e.shiftKey && !slashCommand.visible) {
      e.preventDefault()
      onNewBlock?.(block.id, 'paragraph')
      setIsEditing(false)
      setSlashCommand(prev => ({ ...prev, visible: false }))
    } else if (e.key === 'Backspace') {
      const currentText = textRef.current?.textContent || ''
      if (!currentText.trim()) {
        e.preventDefault()
        onDeleteBlock?.(block.id)
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setSlashCommand(prev => ({ ...prev, visible: false }))
    }
  }, [block.id, onNewBlock, onDeleteBlock, slashCommand.visible])

  const handleSlashCommandSelect = useCallback((blockType: Block['type'], content?: any, metadata?: any) => {
    if (blockType === 'cross-reference') {
      // Show cross-reference inserter instead of creating a block directly
      setCrossRefInserter({
        visible: true,
        position: slashCommand.position
      })
      setSlashCommand(prev => ({ ...prev, visible: false }))
      return
    }

    if (blockType === 'footnote') {
      // Show footnote inserter instead of creating a block directly
      setFootnoteInserter(true)
      setSlashCommand(prev => ({ ...prev, visible: false }))
      return
    }

    // Replace the slash and query with empty string
    const currentText = textRef.current?.textContent || ''
    const slashIndex = currentText.lastIndexOf('/')
    if (slashIndex !== -1) {
      const beforeSlash = currentText.substring(0, slashIndex)
      if (textRef.current) textRef.current.textContent = beforeSlash
      onContentChange?.(block.id, beforeSlash)
    }
    
    // Insert new block after current one
    onNewBlock?.(block.id, blockType, content, metadata)
    setSlashCommand(prev => ({ ...prev, visible: false }))
  }, [block.id, onContentChange, onNewBlock, slashCommand.position])

  const handleSlashCommandClose = useCallback(() => {
    setSlashCommand(prev => ({ ...prev, visible: false }))
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const pastedText = e.clipboardData.getData('text/plain')
    
    // Only show overlay for large pastes (>100 characters) with structure indicators
    const hasStructure = pastedText.includes('\n\n') || 
                         pastedText.match(/^#+\s/m) || 
                         pastedText.match(/^\s*[-*+]\s/m) ||
                         pastedText.match(/^\s*\d+\.\s/m) ||
                         pastedText.includes('|') ||
                         pastedText.match(/^>/m)
    
    if (pastedText.length > 100 && hasStructure) {
      e.preventDefault()
      setPasteOverlay({
        visible: true,
        content: pastedText
      })
    }
    // For smaller pastes or unstructured content, let default paste behavior work
  }, [])

  const handlePasteOverlayConfirm = useCallback((blocks: Block[]) => {
    setPasteOverlay({ visible: false, content: '' })
    
    if (blocks.length === 1) {
      onNewBlock?.(block.id, blocks[0].type, blocks[0].content, blocks[0].metadata)
    } else if (blocks.length > 1) {
      onMultipleBlocks?.(block.id, blocks)
    }
  }, [block.id, onNewBlock, onMultipleBlocks])

  const handlePasteOverlayClose = useCallback(() => {
    setPasteOverlay({ visible: false, content: '' })
  }, [])

  const handleFormat = useCallback((command: string, value?: string) => {
    if (!textRef.current) return

    // Apply formatting using document.execCommand (legacy but still works for basic formatting)
    globalThis.document.execCommand(command, false, value)
    
    // Update content after formatting
    const newContent = textRef.current.textContent || ''
    onContentChange?.(block.id, newContent)
    
    // Hide toolbar after applying format
    setFormattingToolbar(prev => ({ ...prev, visible: false }))
  }, [block.id, onContentChange])

  const handleBlockTypeChange = useCallback((newType: Block['type'], metadata?: any) => {
    if (!onBlockTypeChange) return
    onBlockTypeChange(block.id, newType, metadata)
    // Hide toolbar
    setFormattingToolbar(prev => ({ ...prev, visible: false }))
    setIsEditing(false)
  }, [block.id, onBlockTypeChange])

  const handleFormattingToolbarClose = useCallback(() => {
    setFormattingToolbar(prev => ({ ...prev, visible: false }))
  }, [])

  const handleBoundaryKeyDown = useCallback((e: KeyboardEvent) => {
    // Handle boundary slash commands for non-text blocks
    if (e.key === '/' && isSelected && !isEditing) {
      e.preventDefault()
      
      // Get the position of the selected block
      const blockElement = globalThis.document.getElementById(`block-${block.id}`)
      if (blockElement) {
        const rect = blockElement.getBoundingClientRect()
        
        setBoundarySlashCommand({
          visible: true,
          query: '',
          position: { 
            x: rect.left + rect.width / 2, 
            y: rect.bottom 
          }
        })
      }
    } else if (boundarySlashCommand.visible) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setBoundarySlashCommand(prev => ({ ...prev, visible: false }))
      }
      // Let BoundarySlashCommand handle other keys
    }
  }, [block.id, isSelected, isEditing, boundarySlashCommand.visible])

  const handleBoundarySlashCommandSelect = useCallback((
    blockType: Block['type'], 
    scope: 'above' | 'below', 
    content?: any, 
    metadata?: any
  ) => {
    setBoundarySlashCommand(prev => ({ ...prev, visible: false }))
    
    if (scope === 'above') {
      // Insert before current block (use previous block's ID or special handling)
      onNewBlock?.(block.id, blockType, content, { ...metadata, insertBefore: true })
    } else {
      // Insert after current block
      onNewBlock?.(block.id, blockType, content, metadata)
    }
  }, [block.id, onNewBlock])

  const handleBoundarySlashCommandClose = useCallback(() => {
    setBoundarySlashCommand(prev => ({ ...prev, visible: false }))
  }, [])

  const handleCrossRefInsert = useCallback((targetId: string, type: 'see' | 'reference' | 'page', format: 'full' | 'number-only' | 'title-only') => {
    const crossRefContent = { targetId, type, format }
    onNewBlock?.(block.id, 'cross-reference', crossRefContent)
    setCrossRefInserter({ visible: false, position: { x: 0, y: 0 } })
  }, [block.id, onNewBlock])

  const handleCrossRefClose = useCallback(() => {
    setCrossRefInserter({ visible: false, position: { x: 0, y: 0 } })
  }, [])

  const handleFootnoteInsert = useCallback((content: string) => {
    // Create footnote marker in current text and footnote block
    const footnoteId = crypto.randomUUID()
    const marker = { id: crypto.randomUUID(), number: 1, footnoteId }
    
    // Add footnote marker to current block's metadata
    const currentContent = textRef.current?.textContent || ''
    const updatedMetadata = {
      ...block.metadata,
      footnoteMarkers: [...(block.metadata?.footnoteMarkers || []), marker]
    }
    
    // Update current block content and metadata
    onContentChange?.(block.id, currentContent)
    
    // Create footnote block
    onNewBlock?.(block.id, 'footnote', { id: footnoteId, number: 1, content }, { isFootnote: true })
    
    setFootnoteInserter(false)
  }, [block.id, block.metadata, onContentChange, onNewBlock])

  const handleFootnoteClose = useCallback(() => {
    setFootnoteInserter(false)
  }, [])

  const handleBlur = useCallback(() => {
    // Delay hiding to allow toolbar interaction
    setTimeout(() => {
      setIsEditing(false)
      setSlashCommand(prev => ({ ...prev, visible: false }))
      setFormattingToolbar(prev => ({ ...prev, visible: false }))
    }, 200)
  }, [])

  const renderEditableContent = () => {
    switch (block.type) {
      case 'heading':
        const level = (block.metadata?.level ?? ((typeof block.content === 'object' && (block.content as any)?.level) || 1))
        const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements
        const headingClass = level === 1 ? 'text-xl font-bold' : level === 2 ? 'text-lg font-semibold' : 'text-base font-medium'
        
        return isEditing ? (
          <div className="relative">
            {currentElement && (
              <div className="absolute -left-16 top-0 text-xs text-muted-foreground font-medium">
                {currentElement.number}
              </div>
            )}
            <div
              ref={textRef}
              contentEditable
              suppressContentEditableWarning
              dir="ltr"
              role="textbox"
              aria-label={`Edit ${HeadingTag} heading`}
              aria-level={level}
              className={`${headingClass} text-foreground mb-2 outline-none focus:ring-2 focus:ring-primary rounded px-1 text-left`}
              data-placeholder="Type / for commands"
              onInput={(e) => handleContentEdit(e.currentTarget.textContent || '')}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onBlur={handleBlur}
              onMouseUp={handleMouseUp}
              autoFocus
            ></div>
          </div>
        ) : (
          <div className="relative">
            {currentElement && (
              <div className="absolute -left-16 top-0 text-xs text-muted-foreground font-medium">
                {currentElement.number}
              </div>
            )}
            <HeadingTag 
              className={`${headingClass} text-foreground mb-2 cursor-text hover:bg-accent/10 rounded px-1 ${isSelected ? 'ring-2 ring-primary' : ''}`}
              data-placeholder="Type / for commands"
              onClick={handleClick}
              role="heading"
              aria-level={level}
              tabIndex={0}
            >
              <TextInvisibles
                text={typeof block.content === 'string' ? block.content : (block.content as any)?.text || ''}
                showInvisibles={showInvisibles}
              />
            <InvisibleMarkers
              showInvisibles={showInvisibles}
              lineCount={block.content && typeof block.content === 'string' ? block.content.split('\n').length : 1}
            />
            </HeadingTag>
          </div>
        )
      
      case 'paragraph':
        return isEditing ? (
          <div
            ref={textRef}
            contentEditable
            suppressContentEditableWarning
            dir="ltr"
            role="textbox"
            aria-label="Edit paragraph text"
            className="text-sm text-foreground leading-relaxed mb-3 outline-none focus:ring-2 focus:ring-primary rounded px-1 min-h-[1.2em] text-left"
            data-placeholder="Type / for commands"
            onInput={(e) => handleContentEdit(e.currentTarget.textContent || '')}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onMouseUp={handleMouseUp}
              autoFocus
            >
            </div>
        ) : (
          <p 
            className={`text-sm text-foreground leading-relaxed mb-3 cursor-text hover:bg-accent/10 rounded px-1 min-h-[1.2em] ${isSelected ? 'ring-2 ring-primary' : ''}`}
            data-placeholder="Type / for commands"
            onClick={handleClick}
            tabIndex={0}
            role="paragraph"
            aria-label="Paragraph"
          >
            <TextInvisibles
              text={typeof block.content === 'string' ? block.content : (block.content as any)?.text || ''}
              showInvisibles={showInvisibles}
            />
            <InvisibleMarkers
              showInvisibles={showInvisibles}
              lineCount={block.content && typeof block.content === 'string' ? block.content.split('\n').length : 1}
              hasWidowOrphan={block.content && typeof block.content === 'string' && (
                block.content.split('\n').length === 1 || // Single line (orphan)
                block.content.split(' ').length < 4       // Short line (widow)
              )}
            />
          </p>
        )
      
      case 'quote':
        return isEditing ? (
          <blockquote className="border-l-4 border-accent pl-4 py-2 text-sm italic mb-3 bg-muted/20">
            <div
              ref={textRef}
              contentEditable
              suppressContentEditableWarning
              dir="ltr"
              className="text-muted-foreground outline-none focus:ring-2 focus:ring-primary rounded px-1 min-h-[1.2em] text-left"
              data-placeholder="Type / for commands"
              onInput={(e) => handleContentEdit(e.currentTarget.textContent || '')}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onMouseUp={handleMouseUp}
            autoFocus
            >
            </div>
          </blockquote>
        ) : (
          <blockquote 
            className={`border-l-4 border-accent pl-4 py-2 text-sm text-muted-foreground italic mb-3 bg-muted/20 cursor-text hover:bg-muted/30 rounded-r ${isSelected ? 'ring-2 ring-primary' : ''}`}
            data-placeholder="Type / for commands"
            onClick={handleClick}
          >
            "<TextInvisibles
              text={typeof block.content === 'string' ? block.content : (block.content as any)?.text || ''}
              showInvisibles={showInvisibles}
            />"
            <InvisibleMarkers
              showInvisibles={showInvisibles}
              lineCount={block.content && typeof block.content === 'string' ? block.content.split('\n').length : 1}
            />
          </blockquote>
        )
      
      case 'ordered-list':
        const orderedItems = Array.isArray(block.content)
          ? block.content
          : (Array.isArray((block.content as any)?.items)
            ? (block.content as any).items
            : [typeof block.content === 'string' ? block.content : ''])
        return (
          <ol 
            className={`list-decimal list-inside text-sm text-foreground space-y-1 mb-3 ml-2 cursor-pointer hover:bg-accent/10 rounded px-1 ${isSelected ? 'ring-2 ring-primary' : ''}`} 
            onClick={handleClick}
            role="list"
            aria-label={`Ordered list with ${orderedItems.length} items`}
            tabIndex={0}
          >
            {orderedItems.map((item, index) => (
              <li key={index} className="relative" role="listitem" aria-setsize={orderedItems.length} aria-posinset={index + 1}>
                {isEditing && index === 0 ? (
                  <div
                    ref={textRef}
                    contentEditable
                    suppressContentEditableWarning
                    dir="ltr"
                    role="textbox"
                    aria-label={`Edit list item ${index + 1}`}
                    className="inline outline-none focus:ring-2 focus:ring-primary rounded px-1 text-left"
                    data-placeholder="Type / for commands"
                    onInput={(e) => {
                      const newItems = [...orderedItems]
                      newItems[0] = e.currentTarget.textContent || ''
                      onContentChange?.(block.id, newItems)
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    autoFocus
                  >
                    {item || ''}
                  </div>
                ) : (
                  <TextInvisibles text={item || ''} showInvisibles={showInvisibles} />
                )}
              </li>
            ))}
          </ol>
        )
      
      case 'unordered-list':
        const unorderedItems = Array.isArray(block.content)
          ? block.content
          : (Array.isArray((block.content as any)?.items)
            ? (block.content as any).items
            : [typeof block.content === 'string' ? block.content : ''])
        return (
          <ul 
            className={`list-disc list-inside text-sm text-foreground space-y-1 mb-3 ml-2 cursor-pointer hover:bg-accent/10 rounded px-1 ${isSelected ? 'ring-2 ring-primary' : ''}`} 
            onClick={handleClick}
            role="list"
            aria-label={`Unordered list with ${unorderedItems.length} items`}
            tabIndex={0}
          >
            {unorderedItems.map((item, index) => (
              <li key={index} className="relative" role="listitem" aria-setsize={unorderedItems.length} aria-posinset={index + 1}>
                {isEditing && index === 0 ? (
                  <div
                    ref={textRef}
                    contentEditable
                    suppressContentEditableWarning
                    dir="ltr"
                    role="textbox"
                    aria-label={`Edit list item ${index + 1}`}
                    className="inline outline-none focus:ring-2 focus:ring-primary rounded px-1 text-left"
                    data-placeholder="Type / for commands"
                    onInput={(e) => {
                      const newItems = [...unorderedItems]
                      newItems[0] = e.currentTarget.textContent || ''
                      onContentChange?.(block.id, newItems)
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    autoFocus
                  >
                    {item || ''}
                  </div>
                ) : (
                  <TextInvisibles text={item || ''} showInvisibles={showInvisibles} />
                )}
              </li>
            ))}
          </ul>
        )
      
      case 'figure':
        const figureData = block.content || {}
        return (
          <div
            tabIndex={0}
            onKeyDown={handleBoundaryKeyDown}
            className="outline-none relative"
          >
            {currentElement && (
              <div className="absolute -left-16 top-2 text-xs text-muted-foreground font-medium">
                {currentElement.label}
              </div>
            )}
            <FigureBlock
              data={figureData}
              isSelected={isSelected}
              isEditing={isEditing}
              showInvisibles={showInvisibles}
              onDataChange={(newData) => onContentChange?.(block.id, newData)}
              onEditToggle={() => setIsEditing(!isEditing)}
              onClick={handleClick}
            />
          </div>
        )
      
      case 'table':
        return (
          <div
            tabIndex={0}
            onKeyDown={handleBoundaryKeyDown}
            className="outline-none relative"
          >
            {currentElement && (
              <div className="absolute -left-16 top-2 text-xs text-muted-foreground font-medium">
                {currentElement.label}
              </div>
            )}
            <TableEditor
              block={block}
              isSelected={isSelected}
              onContentChange={(newContent) => onContentChange?.(block.id, newContent)}
            />
          </div>
        )
      
      case 'cross-reference':
        return (
          <div className={`my-2 ${isSelected ? 'ring-2 ring-primary rounded' : ''}`} onClick={handleClick}>
            <CrossReference
              content={block.content}
              document={document}
              className="text-sm"
            />
          </div>
        )
      
      case 'chart':
        const chartData = block.content || {}
        return (
          <div
            tabIndex={0}
            onKeyDown={handleBoundaryKeyDown}
            className="outline-none relative"
          >
            {currentElement && (
              <div className="absolute -left-16 top-2 text-xs text-muted-foreground font-medium">
                {currentElement.label}
              </div>
            )}
            <ChartBlock
              data={chartData}
              isSelected={isSelected}
              isEditing={isEditing}
              showInvisibles={showInvisibles}
              onDataChange={(newData) => onContentChange?.(block.id, newData)}
              onEditToggle={() => setIsEditing(!isEditing)}
              onClick={handleClick}
            />
          </div>
        )
      
      case 'footnote':
        const footnoteData = block.content || {}
        return (
          <div 
            className={`footnote-block mb-2 text-xs border-l-2 border-accent pl-2 bg-muted/10 rounded-r cursor-pointer hover:bg-muted/20 p-2 ${isSelected ? 'ring-2 ring-primary' : ''}`}
            onClick={handleClick}
            tabIndex={0}
            onKeyDown={handleBoundaryKeyDown}
            id={`block-${block.id}`}
          >
            <div className="flex items-start gap-2">
              <FileText className="w-3 h-3 mt-0.5 text-accent flex-shrink-0" />
              <div>
                <div className="font-medium text-foreground mb-1">
                  Footnote {footnoteData.number || '?'}
                </div>
                <div className="text-muted-foreground">
                  {footnoteData.content || 'Footnote content'}
                </div>
              </div>
            </div>
          </div>
        )

      case 'table-of-contents':
        return (
          <div 
            className={`toc-block cursor-pointer hover:bg-accent/10 rounded p-2 ${isSelected ? 'ring-2 ring-primary' : ''}`}
            onClick={handleClick}
            tabIndex={0}
            onKeyDown={handleBoundaryKeyDown}
            id={`block-${block.id}`}
          >
            <TOCRenderer
              block={block}
              document={document}
              layoutResults={layoutResults}
              currentSectionId={sectionId}
              onEntryClick={onTOCEntryClick}
            />
          </div>
        )

      case 'divider':
        return (
          <div 
            tabIndex={0}
            onKeyDown={handleBoundaryKeyDown}
            className={`flex justify-center my-4 cursor-pointer hover:bg-accent/10 rounded p-2 outline-none ${isSelected ? 'ring-2 ring-primary' : ''}`} 
            onClick={handleClick}
          >
            <Minus className="w-12 h-px text-border" />
          </div>
        )
      
      case 'spacer':
        const height = block.metadata?.height || 0.5
        return (
          <div 
            tabIndex={0}
            onKeyDown={handleBoundaryKeyDown}
            className={`w-full bg-transparent cursor-pointer hover:bg-accent/10 rounded border border-dashed border-transparent hover:border-accent/30 outline-none ${isSelected ? 'ring-2 ring-primary' : ''}`}
            style={{ height: `${height * 24}px` }}
            onClick={handleClick}
          />
        )
      
      default:
        return (
          <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded border border-dashed">
            Unknown block type: {block.type}
          </div>
        )
    }
  }

  return (
    <div id={`block-${block.id}`} data-block-id={block.id} data-block-type={block.type} data-block-index={index} data-flow-id={flowId} data-section-id={sectionId} className={`block-content ${className} relative`}>
      {(isChunk || isTableChunk) && (
        <div className="text-xs text-accent font-medium mb-1 flex items-center gap-1">
          <span className="w-2 h-2 bg-accent rounded-full" />
          {isTableChunk 
            ? `Table continued (part ${chunkIndex! + 1})`
            : `Continued from previous column (part ${chunkIndex! + 1})`
          }
        </div>
      )}
      {renderEditableContent()}
      
      {/* Slash Command Menu */}
      <SlashCommand
        position={slashCommand.position}
        query={slashCommand.query}
        visible={slashCommand.visible}
        onSelect={handleSlashCommandSelect}
        onClose={handleSlashCommandClose}
      />
      
      {/* Boundary Slash Command Menu */}
      <BoundarySlashCommand
        position={boundarySlashCommand.position}
        query={boundarySlashCommand.query}
        visible={boundarySlashCommand.visible}
        onSelect={handleBoundarySlashCommandSelect}
        onClose={handleBoundarySlashCommandClose}
        blockType={block.type}
      />
      
      {/* Formatting Toolbar */}
      <FormattingToolbar
        position={formattingToolbar.position}
        visible={formattingToolbar.visible}
        selectedText={formattingToolbar.selectedText}
        onFormat={handleFormat}
        onBlockTypeChange={handleBlockTypeChange}
        onClose={handleFormattingToolbarClose}
      />
      {/* Cross-reference inserter */}
      {crossRefInserter.visible && (
        <CrossReferenceInserter
          document={document}
          position={crossRefInserter.position}
          visible={crossRefInserter.visible}
          onSelect={handleCrossRefInsert}
          onClose={handleCrossRefClose}
        />
      )}
      
      <FootnoteInserter
        isOpen={footnoteInserter}
        onClose={handleFootnoteClose}
        onInsert={handleFootnoteInsert}
      />

      {/* Paste Auto-structure Overlay */}
      <PasteAutoStructureOverlay
        isOpen={pasteOverlay.visible}
        pastedContent={pasteOverlay.content}
        onConfirm={handlePasteOverlayConfirm}
        onClose={handlePasteOverlayClose}
      />
    </div>
  )
}