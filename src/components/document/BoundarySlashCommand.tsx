import { useState, useEffect, useRef, useCallback } from 'react'
import { Block } from '@/lib/document-model'
import { Badge } from '@/components/ui/badge'
import { 
  Hash, 
  Type, 
  List, 
  Quote, 
  Minus, 
  Image, 
  Table2, 
  ArrowRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

interface BoundarySlashCommandProps {
  position: { x: number; y: number }
  query: string
  onSelect: (blockType: Block['type'], scope: 'above' | 'below', content?: any, metadata?: any) => void
  onClose: () => void
  visible: boolean
  blockType?: Block['type']
}

interface CommandItem {
  type: Block['type']
  label: string
  description: string
  icon: React.ReactNode
  keywords: string[]
  defaultContent?: any
  defaultMetadata?: any
}

const COMMANDS: CommandItem[] = [
  {
    type: 'heading',
    label: 'Heading',
    description: 'Large section heading',
    icon: <Hash className="w-4 h-4" />,
    keywords: ['heading', 'h1', 'h2', 'title'],
    defaultContent: 'Heading text',
    defaultMetadata: { level: 2 }
  },
  {
    type: 'paragraph',
    label: 'Paragraph',
    description: 'Plain text paragraph',
    icon: <Type className="w-4 h-4" />,
    keywords: ['paragraph', 'text', 'p'],
    defaultContent: 'Start writing...'
  },
  {
    type: 'ordered-list',
    label: 'Numbered List',
    description: 'Numbered list items',
    icon: <List className="w-4 h-4" />,
    keywords: ['numbered', 'ordered', 'list', 'ol', '1.'],
    defaultContent: ['First item', 'Second item', 'Third item']
  },
  {
    type: 'unordered-list',
    label: 'Bullet List',
    description: 'Bulleted list items',
    icon: <List className="w-4 h-4" />,
    keywords: ['bullet', 'unordered', 'list', 'ul', '•'],
    defaultContent: ['First item', 'Second item', 'Third item']
  },
  {
    type: 'quote',
    label: 'Quote',
    description: 'Highlighted quote block',
    icon: <Quote className="w-4 h-4" />,
    keywords: ['quote', 'blockquote', 'citation'],
    defaultContent: 'Enter your quote here...'
  },
  {
    type: 'figure',
    label: 'Figure',
    description: 'Image with caption',
    icon: <Image className="w-4 h-4" />,
    keywords: ['figure', 'image', 'img', 'picture', 'photo'],
    defaultContent: {
      altText: '',
      caption: '',
      size: 'column-width',
      aspectLock: true
    }
  },
  {
    type: 'table',
    label: 'Table',
    description: 'Data table with headers',
    icon: <Table2 className="w-4 h-4" />,
    keywords: ['table', 'data', 'spreadsheet', 'grid'],
    defaultContent: {
      headers: ['Column 1', 'Column 2', 'Column 3'],
      rows: [
        ['Row 1, Cell 1', 'Row 1, Cell 2', 'Row 1, Cell 3'],
        ['Row 2, Cell 1', 'Row 2, Cell 2', 'Row 2, Cell 3'],
      ],
      caption: 'Table caption',
      number: 1
    }
  },
  {
    type: 'divider',
    label: 'Divider',
    description: 'Horizontal line separator',
    icon: <Minus className="w-4 h-4" />,
    keywords: ['divider', 'separator', 'line', 'hr'],
    defaultContent: '---'
  },
  {
    type: 'spacer',
    label: 'Spacer',
    description: 'Blank vertical space',
    icon: <Minus className="w-4 h-4" />,
    keywords: ['spacer', 'space', 'blank', 'gap'],
    defaultContent: '',
    defaultMetadata: { height: 0.5 }
  }
]

export const BoundarySlashCommand = ({ 
  position, 
  query, 
  onSelect, 
  onClose, 
  visible, 
  blockType 
}: BoundarySlashCommandProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scope, setScope] = useState<'above' | 'below'>('below')
  const menuRef = useRef<HTMLDivElement>(null)

  // Filter commands based on query
  const filteredCommands = COMMANDS.filter(command => {
    if (!query) return true
    const searchTerm = query.toLowerCase()
    return (
      command.label.toLowerCase().includes(searchTerm) ||
      command.description.toLowerCase().includes(searchTerm) ||
      command.keywords.some(keyword => keyword.includes(searchTerm))
    )
  })

  // Reset selection when filtered commands change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredCommands.length, query])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!visible) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (e.shiftKey) {
          // Shift+Down: Change scope to below
          setScope('below')
        } else {
          // Regular Down: Navigate commands
          setSelectedIndex(prev => (prev + 1) % filteredCommands.length)
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (e.shiftKey) {
          // Shift+Up: Change scope to above
          setScope('above')
        } else {
          // Regular Up: Navigate commands
          setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length)
        }
        break
      case 'Tab':
        e.preventDefault()
        // Tab: Toggle scope
        setScope(prev => prev === 'above' ? 'below' : 'above')
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          handleSelect(filteredCommands[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [visible, selectedIndex, filteredCommands, scope, onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const handleSelect = (command: CommandItem) => {
    onSelect(command.type, scope, command.defaultContent, command.defaultMetadata)
    onClose()
  }

  const handleScopeToggle = () => {
    setScope(prev => prev === 'above' ? 'below' : 'above')
  }

  if (!visible || filteredCommands.length === 0) {
    return null
  }

  const getBlockTypeLabel = (type?: Block['type']) => {
    switch (type) {
      case 'figure': return 'Figure'
      case 'table': return 'Table'
      case 'divider': return 'Divider'
      case 'spacer': return 'Spacer'
      case 'heading': return 'Heading'
      case 'paragraph': return 'Paragraph'
      case 'quote': return 'Quote'
      case 'ordered-list': return 'Numbered List'
      case 'unordered-list': return 'Bullet List'
      default: return 'Block'
    }
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg py-2 min-w-80 max-w-96"
      style={{
        left: position.x,
        top: position.y + 24,
        transform: 'translateX(-50%)'
      }}
    >
      {/* Header with scope selector */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground">
            {query ? `Search: "${query}"` : 'Insert block'}
          </div>
          <div className="text-xs text-muted-foreground">
            {blockType && `From ${getBlockTypeLabel(blockType)}`}
          </div>
        </div>
        
        {/* Scope Toggle */}
        <div className="flex items-center gap-2">
          <Badge 
            variant={scope === 'above' ? 'default' : 'outline'} 
            className="text-xs cursor-pointer" 
            onClick={handleScopeToggle}
          >
            <ArrowUp className="w-3 h-3 mr-1" />
            Insert Above
          </Badge>
          <Badge 
            variant={scope === 'below' ? 'default' : 'outline'} 
            className="text-xs cursor-pointer" 
            onClick={handleScopeToggle}
          >
            <ArrowDown className="w-3 h-3 mr-1" />
            Insert Below
          </Badge>
        </div>
      </div>
      
      {/* Commands List */}
      <div className="max-h-64 overflow-y-auto">
        {filteredCommands.map((command, index) => (
          <div
            key={command.type}
            className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
              index === selectedIndex 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-accent/50'
            }`}
            onClick={() => handleSelect(command)}
          >
            <div className="flex-shrink-0 text-muted-foreground">
              {command.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {command.label}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {command.description}
              </div>
            </div>
            
            <div className="flex-shrink-0 text-muted-foreground">
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer with instructions */}
      <div className="px-3 py-1 text-xs text-muted-foreground border-t border-border mt-1">
        ↑↓ navigate • Tab/Shift+↑↓ scope • Enter select • Esc cancel
      </div>
    </div>
  )
}