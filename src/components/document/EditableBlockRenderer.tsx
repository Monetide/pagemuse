import { Block } from '@/lib/document-model'
import { Minus, Image, Table } from 'lucide-react'
import { useState, useRef, useCallback, KeyboardEvent } from 'react'
import { SlashCommand } from './SlashCommand'
import { FormattingToolbar } from './FormattingToolbar'
import { TextInvisibles, InvisibleMarkers } from './TextInvisibles'
import { FigureBlock } from './FigureBlock'
import { BoundarySlashCommand } from './BoundarySlashCommand'

interface EditableBlockRendererProps {
  block: Block
  className?: string
  onContentChange?: (blockId: string, newContent: any) => void
  onNewBlock?: (afterBlockId: string, type: Block['type'], content?: any, metadata?: any) => void
  onDeleteBlock?: (blockId: string) => void
  onBlockTypeChange?: (blockId: string, type: Block['type'], metadata?: any) => void
  isSelected?: boolean
  onSelect?: (blockId: string) => void
  showInvisibles?: boolean
}

export const EditableBlockRenderer = ({ 
  block, 
  className = '',
  onContentChange,
  onNewBlock,
  onDeleteBlock,
  onBlockTypeChange,
  isSelected,
  onSelect,
  showInvisibles = false
}: EditableBlockRendererProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(block.content)
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
  const textRef = useRef<HTMLDivElement>(null)
  
  const isChunk = block.metadata?.isChunk
  const chunkIndex = block.metadata?.chunkIndex
  const isTableChunk = block.metadata?.isTableChunk

  const handleClick = useCallback(() => {
    onSelect?.(block.id)
    
    // For non-text blocks, set up boundary slash command handling
    if (!['paragraph', 'heading', 'quote'].includes(block.type)) {
      // Enable keyboard events for boundary slash commands
      const blockElement = document.getElementById(`block-${block.id}`)
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
    setEditContent(newContent)
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
    } else if (e.key === 'Backspace' && !editContent.toString().trim()) {
      e.preventDefault()
      onDeleteBlock?.(block.id)
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setSlashCommand(prev => ({ ...prev, visible: false }))
    }
  }, [block.id, editContent, onNewBlock, onDeleteBlock, slashCommand.visible])

  const handleSlashCommandSelect = useCallback((blockType: Block['type'], content?: any, metadata?: any) => {
    // Replace the slash and query with empty string
    const currentText = editContent.toString()
    const slashIndex = currentText.lastIndexOf('/')
    if (slashIndex !== -1) {
      const beforeSlash = currentText.substring(0, slashIndex)
      setEditContent(beforeSlash)
      onContentChange?.(block.id, beforeSlash)
    }
    
    // Insert new block after current one
    onNewBlock?.(block.id, blockType, content, metadata)
    setSlashCommand(prev => ({ ...prev, visible: false }))
  }, [editContent, block.id, onContentChange, onNewBlock])

  const handleSlashCommandClose = useCallback(() => {
    setSlashCommand(prev => ({ ...prev, visible: false }))
  }, [])

  const handleFormat = useCallback((command: string, value?: string) => {
    if (!textRef.current) return

    // Apply formatting using document.execCommand (legacy but still works for basic formatting)
    document.execCommand(command, false, value)
    
    // Update content after formatting
    const newContent = textRef.current.textContent || ''
    setEditContent(newContent)
    onContentChange?.(block.id, newContent)
    
    // Hide toolbar after applying format
    setFormattingToolbar(prev => ({ ...prev, visible: false }))
  }, [block.id, onContentChange])

  const handleBlockTypeChange = useCallback((newType: Block['type'], metadata?: any) => {
    if (!onBlockTypeChange) return
    
    // Get current content or selected text
    const content = formattingToolbar.selectedText || editContent
    onBlockTypeChange(block.id, newType, metadata)
    
    // Hide toolbar
    setFormattingToolbar(prev => ({ ...prev, visible: false }))
    setIsEditing(false)
  }, [block.id, onBlockTypeChange, formattingToolbar.selectedText, editContent])

  const handleFormattingToolbarClose = useCallback(() => {
    setFormattingToolbar(prev => ({ ...prev, visible: false }))
  }, [])

  const handleBoundaryKeyDown = useCallback((e: KeyboardEvent) => {
    // Handle boundary slash commands for non-text blocks
    if (e.key === '/' && isSelected && !isEditing) {
      e.preventDefault()
      
      // Get the position of the selected block
      const blockElement = document.getElementById(`block-${block.id}`)
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
        const level = block.metadata?.level || 1
        const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements
        const headingClass = level === 1 ? 'text-xl font-bold' : level === 2 ? 'text-lg font-semibold' : 'text-base font-medium'
        
        return isEditing ? (
          <div
            ref={textRef}
            contentEditable
            suppressContentEditableWarning
            className={`${headingClass} text-foreground mb-2 outline-none focus:ring-2 focus:ring-primary rounded px-1`}
            data-placeholder="Type / for commands"
            onInput={(e) => handleContentEdit(e.currentTarget.textContent || '')}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onMouseUp={handleMouseUp}
            autoFocus
          >
            {editContent}
          </div>
        ) : (
          <HeadingTag 
            className={`${headingClass} text-foreground mb-2 cursor-text hover:bg-accent/10 rounded px-1 ${isSelected ? 'ring-2 ring-primary' : ''}`}
            data-placeholder="Type / for commands"
            onClick={handleClick}
          >
            <TextInvisibles
              text={block.content || ''}
              showInvisibles={showInvisibles}
            />
            <InvisibleMarkers
              showInvisibles={showInvisibles}
              lineCount={block.content ? block.content.split('\n').length : 1}
            />
          </HeadingTag>
        )
      
      case 'paragraph':
        return isEditing ? (
          <div
            ref={textRef}
            contentEditable
            suppressContentEditableWarning
            className="text-sm text-foreground leading-relaxed mb-3 outline-none focus:ring-2 focus:ring-primary rounded px-1 min-h-[1.2em]"
            data-placeholder="Type / for commands"
            onInput={(e) => handleContentEdit(e.currentTarget.textContent || '')}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onMouseUp={handleMouseUp}
              autoFocus
          >
            {editContent}
          </div>
        ) : (
          <p 
            className={`text-sm text-foreground leading-relaxed mb-3 cursor-text hover:bg-accent/10 rounded px-1 min-h-[1.2em] ${isSelected ? 'ring-2 ring-primary' : ''}`}
            data-placeholder="Type / for commands"
            onClick={handleClick}
          >
            <TextInvisibles
              text={block.content || ''}
              showInvisibles={showInvisibles}
            />
            <InvisibleMarkers
              showInvisibles={showInvisibles}
              lineCount={block.content ? block.content.split('\n').length : 1}
              hasWidowOrphan={block.content && (
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
              className="text-muted-foreground outline-none focus:ring-2 focus:ring-primary rounded px-1 min-h-[1.2em]"
              data-placeholder="Type / for commands"
              onInput={(e) => handleContentEdit(e.currentTarget.textContent || '')}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onMouseUp={handleMouseUp}
            autoFocus
            >
              {editContent}
            </div>
          </blockquote>
        ) : (
          <blockquote 
            className={`border-l-4 border-accent pl-4 py-2 text-sm text-muted-foreground italic mb-3 bg-muted/20 cursor-text hover:bg-muted/30 rounded-r ${isSelected ? 'ring-2 ring-primary' : ''}`}
            data-placeholder="Type / for commands"
            onClick={handleClick}
          >
            "<TextInvisibles
              text={block.content || ''}
              showInvisibles={showInvisibles}
            />"
            <InvisibleMarkers
              showInvisibles={showInvisibles}
              lineCount={block.content ? block.content.split('\n').length : 1}
            />
          </blockquote>
        )
      
      case 'ordered-list':
        const orderedItems = Array.isArray(block.content) ? block.content : [block.content]
        return (
          <ol className={`list-decimal list-inside text-sm text-foreground space-y-1 mb-3 ml-2 cursor-pointer hover:bg-accent/10 rounded px-1 ${isSelected ? 'ring-2 ring-primary' : ''}`} onClick={handleClick}>
            {orderedItems.map((item, index) => (
              <li key={index} className="relative">
                {isEditing && index === 0 ? (
                  <div
                    ref={textRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="inline outline-none focus:ring-2 focus:ring-primary rounded px-1"
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
        const unorderedItems = Array.isArray(block.content) ? block.content : [block.content]
        return (
          <ul className={`list-disc list-inside text-sm text-foreground space-y-1 mb-3 ml-2 cursor-pointer hover:bg-accent/10 rounded px-1 ${isSelected ? 'ring-2 ring-primary' : ''}`} onClick={handleClick}>
            {unorderedItems.map((item, index) => (
              <li key={index} className="relative">
                {isEditing && index === 0 ? (
                  <div
                    ref={textRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="inline outline-none focus:ring-2 focus:ring-primary rounded px-1"
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
            id={`block-${block.id}`}
            tabIndex={0}
            onKeyDown={handleBoundaryKeyDown}
            className="outline-none"
          >
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
        const tableData = block.content || { headers: [], rows: [] }
        return (
          <div className="mb-4">
            {isTableChunk && chunkIndex! > 0 && (
              <div className="text-xs text-accent font-medium mb-2 flex items-center gap-1">
                <Table className="w-3 h-3" />
                Table continued from previous page/column
              </div>
            )}
            <div 
              id={`block-${block.id}`}
              tabIndex={0}
              onKeyDown={handleBoundaryKeyDown}
              className={`border border-border rounded overflow-hidden bg-background cursor-pointer hover:bg-muted/10 outline-none ${isSelected ? 'ring-2 ring-primary' : ''}`} 
              onClick={handleClick}
            >
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    {(tableData.headers || []).map((header: string, index: number) => (
                      <th key={index} className="px-2 py-1 text-left font-semibold border-r border-border last:border-r-0">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(tableData.rows || []).map((row: string[], rowIndex: number) => (
                    <tr key={rowIndex} className="border-t border-border hover:bg-muted/20">
                      {row.map((cell, cellIndex) => (
                        <td 
                          key={cellIndex} 
                          className="px-2 py-1 border-r border-border last:border-r-0 cursor-text hover:bg-accent/10 relative"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Enable cell editing with slash commands
                          }}
                        >
                          <div 
                            className={`min-h-[1em]`}
                            data-placeholder="Type / for commands"
                          >
                            <TextInvisibles text={cell} showInvisibles={showInvisibles} />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tableData.caption && (
              <div 
                className={`text-xs text-center text-muted-foreground italic mt-2 cursor-text hover:bg-accent/10 rounded px-1`}
                data-placeholder="Type / for commands"
                onClick={(e) => {
                  e.stopPropagation()
                  // Enable caption editing
                }}
              >
                <TextInvisibles text={`Table ${tableData.number || '1'}: ${tableData.caption}`} showInvisibles={showInvisibles} />
              </div>
            )}
          </div>
        )
      
      case 'divider':
        return (
          <div 
            id={`block-${block.id}`}
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
            id={`block-${block.id}`}
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
    <div className={`block-content ${className} relative`}>
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
    </div>
  )
}