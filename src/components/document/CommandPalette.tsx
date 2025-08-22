import { useState, useEffect, useCallback } from 'react'
import { Block } from '@/lib/document-model'
import { 
  Hash, 
  Type, 
  List, 
  Quote, 
  Minus, 
  Image, 
  Table2, 
  Search,
  ArrowRight
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsertBlock: (blockType: Block['type'], content?: any, metadata?: any) => void
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

export const CommandPalette = ({ open, onOpenChange, onInsertBlock }: CommandPaletteProps) => {
  const handleSelect = useCallback((command: CommandItem) => {
    onInsertBlock(command.type, command.defaultContent, command.defaultMetadata)
    onOpenChange(false)
  }, [onInsertBlock, onOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search blocks..." />
      <CommandList>
        <CommandEmpty>No blocks found.</CommandEmpty>
        <CommandGroup heading="Insert Block">
          {COMMANDS.map((command) => (
            <CommandItem
              key={command.type}
              value={`${command.label} ${command.description} ${command.keywords.join(' ')}`}
              onSelect={() => handleSelect(command)}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer"
            >
              <div className="flex-shrink-0 text-muted-foreground">
                {command.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">
                  {command.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {command.description}
                </div>
              </div>
              
              <div className="flex-shrink-0 text-muted-foreground">
                <ArrowRight className="w-3 h-3" />
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}