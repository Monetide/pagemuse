import { useState, useRef, useCallback, KeyboardEvent, useEffect } from 'react'
import { Block } from '@/lib/document-model'
import { SlashCommand } from './SlashCommand'

interface EditableTextProps {
  content: string
  placeholder?: string
  className?: string
  onContentChange?: (content: string) => void
  onBlur?: () => void
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void
  onNewBlock?: (blockType: Block['type'], content?: any, metadata?: any) => void
  showInvisibles?: boolean
  autoFocus?: boolean
  multiline?: boolean
}

interface SlashCommandState {
  visible: boolean
  query: string
  position: { x: number; y: number }
}

export const EditableText = ({
  content,
  placeholder = 'Type / for commands',
  className = '',
  onContentChange,
  onBlur,
  onKeyDown,
  onNewBlock,
  showInvisibles = false,
  autoFocus = false,
  multiline = true
}: EditableTextProps) => {
  const [localContent, setLocalContent] = useState(content)
  const [slashCommand, setSlashCommand] = useState<SlashCommandState>({
    visible: false,
    query: '',
    position: { x: 0, y: 0 }
  })
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLocalContent(content)
  }, [content])

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || ''
    setLocalContent(newContent)
    onContentChange?.(newContent)

    // Check for slash command trigger
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const textBefore = newContent.slice(0, range.startOffset)
      const slashMatch = textBefore.match(/\/(\w*)$/)
      
      if (slashMatch && textBefore.length > 0) {
        const [, query] = slashMatch
        const slashIndex = textBefore.lastIndexOf('/')
        
        // Check if slash is at start of line or after whitespace
        const charBeforeSlash = textBefore.slice(slashIndex - 1, slashIndex)
        if (slashIndex === 0 || charBeforeSlash === ' ' || charBeforeSlash === '\n') {
          // Get caret position for menu placement
          const rect = range.getBoundingClientRect()
          
          setSlashCommand({
            visible: true,
            query,
            position: { x: rect.left, y: rect.top }
          })
        }
      } else {
        setSlashCommand(prev => ({ ...prev, visible: false }))
      }
    }
  }, [onContentChange])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    // Handle slash command navigation first
    if (slashCommand.visible) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setSlashCommand(prev => ({ ...prev, visible: false }))
        return
      }
      // Let SlashCommand component handle arrow keys and enter
      return
    }

    // Handle slash trigger
    if (e.key === '/') {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const textBefore = localContent.slice(0, range.startOffset)
        const lastChar = textBefore.slice(-1)
        
        // Only trigger if at start or after whitespace
        if (textBefore.length === 0 || lastChar === ' ' || lastChar === '\n') {
          e.preventDefault()
          
          // Get caret position
          const rect = range.getBoundingClientRect()
          
          setSlashCommand({
            visible: true,
            query: '',
            position: { x: rect.left, y: rect.top }
          })
          return
        }
      }
    }

    // Handle other keys
    if (!multiline && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      textRef.current?.blur()
    }

    onKeyDown?.(e)
  }, [localContent, slashCommand.visible, multiline, onKeyDown])

  const handleSlashCommandSelect = useCallback((blockType: Block['type'], content?: any, metadata?: any) => {
    setSlashCommand(prev => ({ ...prev, visible: false }))
    onNewBlock?.(blockType, content, metadata)
    
    // Clear current content since we're inserting a new block
    setLocalContent('')
    onContentChange?.('')
  }, [onNewBlock, onContentChange])

  const handleSlashCommandClose = useCallback(() => {
    setSlashCommand(prev => ({ ...prev, visible: false }))
  }, [])

  const showPlaceholder = localContent.trim() === ''

  return (
    <div className="relative">
      <div
        ref={textRef}
        contentEditable
        suppressContentEditableWarning
        className={`outline-none ${className} ${
          showPlaceholder ? 'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50' : ''
        }`}
        data-placeholder={showPlaceholder ? placeholder : ''}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        autoFocus={autoFocus}
        style={{
          minHeight: multiline ? '1.2em' : 'auto',
          whiteSpace: multiline ? 'pre-wrap' : 'nowrap'
        }}
      >
        {showInvisibles ? (
          <span>
            {localContent.split('').map((char, index) => {
              if (char === ' ') {
                return (
                  <span key={index} className="text-blue-400/60 font-mono text-xs">
                    ·
                  </span>
                )
              } else if (char === '\n') {
                return (
                  <span key={index}>
                    <span className="text-purple-400/60 font-mono text-xs">¶</span>
                    {char}
                  </span>
                )
              }
              return <span key={index}>{char}</span>
            })}
            {showInvisibles && (
              <span className="text-purple-400/60 font-mono text-xs ml-1">¶</span>
            )}
          </span>
        ) : (
          localContent
        )}
      </div>

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