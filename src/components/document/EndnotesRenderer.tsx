import { FootnoteContent } from '@/lib/document-model'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EndnotesRendererProps {
  footnotes: FootnoteContent[]
  sectionName: string
  className?: string
}

export const EndnotesRenderer = ({ footnotes, sectionName, className = '' }: EndnotesRendererProps) => {
  if (footnotes.length === 0) return null

  return (
    <Card className={`endnotes-section ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg">Notes</CardTitle>
        <p className="text-sm text-muted-foreground">Notes for {sectionName}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {footnotes.map((footnote) => (
            <div key={footnote.id} className="endnote-item">
              <div className="flex gap-3">
                <span className="endnote-number font-semibold text-primary min-w-6">
                  {footnote.number}.
                </span>
                <div className="endnote-content text-sm leading-relaxed">
                  {footnote.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}