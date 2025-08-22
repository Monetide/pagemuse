import { useState, useRef, useEffect } from 'react'
import { useCrossReferences } from '@/hooks/useCrossReferences'
import { SemanticDocument } from '@/lib/document-model'
import { Search, Hash, Image, Table2, ArrowRight } from 'lucide-react'

interface CrossReferenceInserterProps {
  document: SemanticDocument | null
  position: { x: number; y: number }
  visible: boolean
  onSelect: (targetId: string, type: 'see' | 'reference' | 'page', format: 'full' | 'number-only' | 'title-only') => void
  onClose: () => void
}

export const CrossReferenceInserter = ({
  document,
  position,
  visible,
  onSelect,
  onClose
}: CrossReferenceInserterProps) => {
  const { getAvailableReferences } = useCrossReferences(document)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedType, setSelectedType] = useState<'see' | 'reference' | 'page'>('see')
  const [selectedFormat, setSelectedFormat] = useState<'full' | 'number-only' | 'title-only'>('full')
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const availableRefs = getAvailableReferences()
  
  const filteredRefs = availableRefs.filter(ref => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      ref.label.toLowerCase().includes(query) ||
      ref.title?.toLowerCase().includes(query) ||
      ref.type.toLowerCase().includes(query)
    )
  })

  useEffect(() => {
    if (visible && searchRef.current) {
      searchRef.current.focus()
    }
  }, [visible])

  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredRefs.length, searchQuery])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visible) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % filteredRefs.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + filteredRefs.length) % filteredRefs.length)
          break
        case 'Enter':
          e.preventDefault()
          if (filteredRefs[selectedIndex]) {
            handleSelect(filteredRefs[selectedIndex].id)
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
        case 'Tab':
          e.preventDefault()
          // Cycle through reference types
          if (selectedType === 'see') setSelectedType('reference')
          else if (selectedType === 'reference') setSelectedType('page')
          else setSelectedType('see')
          break
      }
    }

    globalThis.document.addEventListener('keydown', handleKeyDown)
    return () => globalThis.document.removeEventListener('keydown', handleKeyDown)
  }, [visible, selectedIndex, filteredRefs, selectedType, onClose])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (visible) {
      globalThis.document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      globalThis.document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [visible, onClose])

  const handleSelect = (targetId: string) => {
    onSelect(targetId, selectedType, selectedFormat)
    onClose()
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'heading': return <Hash className="w-4 h-4" />
      case 'figure': return <Image className="w-4 h-4" />
      case 'table': return <Table2 className="w-4 h-4" />
      default: return null
    }
  }

  if (!visible) return null

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
      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-sm font-medium mb-2">Insert Cross-Reference</h3>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search references..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-sm border border-border rounded bg-background"
          />
        </div>

        {/* Reference type selector */}
        <div className="flex gap-1 mt-2">
          {(['see', 'reference', 'page'] as const).map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedType === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Format selector */}
        <div className="flex gap-1 mt-1">
          {(['full', 'number-only', 'title-only'] as const).map(format => (
            <button
              key={format}
              onClick={() => setSelectedFormat(format)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedFormat === format
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted/30'
              }`}
            >
              {format.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Reference list */}
      <div className="max-h-48 overflow-y-auto">
        {filteredRefs.length === 0 ? (
          <div className="px-3 py-4 text-center text-muted-foreground text-sm">
            {availableRefs.length === 0 
              ? 'No referenceable elements found. Create headings, figures, or tables first.'
              : 'No matches found.'
            }
          </div>
        ) : (
          filteredRefs.map((ref, index) => (
            <div
              key={ref.id}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
              }`}
              onClick={() => handleSelect(ref.id)}
            >
              <div className="flex-shrink-0 text-muted-foreground">
                {getTypeIcon(ref.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {ref.label}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {ref.title}
                </div>
              </div>
              
              <div className="flex-shrink-0 text-muted-foreground">
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1 text-xs text-muted-foreground border-t border-border mt-1">
        ↑↓ navigate • Tab cycle type • Enter select • Esc cancel
      </div>
    </div>
  )
}