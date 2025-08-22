import { useEffect, useState } from 'react'
import { SemanticDocument } from '@/lib/document-model'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X } from 'lucide-react'
import { useAccessibility } from './AccessibilityProvider'

interface AltTextValidatorProps {
  document: SemanticDocument | null
  onFocusFigure?: (blockId: string) => void
}

interface FigureWithMissingAlt {
  id: string
  caption?: string
  position: string
}

export const AltTextValidator = ({ document, onFocusFigure }: AltTextValidatorProps) => {
  const { announce } = useAccessibility()
  const [figuresWithMissingAlt, setFiguresWithMissingAlt] = useState<FigureWithMissingAlt[]>([])
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (!document) {
      setFiguresWithMissingAlt([])
      return
    }

    const missingAltFigures: FigureWithMissingAlt[] = []
    let sectionIndex = 0
    let figureIndex = 0

    document.sections.forEach((section) => {
      sectionIndex++
      section.flows.forEach((flow) => {
        flow.blocks
          .sort((a, b) => a.order - b.order)
          .forEach((block) => {
            if (block.type === 'figure') {
              figureIndex++
              const hasImage = block.content?.imageSrc
              const hasAltText = block.content?.altText?.trim()
              
              if (hasImage && !hasAltText) {
                missingAltFigures.push({
                  id: block.id,
                  caption: block.content?.caption,
                  position: `Section ${sectionIndex}, Figure ${figureIndex}`
                })
              }
            }
          })
      })
    })

    setFiguresWithMissingAlt(missingAltFigures)
    
    // Announce accessibility issues
    if (missingAltFigures.length > 0 && !isDismissed) {
      announce(`Found ${missingAltFigures.length} figure${missingAltFigures.length === 1 ? '' : 's'} missing alt text for accessibility`)
    }
  }, [document, announce, isDismissed])

  const handleFocusFigure = (figureId: string) => {
    onFocusFigure?.(figureId)
    // Scroll to the figure
    const element = globalThis.document.getElementById(`block-${figureId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element.focus()
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    announce('Alt text reminder dismissed')
  }

  if (figuresWithMissingAlt.length === 0 || isDismissed) {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 p-4 bg-warning/10 border-warning/50 shadow-lg z-50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-semibold text-sm">Accessibility Reminder</h3>
            <p className="text-sm text-muted-foreground">
              {figuresWithMissingAlt.length} figure{figuresWithMissingAlt.length === 1 ? '' : 's'} missing alt text for screen readers
            </p>
          </div>
          
          <div className="space-y-2">
            {figuresWithMissingAlt.slice(0, 3).map((figure) => (
              <div
                key={figure.id}
                className="flex items-center justify-between text-sm bg-background/80 rounded px-2 py-1"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {figure.caption || 'Untitled Figure'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {figure.position}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFocusFigure(figure.id)}
                  className="ml-2 h-6 px-2"
                >
                  Fix
                </Button>
              </div>
            ))}
            
            {figuresWithMissingAlt.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                and {figuresWithMissingAlt.length - 3} more...
              </p>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}