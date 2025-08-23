import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SeedFormData } from '@/components/admin/SeedForm'

interface TemplatePreviewProps {
  data?: SeedFormData
}

export function TemplatePreview({ data }: TemplatePreviewProps) {
  if (!data) {
    return (
      <div className="aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto text-muted-foreground mb-2">📄</div>
          <p className="text-sm text-muted-foreground">Live Preview</p>
          <p className="text-xs text-muted-foreground mt-1">
            Configure seed to see preview
          </p>
        </div>
      </div>
    )
  }

  const sansFont = data.typography?.sans.family || 'font-inter'
  const serifFont = data.typography?.serif.family || 'font-source-serif'
  const brandColor = data.primaryColor || '#8B5CF6'

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="aspect-[4/3] bg-white overflow-hidden relative">
          {/* Document Header */}
          <div 
            className="h-12 flex items-center justify-between px-4"
            style={{ backgroundColor: `${brandColor}15` }}
          >
            <div className={`${sansFont} font-semibold text-sm`} style={{ color: brandColor }}>
              {data.brandName || 'Brand Name'}
            </div>
            <Badge 
              variant="outline" 
              className="text-xs"
              style={{ borderColor: brandColor, color: brandColor }}
            >
              {data.usage?.toUpperCase()}
            </Badge>
          </div>

          {/* Document Content */}
          <div className="p-4 space-y-3">
            {/* H1 Heading */}
            <h1 
              className={`${sansFont} text-template-h1 font-bold leading-tight`}
              style={{ color: brandColor }}
            >
              Main Heading
            </h1>

            {/* H2 Subheading */}
            <h2 className={`${sansFont} text-template-h2 font-semibold text-gray-700`}>
              Section Title
            </h2>

            {/* Body Text */}
            <div className="space-y-2">
              <p className={`${serifFont} text-template-body text-gray-600 leading-relaxed`}>
                This is how body text will appear in your template. The typography pairing ensures excellent readability and visual hierarchy.
              </p>
              <p className={`${serifFont} text-template-body text-gray-600 leading-relaxed`}>
                Multiple paragraphs maintain consistent spacing and flow.
              </p>
            </div>

            {/* H3 and more content */}
            <h3 className={`${sansFont} text-template-h3 font-medium text-gray-700 mt-3`}>
              Subsection Heading
            </h3>
            
            <p className={`${serifFont} text-template-body text-gray-600 leading-relaxed`}>
              Additional content follows the established hierarchy.
            </p>

            {/* Caption */}
            <p className={`${serifFont} text-template-caption text-gray-500 italic mt-3`}>
              Figure 1: Caption text demonstrates smaller text styling
            </p>

            {/* Quote */}
            <blockquote 
              className={`${serifFont} text-template-quote italic border-l-3 pl-3 my-3 text-gray-600`}
              style={{ borderLeftColor: brandColor }}
            >
              "Quoted text showcases the typography pairing's elegance and readability."
            </blockquote>
          </div>

          {/* Vibe Indicators */}
          {data.vibes && data.vibes.length > 0 && (
            <div className="absolute bottom-2 left-4 flex gap-1">
              {data.vibes.map((vibe) => (
                <Badge 
                  key={vibe} 
                  variant="secondary" 
                  className="text-xs capitalize opacity-75"
                >
                  {vibe}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}