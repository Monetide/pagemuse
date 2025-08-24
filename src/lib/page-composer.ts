import html2canvas from 'html2canvas'

export interface PageComposition {
  id: 'cover' | 'body-2col' | 'data'
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
    {
      id: 'body-2col',
      name: 'Body Content (2-Column)',
      description: 'Multi-column layout with text and callouts',
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
    },
    {
      id: 'data',
      name: 'Data Appendix',
      description: 'Data tables and analytical content',
      content: {
        heading: loremSeed.headings[2],
        table: {
          headers: ['Period', 'Revenue', 'Growth', 'Satisfaction', 'Status'],
          rows: loremSeed.tableRows,
          caption: 'Table 1: Quarterly performance metrics and projected outcomes for the next planning period.'
        }
      }
    }
  ]
}