import { memo } from 'react'

interface TextInvisiblesProps {
  text: string
  showInvisibles: boolean
  className?: string
}

export const TextInvisibles = memo(({ text, showInvisibles, className = '' }: TextInvisiblesProps) => {
  if (!showInvisibles) {
    return <span className={className}>{text}</span>
  }

  // Replace invisible characters with visible symbols
  const processedText = text
    .replace(/ /g, '·')           // Replace spaces with middle dots
    .replace(/\t/g, '→')          // Replace tabs with arrows
    .replace(/\n/g, '¶\n')        // Replace line breaks with paragraph marks

  return (
    <span className={`${className} relative`}>
      {processedText.split('').map((char, index) => {
        if (char === '·') {
          return (
            <span key={index} className="text-blue-400/60 font-mono text-xs">
              ·
            </span>
          )
        } else if (char === '→') {
          return (
            <span key={index} className="text-green-400/60 font-mono text-xs">
              →
            </span>
          )
        } else if (char === '¶') {
          return (
            <span key={index} className="text-purple-400/60 font-mono text-xs">
              ¶
            </span>
          )
        } else {
          return <span key={index}>{char}</span>
        }
      })}
      
      {/* Show paragraph end marker */}
      {showInvisibles && (
        <span className="text-purple-400/60 font-mono text-xs ml-1">
          ¶
        </span>
      )}
    </span>
  )
})

TextInvisibles.displayName = 'TextInvisibles'

interface InvisibleMarkersProps {
  showInvisibles: boolean
  hasWidowOrphan?: boolean
  lineCount?: number
}

export const InvisibleMarkers = memo(({ showInvisibles, hasWidowOrphan, lineCount }: InvisibleMarkersProps) => {
  if (!showInvisibles) return null

  return (
    <div className="absolute -right-6 top-0 flex flex-col gap-1 text-xs text-muted-foreground/60">
      {/* Line count indicator */}
      {lineCount && lineCount > 1 && (
        <span className="font-mono bg-muted/30 px-1 rounded">
          {lineCount}L
        </span>
      )}
      
      {/* Widow/orphan warning */}
      {hasWidowOrphan && (
        <span className="text-amber-500 font-mono bg-amber-500/10 px-1 rounded border border-amber-500/30">
          W/O
        </span>
      )}
    </div>
  )
})

InvisibleMarkers.displayName = 'InvisibleMarkers'