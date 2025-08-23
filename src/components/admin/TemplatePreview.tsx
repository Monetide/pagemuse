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
  
  // Use colorway colors if available, otherwise fallback to brand color
  const colors = data.colorway ? data.colorway.colors : {
    brand: data.primaryColor || '#8B5CF6',
    brandSecondary: data.primaryColor || '#8B5CF6', 
    textBody: '#1a1a1a',
    textMuted: '#666666',
    bgPage: '#ffffff',
    bgSection: '#f8f9fa',
    borderSubtle: '#e5e5e5'
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="aspect-[4/3] overflow-hidden relative" style={{ backgroundColor: colors.bgPage }}>
          {/* Document Header */}
          <div 
            className="h-12 flex items-center justify-between px-4"
            style={{ backgroundColor: colors.bgSection }}
          >
            <div className={`${sansFont} font-semibold text-sm`} style={{ color: colors.brand }}>
              {data.brandName || 'Brand Name'}
            </div>
            <Badge 
              variant="outline" 
              className="text-xs"
              style={{ 
                borderColor: colors.brand, 
                color: colors.brand,
                backgroundColor: colors.bgPage 
              }}
            >
              {data.usage?.toUpperCase()}
            </Badge>
          </div>

          {/* Document Content */}
          <div className="p-4 space-y-3">
            {/* H1 Heading */}
            <h1 
              className={`${sansFont} text-template-h1 font-bold leading-tight`}
              style={{ color: colors.brand }}
            >
              Main Heading
            </h1>

            {/* H2 Subheading */}
            <h2 
              className={`${sansFont} text-template-h2 font-semibold`}
              style={{ color: colors.textBody }}
            >
              Section Title
            </h2>

            {/* Body Text */}
            <div className="space-y-2">
              <p 
                className={`${serifFont} text-template-body leading-relaxed`}
                style={{ color: colors.textBody }}
              >
                This is how body text will appear in your template. The colorway ensures excellent contrast and readability.
              </p>
              <p 
                className={`${serifFont} text-template-body leading-relaxed`}
                style={{ color: colors.textBody }}
              >
                Multiple paragraphs maintain consistent spacing and flow.
              </p>
            </div>

            {/* H3 and more content */}
            <h3 
              className={`${sansFont} text-template-h3 font-medium mt-3`}
              style={{ color: colors.textBody }}
            >
              Subsection Heading
            </h3>
            
            <p 
              className={`${serifFont} text-template-body leading-relaxed`}
              style={{ color: colors.textBody }}
            >
              Additional content follows the established hierarchy.
            </p>

            {/* Caption */}
            <p 
              className={`${serifFont} text-template-caption italic mt-3`}
              style={{ color: colors.textMuted }}
            >
              Figure 1: Caption text demonstrates smaller text styling
            </p>

            {/* Quote */}
            <blockquote 
              className={`${serifFont} text-template-quote italic border-l-3 pl-3 my-3`}
              style={{ 
                color: colors.textBody,
                borderLeftColor: colors.brand 
              }}
            >
              "Quoted text showcases the colorway's elegance and accessibility."
            </blockquote>

            {/* Section Background Demo */}
            <div 
              className="rounded p-3 mt-3"
              style={{ backgroundColor: colors.bgSection }}
            >
              <h4 
                className={`${sansFont} text-template-h3 font-medium mb-2`}
                style={{ color: colors.brand }}
              >
                Section Background
              </h4>
              <p 
                className={`${serifFont} text-template-body`}
                style={{ color: colors.textBody }}
              >
                Text maintains AA contrast on tinted backgrounds.
              </p>
              <p 
                className={`${serifFont} text-template-caption mt-1`}
                style={{ color: colors.textMuted }}
              >
                Muted text remains accessible and readable.
              </p>
            </div>
          </div>

          {/* Vibe Indicators */}
          {data.vibes && data.vibes.length > 0 && (
            <div className="absolute bottom-2 left-4 flex gap-1">
              {data.vibes.map((vibe) => (
                <Badge 
                  key={vibe} 
                  className="text-xs capitalize opacity-75"
                  style={{ 
                    backgroundColor: colors.brandSecondary,
                    color: colors.bgPage
                  }}
                >
                  {vibe}
                </Badge>
              ))}
            </div>
          )}

          {/* Colorway Compliance Badge */}
          {data.colorway && (
            <div className="absolute bottom-2 right-4">
              <Badge 
                className={`text-xs ${
                  data.colorway.isCompliant 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : 'bg-orange-100 text-orange-800 border-orange-200'
                }`}
              >
                {data.colorway.isCompliant ? '✓ AA Compliant' : '⚠ Review Needed'}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}