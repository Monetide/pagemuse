import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, ArrowRight, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CoachMark {
  id: string
  title: string
  description: string
  targetSelector: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

interface CoachMarksProps {
  isVisible: boolean
  onComplete: () => void
  onDismissAll: () => void
}

const COACH_MARKS: CoachMark[] = [
  {
    id: 'navigator',
    title: 'Navigator',
    description: 'Sections hold flows; flows hold blocks.',
    targetSelector: '[data-testid="navigator"]',
    position: 'right'
  },
  {
    id: 'canvas',
    title: 'Canvas',
    description: "Type, or '/' to insert blocks. Paste to import.",
    targetSelector: '[data-testid="canvas"]',
    position: 'top'
  },
  {
    id: 'inspector',
    title: 'Inspector',
    description: 'Select a block to see options.',
    targetSelector: '[data-testid="inspector"]',
    position: 'left'
  }
]

export const CoachMarks = ({ isVisible, onComplete, onDismissAll }: CoachMarksProps) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [isPositioning, setIsPositioning] = useState(true)
  const overlayRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const currentCoachMark = COACH_MARKS[currentStep]
  const isLastStep = currentStep === COACH_MARKS.length - 1

  const updatePosition = useCallback(() => {
    if (!currentCoachMark || !isVisible) return

    const targetElement = document.querySelector(currentCoachMark.targetSelector)
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect()
      setTargetPosition({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      })
      setIsPositioning(false)
    } else {
      // Retry after a short delay if target not found
      setTimeout(updatePosition, 100)
    }
  }, [currentCoachMark, isVisible])

  useEffect(() => {
    if (isVisible) {
      setIsPositioning(true)
      updatePosition()
      
      // Update position on window resize
      const handleResize = () => updatePosition()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [isVisible, currentStep, updatePosition])

  const getCardPosition = () => {
    if (isPositioning || !currentCoachMark) return { top: '50%', left: '50%' }

    const padding = 16
    const cardWidth = 320
    const cardHeight = 140

    let top = 0
    let left = 0

    switch (currentCoachMark.position) {
      case 'top':
        top = targetPosition.y - cardHeight - padding
        left = targetPosition.x + (targetPosition.width / 2) - (cardWidth / 2)
        break
      case 'bottom':
        top = targetPosition.y + targetPosition.height + padding
        left = targetPosition.x + (targetPosition.width / 2) - (cardWidth / 2)
        break
      case 'left':
        top = targetPosition.y + (targetPosition.height / 2) - (cardHeight / 2)
        left = targetPosition.x - cardWidth - padding
        break
      case 'right':
        top = targetPosition.y + (targetPosition.height / 2) - (cardHeight / 2)
        left = targetPosition.x + targetPosition.width + padding
        break
    }

    // Keep card within viewport bounds
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (left < padding) left = padding
    if (left + cardWidth > viewportWidth - padding) left = viewportWidth - cardWidth - padding
    if (top < padding) top = padding
    if (top + cardHeight > viewportHeight - padding) top = viewportHeight - cardHeight - padding

    return { top: `${top}px`, left: `${left}px` }
  }

  const getSpotlightStyle = () => {
    if (isPositioning) return {}

    return {
      clipPath: `polygon(
        0% 0%, 
        0% 100%, 
        ${targetPosition.x - 8}px 100%, 
        ${targetPosition.x - 8}px ${targetPosition.y - 8}px, 
        ${targetPosition.x + targetPosition.width + 8}px ${targetPosition.y - 8}px, 
        ${targetPosition.x + targetPosition.width + 8}px ${targetPosition.y + targetPosition.height + 8}px, 
        ${targetPosition.x - 8}px ${targetPosition.y + targetPosition.height + 8}px, 
        ${targetPosition.x - 8}px 100%, 
        100% 100%, 
        100% 0%
      )`
    }
  }

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSkipAll = () => {
    onDismissAll()
  }

  if (!isVisible || !currentCoachMark) return null

  const cardPosition = getCardPosition()

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] transition-all duration-300"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Dark overlay with spotlight */}
      <div
        className="absolute inset-0 bg-black/60 transition-all duration-500"
        style={getSpotlightStyle()}
      />

      {/* Target highlight ring */}
      {!isPositioning && (
        <div
          className="absolute border-2 border-primary rounded-md animate-pulse"
          style={{
            top: targetPosition.y - 4,
            left: targetPosition.x - 4,
            width: targetPosition.width + 8,
            height: targetPosition.height + 8,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Coach mark card */}
      <Card
        ref={cardRef}
        className={cn(
          "absolute w-80 shadow-xl border-primary/20 bg-background/95 backdrop-blur-sm",
          "transition-all duration-300 transform",
          isPositioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
        )}
        style={cardPosition}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {currentStep + 1} of {COACH_MARKS.length}
              </Badge>
              <h3 className="font-semibold text-sm">{currentCoachMark.title}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipAll}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {currentCoachMark.description}
          </p>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipAll}
              className="text-xs gap-1"
            >
              <SkipForward className="h-3 w-3" />
              Skip all
            </Button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  className="text-xs"
                >
                  Previous
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                className="text-xs gap-1"
              >
                {isLastStep ? 'Finish' : 'Next'}
                {!isLastStep && <ArrowRight className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
        {COACH_MARKS.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              index === currentStep ? "bg-primary" : "bg-primary/30"
            )}
          />
        ))}
      </div>
    </div>
  )
}
