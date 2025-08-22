import { PageMaster } from '@/lib/document-model'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PagePreviewProps {
  pageMaster: PageMaster
  sectionName: string
}

const PAGE_SIZES = {
  Letter: { width: 8.5, height: 11 },
  A4: { width: 8.27, height: 11.69 },
  Legal: { width: 8.5, height: 14 },
  Tabloid: { width: 11, height: 17 }
}

export const PagePreview = ({ pageMaster, sectionName }: PagePreviewProps) => {
  const pageSize = PAGE_SIZES[pageMaster.pageSize]
  
  // Scale factor to fit preview (max 300px width)
  const maxWidth = 300
  const scale = Math.min(maxWidth / pageSize.width, 400 / pageSize.height)
  
  const previewWidth = pageSize.width * scale
  const previewHeight = pageSize.height * scale
  
  // Convert margins to preview scale
  const margins = {
    top: pageMaster.margins.top * scale,
    right: pageMaster.margins.right * scale,
    bottom: pageMaster.margins.bottom * scale,
    left: pageMaster.margins.left * scale
  }
  
  // Content area dimensions
  const contentWidth = previewWidth - margins.left - margins.right
  const contentHeight = previewHeight - margins.top - margins.bottom
  
  // Column calculations
  const columnGap = pageMaster.columnGap * scale
  const totalGapWidth = (pageMaster.columns - 1) * columnGap
  const columnWidth = (contentWidth - totalGapWidth) / pageMaster.columns
  
  // Header/footer heights (fixed at 0.5 inches)
  const headerHeight = pageMaster.hasHeader ? 0.5 * scale : 0
  const footerHeight = pageMaster.hasFooter ? 0.5 * scale : 0
  
  // Baseline grid
  const gridSpacing = pageMaster.gridSpacing * scale
  const gridLines = pageMaster.baselineGrid ? 
    Math.floor(contentHeight / gridSpacing) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Badge variant="secondary">Preview</Badge>
          {sectionName}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div 
          className="relative border border-gray-300 bg-white shadow-sm"
          style={{ 
            width: previewWidth, 
            height: previewHeight 
          }}
        >
          {/* Page margins */}
          <div 
            className="absolute border border-dashed border-blue-300 bg-blue-50/20"
            style={{
              top: margins.top,
              left: margins.left,
              width: contentWidth,
              height: contentHeight
            }}
          >
            {/* Header */}
            {pageMaster.hasHeader && (
              <div 
                className="absolute top-0 left-0 right-0 border-b border-gray-200 bg-gray-100/50 flex items-center justify-center text-xs text-gray-500"
                style={{ height: headerHeight }}
              >
                Header
              </div>
            )}
            
            {/* Footer */}
            {pageMaster.hasFooter && (
              <div 
                className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-gray-100/50 flex items-center justify-center text-xs text-gray-500"
                style={{ height: footerHeight }}
              >
                Footer
              </div>
            )}
            
            {/* Content area with columns */}
            <div 
              className="absolute flex gap-0"
              style={{
                top: headerHeight,
                left: 0,
                right: 0,
                bottom: footerHeight,
                gap: columnGap
              }}
            >
              {Array.from({ length: pageMaster.columns }, (_, i) => (
                <div
                  key={i}
                  className="relative border border-dashed border-green-300 bg-green-50/20"
                  style={{ 
                    width: columnWidth,
                    height: '100%'
                  }}
                >
                  <div className="absolute inset-1 text-xs text-gray-400 flex items-center justify-center">
                    Col {i + 1}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Baseline grid */}
            {pageMaster.baselineGrid && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: gridLines }, (_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-gray-200/50"
                    style={{ top: (i + 1) * gridSpacing }}
                  />
                ))}
              </div>
            )}
            
            {/* Footnote area preview */}
            <div 
              className="absolute bottom-0 left-0 right-0 border-t border-gray-300/50 bg-gray-100/30 text-xs text-gray-400 flex items-center justify-center"
              style={{ height: 18 }}
            >
              Footnote area
            </div>
          </div>
          
          {/* Page info */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-1 rounded">
            {pageMaster.pageSize}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}