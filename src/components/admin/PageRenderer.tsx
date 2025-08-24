import React from 'react'
import type { SeedFormData } from '@/components/admin/SeedForm'
import type { PageComposition } from '@/lib/page-composer'
import { getPageMasterPreset } from '@/lib/page-masters'
import { DEFAULT_OBJECT_STYLES } from '@/lib/object-styles'

interface PageRendererProps {
  composition: PageComposition
  seedData: SeedFormData
  className?: string
  scale?: number
}

export function PageRenderer({ composition, seedData, className = '', scale = 1 }: PageRendererProps) {
  const sansFont = seedData.typography?.sans.family || 'font-inter'
  const serifFont = seedData.typography?.serif.family || 'font-source-serif'
  
  // Get colors
  const colors = seedData.colorway ? seedData.colorway.colors : {
    brand: seedData.primaryColor || '#8B5CF6',
    brandSecondary: seedData.primaryColor || '#8B5CF6',
    textBody: '#1a1a1a',
    textMuted: '#666666',
    bgPage: '#ffffff',
    bgSection: '#f8f9fa',
    borderSubtle: '#e5e5e5'
  }

  // Get page masters
  const coverMaster = seedData.pageMasters?.cover ? getPageMasterPreset(seedData.pageMasters.cover) : null
  const bodyMaster = seedData.pageMasters?.body ? getPageMasterPreset(seedData.pageMasters.body) : null

  // Get object styles
  const objectStyles = seedData.objectStyles?.styles || {}
  const calloutStyle = objectStyles['callout-default'] || DEFAULT_OBJECT_STYLES.find(s => s.id === 'callout-default')!
  const figureStyle = objectStyles['figure-default'] || DEFAULT_OBJECT_STYLES.find(s => s.id === 'figure-default')!
  const tableStyle = objectStyles['table-default'] || DEFAULT_OBJECT_STYLES.find(s => s.id === 'table-default')!

  // Get motifs
  const getMotifSvg = (type: string) => {
    if (!seedData.motifs) return null
    const asset = seedData.motifs.assets.find((a: any) => a.type === type)
    const variant = asset?.variants.find((v: any) => v.id === seedData.motifs.selection[type])
    return variant?.svg || null
  }

  const renderCoverPage = () => (
    <div 
      className={`relative w-full h-full bg-white overflow-hidden ${className}`}
      style={{ 
        backgroundColor: colors.bgPage,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        fontFamily: sansFont.replace('font-', '')
      }}
    >
      {/* Background pattern */}
      {getMotifSvg('body-bg') && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(getMotifSvg('body-bg')!)}")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '120px 120px',
            opacity: 0.03
          }}
        />
      )}

      {/* Cover shape */}
      {getMotifSvg('cover-shape') && (
        <div className="absolute top-8 right-8 w-24 h-16 opacity-20">
          <img 
            src={`data:image/svg+xml,${encodeURIComponent(getMotifSvg('cover-shape')!)}`}
            alt="Cover shape"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-16">
        <div className="max-w-2xl">
          {/* Brand name */}
          <div 
            className="text-lg font-medium mb-8 tracking-wide"
            style={{ color: colors.brand }}
          >
            {composition.content.brandName}
          </div>

          {/* Main title */}
          <h1 
            className="text-6xl font-bold leading-tight mb-6"
            style={{ color: colors.brand }}
          >
            {composition.content.title}
          </h1>

          {/* Subtitle */}
          <p 
            className="text-xl leading-relaxed mb-12"
            style={{ color: colors.textBody }}
          >
            {composition.content.subtitle}
          </p>

          {/* Date */}
          <div 
            className="text-base"
            style={{ color: colors.textMuted }}
          >
            {composition.content.date}
          </div>
        </div>
      </div>
    </div>
  )

  const renderBodyPage = () => (
    <div 
      className={`relative w-full h-full bg-white overflow-hidden ${className}`}
      style={{ 
        backgroundColor: colors.bgPage,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        fontFamily: serifFont.replace('font-', '')
      }}
    >
      {/* Header */}
      <div 
        className="h-12 border-b flex items-center px-8"
        style={{ borderColor: colors.borderSubtle }}
      >
        <div 
          className={`${sansFont} text-sm`}
          style={{ color: colors.textMuted }}
        >
          {seedData.brandName || 'Document Title'}
        </div>
        <div className="ml-auto text-sm" style={{ color: colors.textMuted }}>
          Page 2
        </div>
      </div>

      {/* Content area */}
      <div className="p-8">
        {/* Section heading */}
        <h2 
          className={`${sansFont} text-3xl font-semibold mb-6`}
          style={{ color: colors.brand }}
        >
          {composition.content.heading}
        </h2>

        {/* Divider */}
        {getMotifSvg('divider') && (
          <div className="w-full h-px mb-6 opacity-30">
            <img 
              src={`data:image/svg+xml,${encodeURIComponent(getMotifSvg('divider')!)}`}
              alt="Divider"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Two-column content */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-4">
            {composition.content.paragraphs.slice(0, 3).map((paragraph: string, index: number) => (
              <p 
                key={index}
                className="text-sm leading-relaxed"
                style={{ color: colors.textBody }}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {composition.content.paragraphs.slice(3, 5).map((paragraph: string, index: number) => (
              <p 
                key={index}
                className="text-sm leading-relaxed"
                style={{ color: colors.textBody }}
              >
                {paragraph}
              </p>
            ))}
            
            {/* Callout */}
            <div 
              className="rounded p-4 mt-4"
              style={{ 
                backgroundColor: colors.bgSection,
                borderLeft: `${calloutStyle.properties.accentWidth}px solid ${colors.brand}`
              }}
            >
              <p className="text-sm" style={{ color: colors.textBody }}>
                💡 {composition.content.callout.text}
              </p>
            </div>
          </div>
        </div>

        {/* Figure */}
        <div className="mt-8">
          <div 
            className="w-full h-32 rounded border-2 border-dashed flex items-center justify-center mb-2"
            style={{ borderColor: colors.borderSubtle, backgroundColor: colors.bgSection }}
          >
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 text-2xl">📊</div>
              <div className="text-xs" style={{ color: colors.textMuted }}>
                Chart/Figure Placeholder
              </div>
            </div>
          </div>
          <p 
            className="text-xs italic"
            style={{ color: colors.textMuted }}
          >
            {composition.content.figure.caption}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-8 border-t flex items-center px-8"
        style={{ borderColor: colors.borderSubtle }}
      >
        <div className="text-xs" style={{ color: colors.textMuted }}>
          Confidential
        </div>
      </div>
    </div>
  )

  const renderDataPage = () => (
    <div 
      className={`relative w-full h-full bg-white overflow-hidden ${className}`}
      style={{ 
        backgroundColor: colors.bgPage,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        fontFamily: serifFont.replace('font-', '')
      }}
    >
      {/* Header */}
      <div 
        className="h-12 border-b flex items-center px-8"
        style={{ borderColor: colors.borderSubtle }}
      >
        <div 
          className={`${sansFont} text-sm`}
          style={{ color: colors.textMuted }}
        >
          {seedData.brandName || 'Document Title'} - Data Appendix
        </div>
        <div className="ml-auto text-sm" style={{ color: colors.textMuted }}>
          Page 15
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Section heading */}
        <h2 
          className={`${sansFont} text-3xl font-semibold mb-6`}
          style={{ color: colors.brand }}
        >
          {composition.content.heading}
        </h2>

        {/* Table */}
        <div className="border rounded overflow-hidden mb-4" style={{ borderColor: colors.borderSubtle }}>
          {/* Header row */}
          <div 
            className="grid grid-cols-5 font-medium text-xs border-b"
            style={{ 
              backgroundColor: colors.bgSection,
              borderColor: colors.borderSubtle,
              padding: `${tableStyle.properties.cellPadding}px`
            }}
          >
            {composition.content.table.headers.map((header: string, index: number) => (
              <div key={index} style={{ color: colors.textBody }}>
                {header}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {composition.content.table.rows.map((row: string[], rowIndex: number) => (
            <div 
              key={rowIndex}
              className={`grid grid-cols-5 text-xs border-b ${rowIndex % 2 === 0 ? '' : 'bg-opacity-50'}`}
              style={{ 
                backgroundColor: rowIndex % 2 === 1 && tableStyle.properties.alternateRows ? colors.bgSection : 'transparent',
                borderColor: colors.borderSubtle,
                padding: `${tableStyle.properties.cellPadding}px`
              }}
            >
              {row.map((cell: string, cellIndex: number) => (
                <div key={cellIndex} style={{ color: colors.textBody }}>
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Table caption */}
        <p 
          className="text-xs italic"
          style={{ color: colors.textMuted }}
        >
          {composition.content.table.caption}
        </p>
      </div>

      {/* Footer */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-8 border-t flex items-center px-8"
        style={{ borderColor: colors.borderSubtle }}
      >
        <div className="text-xs" style={{ color: colors.textMuted }}>
          Confidential
        </div>
      </div>
    </div>
  )

  switch (composition.id) {
    case 'cover':
      return renderCoverPage()
    case 'body-2col':
      return renderBodyPage()
    case 'data':
      return renderDataPage()
    default:
      return <div>Unknown page type</div>
  }
}

export default PageRenderer