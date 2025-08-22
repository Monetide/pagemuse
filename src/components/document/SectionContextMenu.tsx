import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { 
  Edit3, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Trash2,
  MoreHorizontal
} from 'lucide-react'
import { Section } from '@/lib/document-model'

interface SectionContextMenuProps {
  children: React.ReactNode
  section: Section
  canMoveUp: boolean
  canMoveDown: boolean
  canDelete: boolean
  onRename: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
}

export function SectionContextMenu({
  children,
  section,
  canMoveUp,
  canMoveDown,
  canDelete,
  onRename,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDelete
}: SectionContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onRename}>
          <Edit3 className="w-4 h-4 mr-2" />
          Rename
        </ContextMenuItem>
        
        <ContextMenuItem onClick={onDuplicate}>
          <Copy className="w-4 h-4 mr-2" />
          Duplicate
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem 
          onClick={onMoveUp} 
          disabled={!canMoveUp}
        >
          <ArrowUp className="w-4 h-4 mr-2" />
          Move Up
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={onMoveDown} 
          disabled={!canMoveDown}
        >
          <ArrowDown className="w-4 h-4 mr-2" />
          Move Down
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem 
          onClick={onDelete} 
          disabled={!canDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete section...
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}