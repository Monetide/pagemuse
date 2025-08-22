import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FootnoteMarker } from '@/lib/document-model'
import { Button } from '@/components/ui/button'

interface ScreenModeFootnotePopoverProps {
  marker: FootnoteMarker
  content: string
  className?: string
}

export const ScreenModeFootnotePopover = ({ 
  marker, 
  content, 
  className = '' 
}: ScreenModeFootnotePopoverProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="link"
          size="sm"
          className={`footnote-marker-screen h-auto p-0 text-xs font-medium text-primary hover:bg-primary/10 px-1 rounded ${className}`}
          title={`Footnote ${marker.number}`}
        >
          <sup>{marker.number}</sup>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-3 text-sm"
        side="top"
        sideOffset={5}
      >
        <div className="space-y-2">
          <div className="font-medium text-primary">
            Footnote {marker.number}
          </div>
          <div className="text-muted-foreground leading-relaxed">
            {content}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}