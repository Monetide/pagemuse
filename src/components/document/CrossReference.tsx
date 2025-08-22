import { useMemo } from 'react'
import { useCrossReferences, CrossReference as CrossRefType } from '@/hooks/useCrossReferences'
import { SemanticDocument } from '@/lib/document-model'
import { ExternalLink, AlertCircle } from 'lucide-react'

interface CrossReferenceProps {
  content: CrossRefType
  document: SemanticDocument | null
  className?: string
  pageNumber?: number
}

export const CrossReference = ({ 
  content, 
  document, 
  className = '',
  pageNumber 
}: CrossReferenceProps) => {
  const { formatCrossReference, getElementById } = useCrossReferences(document)
  
  const element = useMemo(() => {
    return getElementById(content.targetId)
  }, [getElementById, content.targetId])

  const formattedRef = useMemo(() => {
    return formatCrossReference(content, pageNumber)
  }, [formatCrossReference, content, pageNumber])

  const handleClick = () => {
    if (element) {
      // Scroll to the referenced element
      const targetElement = globalThis.document?.querySelector(`#block-${element.id}`)
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  if (!element) {
    return (
      <span className={`inline-flex items-center gap-1 text-destructive text-sm ${className}`}>
        <AlertCircle className="w-3 h-3" />
        {formattedRef}
      </span>
    )
  }

  return (
    <span 
      className={`inline-flex items-center gap-1 text-primary hover:text-primary/80 cursor-pointer transition-colors ${className}`}
      onClick={handleClick}
      title={`Go to ${element.label}: ${element.title}`}
    >
      <ExternalLink className="w-3 h-3" />
      {formattedRef}
    </span>
  )
}