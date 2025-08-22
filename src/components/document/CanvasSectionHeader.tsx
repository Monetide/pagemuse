import { useState } from 'react'
import { Section } from '@/lib/document-model'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Trash2 } from 'lucide-react'

interface CanvasSectionHeaderProps {
  section: Section
  canDelete: boolean
  onDeleteSection: () => void
}

export function CanvasSectionHeader({
  section,
  canDelete,
  onDeleteSection
}: CanvasSectionHeaderProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div 
      className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-2 flex items-center justify-between"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <Badge variant="outline" className="text-xs">
        Section: {section.name}
      </Badge>
      
      {(isVisible || !canDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={onDeleteSection}
              disabled={!canDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete section...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}