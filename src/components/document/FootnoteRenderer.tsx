import { FootnoteContent, FootnoteMarker } from '@/lib/document-model'

interface FootnoteRendererProps {
  footnotes: FootnoteContent[]
  pageNumber?: number
  className?: string
}

export const FootnoteRenderer = ({ footnotes, pageNumber, className = '' }: FootnoteRendererProps) => {
  if (footnotes.length === 0) return null

  return (
    <div className={`footnote-area border-t border-border pt-2 mt-4 ${className}`}>
      <div className="space-y-1">
        {footnotes.map((footnote) => (
          <div key={footnote.id} className="footnote-item text-xs leading-relaxed">
            <span className="footnote-number inline-block w-4 text-right mr-2 font-medium">
              {footnote.number}
            </span>
            <span className="footnote-content text-muted-foreground">
              {footnote.content}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}