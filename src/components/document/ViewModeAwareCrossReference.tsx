import { Block, SemanticDocument } from '@/lib/document-model'
import { useViewMode } from '@/contexts/ViewModeContext'
import { useCrossReferences } from '@/hooks/useCrossReferences'
import { ExternalLink } from 'lucide-react'

interface ViewModeAwareCrossReferenceProps {
  block: Block
  document?: SemanticDocument | null
  onNavigate?: (targetId: string) => void
}

export const ViewModeAwareCrossReference = ({ 
  block, 
  document, 
  onNavigate 
}: ViewModeAwareCrossReferenceProps) => {
  const { viewMode } = useViewMode()
  const { getElementById } = useCrossReferences(document)
  
  const crossRefData = block.content || {}
  const targetElement = getElementById(crossRefData.targetId)
  
  const handleClick = () => {
    if (targetElement) {
      onNavigate?.(crossRefData.targetId)
      
      // Jump to target element
      const element = globalThis.document?.getElementById(`block-${crossRefData.targetId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  if (!targetElement) {
    return (
      <span className="text-destructive text-sm bg-destructive/10 px-2 py-1 rounded">
        [Reference not found]
      </span>
    )
  }

  // Format reference text based on view mode
  const formatReference = () => {
    const { type, format } = crossRefData
    const { label, number, pageNumber } = targetElement
    
    let prefix = ''
    switch (type) {
      case 'see':
        prefix = 'See '
        break
      case 'reference':
        prefix = ''
        break
      case 'page':
        prefix = 'Page '
        break
      default:
        prefix = 'See '
    }

    let main = ''
    switch (format) {
      case 'number-only':
        main = String(number || '?')
        break
      case 'title-only':
        main = label || 'Untitled'
        break
      case 'full':
      default:
        main = `${label || 'Untitled'} ${number || '?'}`
        break
    }

    // In print mode, add page numbers; in screen mode, omit them
    if (viewMode === 'print' && pageNumber && type !== 'page') {
      return `${prefix}${main} (p. ${pageNumber})`
    } else if (type === 'page') {
      return viewMode === 'print' ? `${prefix}${pageNumber || '?'}` : `${prefix}${main}`
    }
    
    return `${prefix}${main}`
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1 text-primary hover:text-primary/80 hover:underline text-sm font-medium bg-primary/5 hover:bg-primary/10 px-2 py-1 rounded transition-colors"
      title={`Go to ${targetElement.label}`}
    >
      <span>{formatReference()}</span>
      <ExternalLink className="w-3 h-3" />
    </button>
  )
}