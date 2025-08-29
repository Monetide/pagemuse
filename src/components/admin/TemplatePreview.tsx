import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SeedFormData } from '@/components/admin/SeedForm'
import { getPageMasterPreset } from '@/lib/page-masters'
import { getSnippet, DEFAULT_OBJECT_STYLES } from '@/lib/object-styles'

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
  
  // Get selected page masters
  const coverMaster = data.pageMasters?.cover ? getPageMasterPreset(data.pageMasters.cover) : null
  const bodyMaster = data.pageMasters?.selected?.[0]?.id ? getPageMasterPreset(data.pageMasters.selected[0].id) : null
  
  // Get object styles and snippets
  const objectStyles = data.objectStyles?.styles || {}
  const selectedSnippets = data.objectStyles?.snippets || []
  
  // Use colorway colors if available, otherwise fallback to brand color
  const colors = data.colorway ? data.colorway.colors : {
    brand: data.primaryColor || '#8B5CF6',
    brandSecondary: data.primaryColor || '#8B5CF6', 
    textBody: '#1a1a1a',
    textMuted: '#666666',
    bgPage: '#ffffff',
    bgSection: '#f8f9fa',
    borderSubtle: '#e5e5e5',
    warning: '#f59e0b',
    warningLight: '#fef3c7'
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

          {/* Page Master Indicator */}
          {(coverMaster || bodyMaster) && (
            <div className="px-4 py-2 bg-primary/5 border-b border-primary/10">
              <div className="flex items-center gap-2 text-xs">
                {coverMaster && (
                  <Badge variant="outline" className="text-xs">
                    Cover: {coverMaster.pageMaster.columns === 1 ? '1-Col' : `${coverMaster.pageMaster.columns}-Col`} {coverMaster.pageSize}
                  </Badge>
                )}
                {bodyMaster && (
                  <Badge variant="outline" className="text-xs">
                    Body: {bodyMaster.pageMaster.columns === 1 ? '1-Col' : `${bodyMaster.pageMaster.columns}-Col`} {bodyMaster.pageSize}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Document Content */}
          <div className={`p-4 space-y-3 ${bodyMaster?.pageMaster.columns === 2 ? 'columns-2 gap-3' : ''}`}>
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
            <div className={`space-y-2 ${bodyMaster?.pageMaster.columns === 2 ? 'break-inside-avoid' : ''}`}>
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
                Multiple paragraphs maintain consistent spacing and flow{bodyMaster?.pageMaster.columns === 2 ? ' across columns with proper text distribution' : ''}.
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
              className={`${serifFont} text-template-body leading-relaxed ${bodyMaster?.pageMaster.columns === 2 ? 'break-inside-avoid' : ''}`}
              style={{ color: colors.textBody }}
            >
              Additional content follows the established hierarchy{bodyMaster?.pageMaster.baselineGrid ? ' aligned to baseline grid' : ''}.
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

            {/* Object Style Demos */}
            {Object.keys(objectStyles).length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className={`${sansFont} text-template-h3 font-medium`} style={{ color: colors.brand }}>
                  Object Styles
                </h4>
                
                {/* Figure Demo */}
                {objectStyles['figure-default'] && (
                  <div className="space-y-2">
                    <div className="bg-muted/30 rounded h-16 flex items-center justify-center text-xs text-muted-foreground">
                      [Figure Placeholder]
                    </div>
                    <p 
                      className={`${serifFont} text-template-caption`}
                      style={{ color: colors.textMuted }}
                    >
                      Figure 1: Sample caption using {objectStyles['figure-default'].properties.captionStyle} style
                    </p>
                  </div>
                )}

                {/* Table Demo */}
                {objectStyles['table-default'] && (
                  <div className="border border-muted rounded overflow-hidden">
                    <div 
                      className="grid grid-cols-3 text-xs font-medium"
                      style={{ backgroundColor: colors.bgSection, padding: `${objectStyles['table-default'].properties.cellPadding}px` }}
                    >
                      <div style={{ color: colors.textBody }}>Metric</div>
                      <div style={{ color: colors.textBody }}>Value</div>
                      <div style={{ color: colors.textBody }}>Change</div>
                    </div>
                    <div 
                      className="grid grid-cols-3 text-xs border-t border-muted"
                      style={{ padding: `${objectStyles['table-default'].properties.cellPadding}px` }}
                    >
                      <div style={{ color: colors.textBody }}>Revenue</div>
                      <div style={{ color: colors.textBody }}>$2.4M</div>
                      <div style={{ color: colors.brand }}>+12%</div>
                    </div>
                  </div>
                )}

                {/* Callout Demo */}
                {objectStyles['callout-default'] && (
                  <div 
                    className="relative rounded p-3"
                    style={{ 
                      backgroundColor: colors.bgSection,
                      borderLeft: `${objectStyles['callout-default'].properties.accentWidth}px solid ${colors.brand}`
                    }}
                  >
                    <p className={`${serifFont} text-template-body`} style={{ color: colors.textBody }}>
                      💡 This is a sample callout with customized accent styling
                    </p>
                  </div>
                )}

                {/* TOC Demo */}
                {objectStyles['toc-item-default'] && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className={`${serifFont} text-template-body`} style={{ color: colors.textBody }}>
                        1. Introduction
                      </span>
                      <span className="text-template-body text-right" style={{ color: colors.textMuted }}>
                        {objectStyles['toc-item-default'].properties.dotLeader && '...........'} 3
                      </span>
                    </div>
                    <div className="flex justify-between items-center" style={{ paddingLeft: `${objectStyles['toc-item-default'].properties.indentUnit}px` }}>
                      <span className={`${serifFont} text-template-body`} style={{ color: colors.textBody }}>
                        1.1 Overview
                      </span>
                      <span className="text-template-body text-right" style={{ color: colors.textMuted }}>
                        {objectStyles['toc-item-default'].properties.dotLeader && '...........'} 5
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Snippet Demos */}
            {selectedSnippets.length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className={`${sansFont} text-template-h3 font-medium`} style={{ color: colors.brand }}>
                  Content Snippets
                </h4>
                
                {selectedSnippets.map(snippetId => {
                  const snippet = getSnippet(snippetId)
                  if (!snippet) return null

                  switch (snippet.id) {
                    case 'kpi-strip':
                      return (
                        <div key={snippetId} className="grid grid-cols-3 gap-3 p-3 rounded" style={{ backgroundColor: colors.bgSection }}>
                          {[
                            { label: 'Revenue', value: '$2.4M', change: '+12%' },
                            { label: 'Growth', value: '23%', change: '+5%' },
                            { label: 'Users', value: '45.2K', change: '+8%' }
                          ].map((metric, i) => (
                            <div key={i} className="text-center">
                              <div className={`${sansFont} text-template-h2 font-bold`} style={{ color: colors.brand }}>{metric.value}</div>
                              <div className="text-template-caption" style={{ color: colors.textMuted }}>{metric.label}</div>
                              <div className="text-template-caption font-medium" style={{ color: colors.brand }}>{metric.change}</div>
                            </div>
                          ))}
                        </div>
                      )
                    
                    case 'pull-quote':
                      return (
                        <blockquote 
                          key={snippetId}
                          className={`${serifFont} text-template-quote italic text-center border-l-4 pl-4 py-3`}
                          style={{ 
                            color: colors.textBody,
                            borderLeftColor: colors.brand,
                            backgroundColor: colors.bgSection
                          }}
                        >
                          "Design is not just what it looks like and feels like. Design is how it works."
                          <footer className="text-template-caption mt-2" style={{ color: colors.textMuted }}>
                            — Steve Jobs
                          </footer>
                        </blockquote>
                      )
                    
                    case 'cta-button':
                      return (
                        <div key={snippetId} className="text-center p-4 rounded" style={{ backgroundColor: colors.bgSection }}>
                          <h5 className={`${sansFont} text-template-h3 font-semibold mb-2`} style={{ color: colors.brand }}>
                            Ready to get started?
                          </h5>
                          <p className={`${serifFont} text-template-body mb-3`} style={{ color: colors.textBody }}>
                            Download our comprehensive guide today.
                          </p>
                          <button 
                            className="px-4 py-2 rounded font-medium text-sm"
                            style={{ 
                              backgroundColor: colors.brand, 
                              color: colors.bgPage 
                            }}
                          >
                            Download Free Guide
                          </button>
                        </div>
                      )
                    
                    default:
                      return null
                  }
                })}
              </div>
            )}
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

          {/* SVG Motif Overlay Demo */}
          {data.motifs && data.colorway && (
            <>
          {/* Background Pattern - only show if body master allows it */}
              {bodyMaster && (() => {
                const bgAsset = data.motifs.assets.find((a: any) => a.type === 'body-bg')
                const bgVariant = bgAsset?.variants.find((v: any) => v.id === data.motifs.selection['body-bg'])
                
                if (bgVariant) {
                  return (
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(bgVariant.svg)}")`,
                        backgroundRepeat: 'repeat',
                        backgroundSize: '100px 100px',
                        opacity: bodyMaster.layoutType === 'cover-fullbleed' ? 0.08 : 0.04
                      }}
                    />
                  )
                }
              })()}
              
              {/* Cover Shape */}
              {(() => {
                const shapeAsset = data.motifs.assets.find((a: any) => a.type === 'cover-shape')
                const shapeVariant = shapeAsset?.variants.find((v: any) => v.id === data.motifs.selection['cover-shape'])
                
                if (shapeVariant) {
                  return (
                    <div className="absolute top-2 right-2 w-8 h-6 opacity-30">
                      <img 
                        src={`data:image/svg+xml,${encodeURIComponent(shapeVariant.svg)}`}
                        alt="Cover shape"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )
                }
              })()}
            </>
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