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
  ArrowRight,
  Upload,
  Play
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
  onImportContent?: () => void
  onValidateDocument?: () => void
}

interface CommandItem {
  type: Block['type'] | 'import' | 'validate'
  label: string
  description: string
  icon: React.ReactNode
  keywords: string[]
  defaultContent?: any
  defaultMetadata?: any
  action?: 'insert' | 'import' | 'validate'
}

const BLOCK_COMMANDS: CommandItem[] = [
  {
    type: 'heading',
    label: 'Heading',
    description: 'Large section heading',
    icon: <Hash className="w-4 h-4" />,
    keywords: ['heading', 'h1', 'h2', 'title'],
    defaultContent: 'Heading text',
    defaultMetadata: { level: 2 },
    action: 'insert'
  },
  {
    type: 'paragraph',
    label: 'Paragraph',
    description: 'Plain text paragraph',
    icon: <Type className="w-4 h-4" />,
    keywords: ['paragraph', 'text', 'p'],
    defaultContent: 'Start writing...',
    action: 'insert'
  },
  {
    type: 'ordered-list',
    label: 'Numbered List',
    description: 'Numbered list items',
    icon: <List className="w-4 h-4" />,
    keywords: ['numbered', 'ordered', 'list', 'ol', '1.'],
    defaultContent: ['First item', 'Second item', 'Third item'],
    action: 'insert'
  },
  {
    type: 'unordered-list',
    label: 'Bullet List',
    description: 'Bulleted list items',
    icon: <List className="w-4 h-4" />,
    keywords: ['bullet', 'unordered', 'list', 'ul', '•'],
    defaultContent: ['First item', 'Second item', 'Third item'],
    action: 'insert'
  },
  {
    type: 'quote',
    label: 'Quote',
    description: 'Highlighted quote block',
    icon: <Quote className="w-4 h-4" />,
    keywords: ['quote', 'blockquote', 'citation'],
    defaultContent: 'Enter your quote here...',
    action: 'insert'
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
    },
    action: 'insert'
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
    },
    action: 'insert'
  },
  {
    type: 'divider',
    label: 'Divider',
    description: 'Horizontal line separator',
    icon: <Minus className="w-4 h-4" />,
    keywords: ['divider', 'separator', 'line', 'hr'],
    defaultContent: '---',
    action: 'insert'
  },
  {
    type: 'spacer',
    label: 'Spacer',
    description: 'Blank vertical space',
    icon: <Minus className="w-4 h-4" />,
    keywords: ['spacer', 'space', 'blank', 'gap'],
    defaultContent: '',
    defaultMetadata: { height: 0.5 },
    action: 'insert'
  }
]

const ACTION_COMMANDS: CommandItem[] = [
  {
    type: 'import',
    label: 'Import Content',
    description: 'Import documents from files',
    icon: <Upload className="w-4 h-4" />,
    keywords: ['import', 'upload', 'file', 'docx', 'pdf', 'txt', 'html'],
    action: 'import'
  },
  {
    type: 'validate',
    label: 'Validate Document',
    description: 'Run quality checks and validation',
    icon: <Play className="w-4 h-4" />,
    keywords: ['validate', 'check', 'quality', 'issues', 'problems'],
    action: 'validate'
  }
]

export const CommandPalette = ({ 
  open, 
  onOpenChange, 
  onInsertBlock, 
  onImportContent,
  onValidateDocument 
}: CommandPaletteProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const allCommands = [...BLOCK_COMMANDS, ...ACTION_COMMANDS]

  // Filter commands based on query
  const [query, setQuery] = useState('')
  const filteredCommands = allCommands.filter(command => {
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

  const handleSelect = useCallback((command: CommandItem) => {
    switch (command.action) {
      case 'insert':
        onInsertBlock(command.type as Block['type'], command.defaultContent, command.defaultMetadata)
        break
      case 'import':
        onImportContent?.()
        break
      case 'validate':
        onValidateDocument?.()
        break
    }
    onOpenChange(false)
  }, [onInsertBlock, onImportContent, onValidateDocument, onOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search blocks and actions..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        <CommandGroup heading="Insert Block">
          {filteredCommands.filter(cmd => cmd.action === 'insert').map((command) => (
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
        {filteredCommands.filter(cmd => cmd.action !== 'insert').length > 0 && (
          <CommandGroup heading="Actions">
            {filteredCommands.filter(cmd => cmd.action !== 'insert').map((command) => (
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
        )}
      </CommandList>
    </CommandDialog>
  )
}