import { memo } from 'react'

interface SnapGuidesProps {
  visible: boolean
  canvasWidth: number
  canvasHeight: number
  scale: number
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export const SnapGuides = memo(({ 
  visible, 
  canvasWidth, 
  canvasHeight, 
  scale, 
  margins 
}: SnapGuidesProps) => {
  if (!visible) return null

  // Generate snap guide lines at key positions
  const guides = []
  
  // Margin guides
  const marginGuides = [
    { type: 'vertical', position: margins.left, label: 'Left Margin' },
    { type: 'vertical', position: canvasWidth - margins.right, label: 'Right Margin' },
    { type: 'horizontal', position: margins.top, label: 'Top Margin' },
    { type: 'horizontal', position: canvasHeight - margins.bottom, label: 'Bottom Margin' }
  ]

  // Center guides
  const centerGuides = [
    { type: 'vertical', position: canvasWidth / 2, label: 'Center Vertical' },
    { type: 'horizontal', position: canvasHeight / 2, label: 'Center Horizontal' }
  ]

  // Column guides (if applicable)
  const contentWidth = canvasWidth - margins.left - margins.right
  const columnGuides = [
    { type: 'vertical', position: margins.left + contentWidth / 3, label: 'Third Column' },
    { type: 'vertical', position: margins.left + (2 * contentWidth) / 3, label: 'Two Thirds' }
  ]

  const allGuides = [...marginGuides, ...centerGuides, ...columnGuides]

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {allGuides.map((guide, index) => (
        <div key={index}>
          {/* Guide line */}
          <div
            className={`absolute bg-purple-400/60 ${
              guide.type === 'vertical' ? 'w-px h-full' : 'h-px w-full'
            }`}
            style={{
              [guide.type === 'vertical' ? 'left' : 'top']: guide.position,
              [guide.type === 'vertical' ? 'top' : 'left']: 0
            }}
          />
          
          {/* Guide label */}
          <div
            className="absolute bg-purple-500 text-white text-xs px-2 py-1 rounded shadow-lg opacity-80"
            style={{
              [guide.type === 'vertical' ? 'left' : 'top']: guide.position + 4,
              [guide.type === 'vertical' ? 'top' : 'left']: 8,
              transform: guide.type === 'vertical' ? 'none' : 'translateX(-50%)'
            }}
          >
            {guide.label}
          </div>
        </div>
      ))}
      
      {/* Baseline grid snap points */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at center, rgb(168 85 247) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          backgroundPosition: `${margins.left}px ${margins.top}px`
        }}
      />
    </div>
  )
})

SnapGuides.displayName = 'SnapGuides'