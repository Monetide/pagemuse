import { memo } from 'react'

interface RulerProps {
  orientation: 'horizontal' | 'vertical'
  length: number
  scale: number
  offset?: number
  className?: string
}

const Ruler = memo(({ orientation, length, scale, offset = 0, className = '' }: RulerProps) => {
  // Generate tick marks every 0.5 inches (36 pixels at 72 DPI)
  const tickInterval = 0.5 * 72 * scale // 0.5 inch intervals
  const majorTickInterval = 72 * scale // 1 inch intervals
  
  const ticks = []
  for (let i = 0; i <= length; i += tickInterval) {
    const isMajor = i % majorTickInterval < 1
    const tickSize = isMajor ? 12 : 6
    
    ticks.push(
      <div
        key={i}
        className={`absolute bg-border ${
          orientation === 'horizontal' 
            ? 'w-px' 
            : 'h-px'
        }`}
        style={{
          [orientation === 'horizontal' ? 'left' : 'top']: i + offset,
          [orientation === 'horizontal' ? 'height' : 'width']: `${tickSize}px`,
          [orientation === 'horizontal' ? 'bottom' : 'right']: 0
        }}
      />
    )
    
    // Add measurement labels for major ticks
    if (isMajor && i > 0) {
      const inches = Math.round((i / scale / 72) * 10) / 10
      ticks.push(
        <div
          key={`label-${i}`}
          className="absolute text-xs text-muted-foreground font-mono"
          style={{
            [orientation === 'horizontal' ? 'left' : 'top']: i + offset + 2,
            [orientation === 'horizontal' ? 'bottom' : 'right']: 
              orientation === 'horizontal' ? '2px' : '2px',
            transform: orientation === 'vertical' ? 'rotate(-90deg)' : 'none',
            transformOrigin: orientation === 'vertical' ? 'left bottom' : 'unset'
          }}
        >
          {inches}"
        </div>
      )
    }
  }

  return (
    <div 
      className={`absolute bg-muted/80 border-border ${
        orientation === 'horizontal' 
          ? 'border-b h-6 left-6 right-0 top-0' 
          : 'border-r w-6 top-6 bottom-0 left-0'
      } ${className}`}
      style={{
        backdropFilter: 'blur(2px)'
      }}
    >
      {ticks}
    </div>
  )
})

Ruler.displayName = 'Ruler'

interface RulersProps {
  canvasWidth: number
  canvasHeight: number
  scale: number
  visible: boolean
}

export const Rulers = memo(({ canvasWidth, canvasHeight, scale, visible }: RulersProps) => {
  if (!visible) return null

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Corner square */}
      <div className="absolute top-0 left-0 w-6 h-6 bg-muted border-r border-b border-border" />
      
      {/* Horizontal ruler */}
      <Ruler
        orientation="horizontal"
        length={canvasWidth}
        scale={scale}
        offset={6}
      />
      
      {/* Vertical ruler */}
      <Ruler
        orientation="vertical"
        length={canvasHeight}
        scale={scale}
        offset={6}
      />
    </div>
  )
})

Rulers.displayName = 'Rulers'