import { memo } from 'react'

interface EmptyLineHintProps {
  visible: boolean
  className?: string
}

export const EmptyLineHint = memo(({ visible, className = '' }: EmptyLineHintProps) => {
  if (!visible) return null
  
  return (
    <div className={`text-muted-foreground/50 text-sm italic pointer-events-none select-none ${className}`}>
      Type / for commands
    </div>
  )
})

EmptyLineHint.displayName = 'EmptyLineHint'