import { FootnoteMarker } from '@/lib/document-model'

interface FootnoteMarkerRendererProps {
  marker: FootnoteMarker
  className?: string
  onClick?: (footnoteId: string) => void
}

export const FootnoteMarkerRenderer = ({ marker, className = '', onClick }: FootnoteMarkerRendererProps) => {
  return (
    <sup 
      className={`footnote-marker text-xs font-medium text-primary cursor-pointer hover:bg-primary/10 px-0.5 rounded ${className}`}
      onClick={() => onClick?.(marker.footnoteId)}
      title={`Footnote ${marker.number}`}
    >
      {marker.number}
    </sup>
  )
}