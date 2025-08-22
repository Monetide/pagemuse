import { useState, useCallback } from 'react'
import { Block } from '@/lib/document-model'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Info, 
  Lightbulb, 
  AlertTriangle, 
  AlertCircle,
  GripVertical 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalloutData {
  type: 'note' | 'tip' | 'warning' | 'danger'
  title?: string
  content: string
}

interface CalloutBlockProps {
  block: Block
  onContentChange?: (blockId: string, newContent: any) => void
  onSelect?: (blockId: string) => void
  isSelected?: boolean
  isEditing?: boolean
  showInvisibles?: boolean
}

const CALLOUT_TYPES = {
  note: {
    icon: Info,
    label: 'Note',
    className: 'callout-note'
  },
  tip: {
    icon: Lightbulb,
    label: 'Tip',
    className: 'callout-tip'
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    className: 'callout-warning'
  },
  danger: {
    icon: AlertCircle,
    label: 'Danger',
    className: 'callout-danger'
  }
} as const

export const CalloutBlock = ({
  block,
  onContentChange,
  onSelect,
  isSelected = false,
  isEditing = false,
  showInvisibles = false
}: CalloutBlockProps) => {
  const calloutData = block.content as CalloutData
  const [localTitle, setLocalTitle] = useState(calloutData.title || '')
  const [localContent, setLocalContent] = useState(calloutData.content || '')

  const updateContent = useCallback((updates: Partial<CalloutData>) => {
    const newContent = { ...calloutData, ...updates }
    onContentChange?.(block.id, newContent)
  }, [block.id, calloutData, onContentChange])

  const handleTitleChange = useCallback((title: string) => {
    setLocalTitle(title)
    updateContent({ title: title || undefined })
  }, [updateContent])

  const handleContentChange = useCallback((content: string) => {
    setLocalContent(content)
    updateContent({ content })
  }, [updateContent])

  const handleTypeChange = useCallback((type: CalloutData['type']) => {
    updateContent({ type })
  }, [updateContent])

  const calloutType = CALLOUT_TYPES[calloutData.type] || CALLOUT_TYPES.note
  const Icon = calloutType.icon

  return (
    <div
      className={cn(
        "callout group relative transition-all",
        calloutType.className,
        isSelected ? "ring-2 ring-primary" : "",
        "hover:shadow-md cursor-pointer"
      )}
      onClick={() => onSelect?.(block.id)}
      role="note"
      aria-label={`${calloutType.label} callout`}
    >
      {/* Drag Handle */}
      <div className="absolute -left-6 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
      </div>

      {/* Callout Header */}
      <div className="callout-title">
        <Icon className="callout-icon" />
        {isEditing ? (
          <input
            type="text"
            placeholder={`${calloutType.label} title (optional)`}
            value={localTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="bg-transparent border-none outline-none font-semibold placeholder:text-muted-foreground flex-1"
          />
        ) : (
          <span className="font-semibold">
            {calloutData.title || calloutType.label}
          </span>
        )}
      </div>

      {/* Callout Content */}
      <div className="callout-content">
        {isEditing ? (
          <Textarea
            placeholder="Enter your callout content..."
            value={localContent}
            onChange={(e) => handleContentChange(e.target.value)}
            className="bg-transparent border-none shadow-none resize-none min-h-[80px] p-0"
          />
        ) : (
          <div className="whitespace-pre-wrap">
            {calloutData.content}
            {showInvisibles && (
              <span className="text-purple-400/60 font-mono text-xs ml-1">¶</span>
            )}
          </div>
        )}
      </div>

      {/* Edit Controls */}
      {isEditing && (
        <div className="mt-4 pt-4 border-t border-current/20">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Type:</label>
            <Select value={calloutData.type} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CALLOUT_TYPES).map(([key, type]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}

// Factory function to create a callout block
export function createCalloutBlock(
  type: CalloutData['type'] = 'note',
  content: string = '',
  title?: string
): Block {
  return {
    id: crypto.randomUUID(),
    type: 'callout',
    content: { type, content, title },
    order: 0,
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
}