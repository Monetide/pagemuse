import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Bold, 
  Italic, 
  Underline, 
  Link,
  Quote,
  List,
  ListOrdered,
  Type
} from 'lucide-react'
import { Block } from '@/lib/document-model'

interface FormattingToolbarProps {
  position: { x: number; y: number }
  visible: boolean
  selectedText: string
  onFormat: (format: string, value?: any) => void
  onBlockTypeChange: (type: Block['type'], metadata?: any) => void
  onClose: () => void
}

export const FormattingToolbar = ({
  position,
  visible,
  selectedText,
  onFormat,
  onBlockTypeChange,
  onClose
}: FormattingToolbarProps) => {
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [visible, onClose])

  const handleFormat = useCallback((command: string, value?: string) => {
    onFormat(command, value)
  }, [onFormat])

  const handleHeadingChange = useCallback((level: number) => {
    onBlockTypeChange('heading', { level })
  }, [onBlockTypeChange])

  const handleListChange = useCallback((type: 'ordered-list' | 'unordered-list') => {
    // Convert current text to list items
    const items = selectedText.split('\n').filter(line => line.trim()).map(line => line.trim())
    onBlockTypeChange(type, { items })
  }, [onBlockTypeChange, selectedText])

  const handleQuote = useCallback(() => {
    onBlockTypeChange('quote')
  }, [onBlockTypeChange])

  if (!visible) {
    return null
  }

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg p-1 flex items-center gap-1"
      style={{
        left: position.x,
        top: position.y - 50, // Position above the selection
        transform: 'translateX(-50%)'
      }}
    >
      {/* Heading Levels */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleHeadingChange(1)}
          className="h-8 px-2 text-xs font-bold"
          title="Heading 1"
        >
          H1
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleHeadingChange(2)}
          className="h-8 px-2 text-xs font-semibold"
          title="Heading 2"
        >
          H2
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleHeadingChange(3)}
          className="h-8 px-2 text-xs font-medium"
          title="Heading 3"
        >
          H3
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Text Formatting */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFormat('bold')}
          className="h-8 w-8 p-0"
          title="Bold"
        >
          <Bold className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFormat('italic')}
          className="h-8 w-8 p-0"
          title="Italic"
        >
          <Italic className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFormat('underline')}
          className="h-8 w-8 p-0"
          title="Underline"
        >
          <Underline className="w-3 h-3" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Block Types */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleListChange('unordered-list')}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleListChange('ordered-list')}
          className="h-8 w-8 p-0"
          title="Numbered List"
        >
          <ListOrdered className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleQuote}
          className="h-8 w-8 p-0"
          title="Quote"
        >
          <Quote className="w-3 h-3" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Additional Formatting */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = prompt('Enter URL:')
            if (url) {
              handleFormat('createLink', url)
            }
          }}
          className="h-8 w-8 p-0"
          title="Add Link"
        >
          <Link className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}