import { Block } from '@/lib/document-model'
import { Minus, Image, Table } from 'lucide-react'
import { useState, useRef, useCallback, KeyboardEvent } from 'react'
import { SlashCommand } from './SlashCommand'

interface EditableBlockRendererProps {
  block: Block
  className?: string
  onContentChange?: (blockId: string, newContent: any) => void
  onNewBlock?: (afterBlockId: string, type: Block['type'], content?: any, metadata?: any) => void
  onDeleteBlock?: (blockId: string) => void
  isSelected?: boolean
  onSelect?: (blockId: string) => void
}

export const EditableBlockRenderer = ({ 
  block, 
  className = '',
  onContentChange,
  onNewBlock,
  onDeleteBlock,
  isSelected,
  onSelect
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
  const textRef = useRef<HTMLDivElement>(null)
  
  const isChunk = block.metadata?.isChunk
  const chunkIndex = block.metadata?.chunkIndex
  const isTableChunk = block.metadata?.isTableChunk

  const handleClick = useCallback(() => {
    onSelect?.(block.id)
    if (['paragraph', 'heading', 'quote'].includes(block.type)) {
      setIsEditing(true)
    }
  }, [block.id, block.type, onSelect])

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

  const handleBlur = useCallback(() => {
    // Delay hiding to allow slash command interaction
    setTimeout(() => {
      setIsEditing(false)
      setSlashCommand(prev => ({ ...prev, visible: false }))
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
            onInput={(e) => handleContentEdit(e.currentTarget.textContent || '')}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            autoFocus
          >
            {editContent}
          </div>
        ) : (
          <HeadingTag 
            className={`${headingClass} text-foreground mb-2 cursor-text hover:bg-accent/10 rounded px-1 ${isSelected ? 'ring-2 ring-primary' : ''}`}
            onClick={handleClick}
          >
            {block.content || 'Click to edit heading...'}
          </HeadingTag>
        )
      
      case 'paragraph':
        return isEditing ? (
          <div
            ref={textRef}
            contentEditable
            suppressContentEditableWarning
            className="text-sm text-foreground leading-relaxed mb-3 outline-none focus:ring-2 focus:ring-primary rounded px-1 min-h-[1.2em]"
            onInput={(e) => handleContentEdit(e.currentTarget.textContent || '')}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            autoFocus
          >
            {editContent}
          </div>
        ) : (
          <p 
            className={`text-sm text-foreground leading-relaxed mb-3 cursor-text hover:bg-accent/10 rounded px-1 min-h-[1.2em] ${isSelected ? 'ring-2 ring-primary' : ''}`}
            onClick={handleClick}
          >
            {block.content || 'Click to edit paragraph...'}
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
              onInput={(e) => handleContentEdit(e.currentTarget.textContent || '')}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              autoFocus
            >
              {editContent}
            </div>
          </blockquote>
        ) : (
          <blockquote 
            className={`border-l-4 border-accent pl-4 py-2 text-sm text-muted-foreground italic mb-3 bg-muted/20 cursor-text hover:bg-muted/30 rounded-r ${isSelected ? 'ring-2 ring-primary' : ''}`}
            onClick={handleClick}
          >
            "{block.content || 'Click to edit quote...'}"
          </blockquote>
        )
      
      case 'ordered-list':
        const orderedItems = Array.isArray(block.content) ? block.content : [block.content]
        return (
          <ol className={`list-decimal list-inside text-sm text-foreground space-y-1 mb-3 ml-2 cursor-pointer hover:bg-accent/10 rounded px-1 ${isSelected ? 'ring-2 ring-primary' : ''}`} onClick={handleClick}>
            {orderedItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ol>
        )
      
      case 'unordered-list':
        const unorderedItems = Array.isArray(block.content) ? block.content : [block.content]
        return (
          <ul className={`list-disc list-inside text-sm text-foreground space-y-1 mb-3 ml-2 cursor-pointer hover:bg-accent/10 rounded px-1 ${isSelected ? 'ring-2 ring-primary' : ''}`} onClick={handleClick}>
            {unorderedItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )
      
      case 'figure':
        const figureData = block.content || {}
        return (
          <figure className={`mb-4 p-2 border border-border rounded bg-muted/10 cursor-pointer hover:bg-muted/20 ${isSelected ? 'ring-2 ring-primary' : ''}`} onClick={handleClick}>
            <div className="flex items-center justify-center bg-muted/20 border border-dashed border-muted-foreground/30 rounded mb-2" 
                 style={{ height: `${(block.metadata?.imageHeight || 2) * 24}px` }}>
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Image className="w-8 h-8" />
                <span className="text-xs">{figureData.imageUrl || 'Image placeholder'}</span>
                <span className="text-xs opacity-60">{block.metadata?.imageHeight || 2}" tall</span>
              </div>
            </div>
            {figureData.caption && (
              <figcaption className="text-xs text-center text-muted-foreground italic mt-2">
                <strong>Figure {figureData.number || '1'}:</strong> {figureData.caption}
              </figcaption>
            )}
          </figure>
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
            <div className={`border border-border rounded overflow-hidden bg-background cursor-pointer hover:bg-muted/10 ${isSelected ? 'ring-2 ring-primary' : ''}`} onClick={handleClick}>
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
                        <td key={cellIndex} className="px-2 py-1 border-r border-border last:border-r-0">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tableData.caption && (
              <div className="text-xs text-center text-muted-foreground italic mt-2">
                <strong>Table {tableData.number || '1'}:</strong> {tableData.caption}
              </div>
            )}
          </div>
        )
      
      case 'divider':
        return (
          <div className={`flex justify-center my-4 cursor-pointer hover:bg-accent/10 rounded p-2 ${isSelected ? 'ring-2 ring-primary' : ''}`} onClick={handleClick}>
            <Minus className="w-12 h-px text-border" />
          </div>
        )
      
      case 'spacer':
        const height = block.metadata?.height || 0.5
        return (
          <div 
            className={`w-full bg-transparent cursor-pointer hover:bg-accent/10 rounded border border-dashed border-transparent hover:border-accent/30 ${isSelected ? 'ring-2 ring-primary' : ''}`}
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
    </div>
  )
}