import { useState } from 'react'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { BookOpen, FileText } from 'lucide-react'

interface NavigatorTOCMenuProps {
  onInsertTOC: (position: 'start' | 'caret') => void
  children: React.ReactNode
}

export const NavigatorTOCMenu = ({ onInsertTOC, children }: NavigatorTOCMenuProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => onInsertTOC('start')}
          className="flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          Insert TOC at section start
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onInsertTOC('caret')}
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Insert TOC at caret
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}