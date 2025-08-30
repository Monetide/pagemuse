import html2canvas from 'html2canvas'

export interface PageComposition {
  id: 'cover' | 'body-1col' | 'body-2col' | 'data'
  name: string
  description: string
  content: any
}

export interface LoremSeed {
  headings: string[]
  paragraphs: string[]
  tableRows: string[][]
  imageSeeds: number[]
}

// Generate consistent lorem ipsum content based on seed
export function generateLoremContent(seed: number = 1): LoremSeed {
  const random = (s: number) => {
    const x = Math.sin(s) * 10000
    return x - Math.floor(x)
  }

  const headings = [
    'Executive Summary',
    'Strategic Overview', 
    'Market Analysis',
    'Performance Metrics',
    'Key Findings',
    'Recommendations',
    'Implementation Strategy',
    'Future Outlook'
  ]

  const paragraphTemplates = [
    'Our comprehensive analysis reveals significant opportunities for growth across multiple market segments. The data indicates a strong correlation between strategic initiatives and performance outcomes.',
    'Market research demonstrates evolving customer preferences and emerging trends that present both challenges and opportunities. Organizations must adapt their strategies to remain competitive.',
    'Performance metrics show consistent improvement across key indicators. The implementation of data-driven decision making has resulted in measurable gains in efficiency and effectiveness.',
    'Stakeholder feedback emphasizes the importance of sustainable practices and innovative solutions. Customer satisfaction remains a primary driver of long-term success.',
    'Competitive analysis reveals differentiation opportunities through enhanced service delivery and technological advancement. Market positioning requires strategic focus and resource allocation.',
    'Risk assessment identifies potential challenges while highlighting mitigation strategies. Proactive planning ensures organizational resilience and adaptability.',
    'Investment in technology infrastructure supports scalable growth and operational excellence. Digital transformation initiatives drive competitive advantage.',
    'Partnership strategies create value through collaborative innovation and shared expertise. Strategic alliances expand market reach and capabilities.'
  ]

  const tableData = [
    ['Q1 2024', '$2.4M', '15%', '95%', 'Completed'],
    ['Q2 2024', '$2.8M', '18%', '97%', 'In Progress'],
    ['Q3 2024', '$3.1M', '22%', '94%', 'Planned'],
    ['Q4 2024', '$3.5M', '25%', '96%', 'Planned'],
    ['Q1 2025', '$3.8M', '28%', '98%', 'Forecast'],
    ['Q2 2025', '$4.2M', '31%', '97%', 'Forecast'],
    ['Q3 2025', '$4.6M', '34%', '95%', 'Forecast'],
    ['Q4 2025', '$5.0M', '37%', '96%', 'Forecast']
  ]

  return {
    headings: headings.sort(() => random(seed++) - 0.5).slice(0, 4),
    paragraphs: paragraphTemplates.sort(() => random(seed++) - 0.5),
    tableRows: tableData.sort(() => random(seed++) - 0.5),
    imageSeeds: Array.from({ length: 5 }, (_, i) => Math.floor(random(seed + i) * 1000))
  }
}

export async function exportPageAsPNG(
  elementId: string, 
  filename: string,
  options: { width?: number; height?: number; scale?: number } = {}
): Promise<Blob> {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`)
  }

  const canvas = await html2canvas(element, {
    scale: options.scale || 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width: options.width || 595, // A4 width at 72dpi
    height: options.height || 842, // A4 height at 72dpi
    ...options
  })

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob'))
        }
      },
      'image/png',
      1.0
    )
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function generatePageCompositions(
  seedData: any,
  loremSeed: LoremSeed
): PageComposition[] {
  // Determine the body composition based on selected page masters
  const getBodyComposition = (): PageComposition => {
    const selectedMasters = seedData.pageMasters?.selected || []
    const hasTwoCol = selectedMasters.some((m: any) => m.id === 'body-2col')
    const hasOneCol = selectedMasters.some((m: any) => m.id === 'body-1col')
    const hasSidebar = selectedMasters.some((m: any) => m.id === 'body-2col-sidebar')
    
    // Priority logic: 2-col-sidebar > 2-col > 1-col
    if (hasSidebar) {
      return {
        id: 'body-2col',
        name: 'Body Content (2-Column + Sidebar)',
        description: 'Two-column layout with sidebar for enhanced content organization',
        content: {
          heading: loremSeed.headings[1],
          paragraphs: loremSeed.paragraphs.slice(0, 6),
          callout: {
            type: 'info',
            text: 'Key insights from our analysis reveal significant opportunities for strategic advancement and market expansion.'
          },
          figure: {
            caption: 'Figure 1: Market trends and performance indicators demonstrate consistent growth across all segments.',
            imageSeed: loremSeed.imageSeeds[0]
          }
        }
      }
    } else if (hasTwoCol) {
      return {
        id: 'body-2col',
        name: 'Body Content (2-Column)',
        description: 'Two-column layout with text and callouts',
        content: {
          heading: loremSeed.headings[1],
          paragraphs: loremSeed.paragraphs.slice(0, 6),
          callout: {
            type: 'info',
            text: 'Key insights from our analysis reveal significant opportunities for strategic advancement and market expansion.'
          },
          figure: {
            caption: 'Figure 1: Market trends and performance indicators demonstrate consistent growth across all segments.',
            imageSeed: loremSeed.imageSeeds[0]
          }
        }
      }
    } else {
      return {
        id: 'body-1col',
        name: 'Body Content (1-Column)',
        description: 'Single-column layout for focused content presentation',
        content: {
          heading: loremSeed.headings[1],
          paragraphs: loremSeed.paragraphs.slice(0, 8),
          callout: {
            type: 'info',
            text: 'Our comprehensive research demonstrates the value of focused content delivery in single-column format for enhanced readability and engagement.'
          },
          figure: {
            caption: 'Figure 1: Single-column layouts improve reading comprehension and user engagement metrics.',
            imageSeed: loremSeed.imageSeeds[0]
          }
        }
      }
    }
  }

  // Determine the data composition
  const getDataComposition = (): PageComposition => {
    const selectedMasters = seedData.pageMasters?.selected || []
    const hasDataMaster = selectedMasters.some((m: any) => m.id === 'data-portrait')
    
    if (hasDataMaster) {
      return {
        id: 'data',
        name: 'Data (Portrait)',
        description: 'Data layout optimized for tables and charts',
        content: {
          heading: loremSeed.headings[2],
          table: {
            headers: ['Period', 'Revenue', 'Growth', 'Satisfaction', 'Status'],
            rows: loremSeed.tableRows,
            caption: 'Table 1: Quarterly performance metrics and projected outcomes for the next planning period.'
          }
        }
      }
    } else {
      // Render body page with wide table if no data master selected
      return {
        id: 'data',
        name: 'Body with Data Table',
        description: 'Body layout with wide data table',
        content: {
          heading: loremSeed.headings[2],
          paragraphs: loremSeed.paragraphs.slice(0, 3),
          table: {
            headers: ['Period', 'Revenue', 'Growth', 'Satisfaction', 'Status', 'Trend', 'Notes'],
            rows: loremSeed.tableRows.map(row => [...row, '↗', 'On track']),
            caption: 'Table 1: Extended quarterly metrics showing performance trends and detailed analysis.'
          }
        }
      }
    }
  }

  return [
    {
      id: 'cover',
      name: 'Cover Page',
      description: 'Title page with branding and visual elements',
      content: {
        title: loremSeed.headings[0],
        subtitle: 'A comprehensive analysis and strategic overview',
        brandName: seedData.brandName || 'Your Brand',
        date: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        })
      }
    },
    getBodyComposition(),
    getDataComposition()
  ]
}

// Generate three canonical previews based on selected masters
export async function generateTemplatePreviewsAndAssets(
  seedData: any
): Promise<{ previews: Record<string, Blob>, assets: Record<string, string> }> {
  const loremSeed = generateLoremContent(1)
  const compositions = generatePageCompositions(seedData, loremSeed)
  
  const previews: Record<string, Blob> = {}
  const assets: Record<string, string> = {}
  
  // Generate PNG previews for each composition
  for (const composition of compositions) {
    try {
      const elementId = `page-${composition.id}`
      const filename = getCanonicalPreviewFilename(composition.id, seedData)
      
      // Wait for element to be rendered before capturing
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const blob = await exportPageAsPNG(elementId, filename, {
        width: 595,  // A4 width at 72dpi  
        height: 842, // A4 height at 72dpi
        scale: 2
      })
      
      previews[filename] = blob
    } catch (error) {
      console.warn(`Failed to generate preview for ${composition.id}:`, error)
      // Create placeholder blob
      previews[getCanonicalPreviewFilename(composition.id, seedData)] = new Blob(['placeholder'], { type: 'image/png' })
    }
  }
  
  // Export token-aware SVGs from motifs
  if (seedData.motifs?.assets) {
    const motifAssetTypes = ['body-bg', 'divider', 'cover-shape']
    
    motifAssetTypes.forEach(assetType => {
      const motifAsset = seedData.motifs.assets.find((asset: any) => asset.type === assetType)
      if (motifAsset?.variants?.[0]?.svg) {
        // Apply token-aware colors to SVG
        let svg = motifAsset.variants[0].svg
        
        // Replace color tokens with actual values from colorway
        if (seedData.colorway?.colors) {
          const colors = seedData.colorway.colors
          svg = svg.replace(/{{brand}}/g, colors.brand)
          svg = svg.replace(/{{brandSecondary}}/g, colors.brandSecondary)
          svg = svg.replace(/{{brandAccent}}/g, colors.brandAccent || colors.brand)
          svg = svg.replace(/{{textBody}}/g, colors.textBody)
          svg = svg.replace(/{{textMuted}}/g, colors.textMuted)
          svg = svg.replace(/{{borderSubtle}}/g, colors.borderSubtle)
        }
        
        assets[`${assetType}.svg`] = svg
      } else {
        // Create placeholder SVG
        assets[`${assetType}.svg`] = createPlaceholderSVG(assetType, seedData.colorway?.colors)
      }
    })
  } else {
    // Create placeholder SVGs for all three required assets
    assets['body-bg.svg'] = createPlaceholderSVG('body-bg', seedData.colorway?.colors)
    assets['divider.svg'] = createPlaceholderSVG('divider', seedData.colorway?.colors)
    assets['cover-shape.svg'] = createPlaceholderSVG('cover-shape', seedData.colorway?.colors)
  }
  
  return { previews, assets }
}

// Get canonical preview filename based on body master priority
function getCanonicalPreviewFilename(compositionId: string, seedData: any): string {
  if (compositionId === 'cover') return 'cover.png'
  if (compositionId === 'data') return 'data.png'
  
  // For body compositions, determine correct filename based on selection
  const selectedMasters = seedData.pageMasters?.selected || []
  const hasTwoCol = selectedMasters.some((m: any) => m.id === 'body-2col' || m.id === 'body-2col-sidebar')
  
  return hasTwoCol ? 'body-2col.png' : 'body-1col.png'
}

// Create placeholder SVG with token-aware colors
function createPlaceholderSVG(type: string, colors?: any): string {
  const brandColor = colors?.brand || '#8B5CF6'
  const subtleColor = colors?.borderSubtle || '#E5E5E5'
  
  switch (type) {
    case 'body-bg':
      return `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${subtleColor}" stroke-width="0.5" opacity="0.1"/>
    </pattern>
  </defs>
  <rect width="120" height="120" fill="url(#grid)"/>
</svg>`
    
    case 'divider':
      return `<svg width="300" height="4" viewBox="0 0 300 4" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="2" fill="${brandColor}" opacity="0.3"/>
  <rect width="60" height="4" fill="${brandColor}"/>
</svg>`
    
    case 'cover-shape':
      return `<svg width="120" height="80" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 10 L100 10 L110 40 L100 70 L20 70 L10 40 Z" fill="${brandColor}" opacity="0.1"/>
  <path d="M20 10 L100 10 L110 40 L100 70 L20 70 L10 40 Z" stroke="${brandColor}" stroke-width="2" fill="none"/>
</svg>`
    
    default:
      return `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="${brandColor}" opacity="0.1"/>
</svg>`
  }
}