import { toast } from 'sonner'
import type { SeedFormData } from '@/components/admin/SeedForm'
import { exportPageAsPNG } from '@/lib/page-composer'

export interface TemplatePackage {
  'template.json': TemplateManifest
  assets: {
    'body-bg.svg': string
    'divider.svg': string
    'cover-shape.svg': string
  }
  previews: {
    'cover.png': Blob
    'body-2col.png': Blob
    'data.png': Blob
  }
}

export interface TemplateManifest {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  created: string
  
  // Core template data
  colorways: {
    primary: any
    warm?: any
    cool?: any
  }
  
  themeTokens: {
    typography: {
      fontPairings: any
      sizes: {
        h1: string
        h2: string
        h3: string
        body: string
        caption: string
        quote: string
      }
      lineHeights: {
        h1: number
        h2: number
        h3: number
        body: number
        caption: number
        quote: number
      }
    }
    spacing: {
      scale: number[]
      baseline: number
    }
    colors: any
  }
  
  pageMasters: {
    [key: string]: any // pm/cover-fullbleed-{paper}, pm/body-1col-{paper}, etc.
  }
  
  objectStyles: {
    figure: any
    table: any
    callout: any
    tocItem: any
  }
  
  snippets: string[]
  
  starterContent: {
    [key: string]: {
      type: 'snippet'
      name: string
      category: string
      content: string
      appliesTo: string[]
      industries: string[]
    }
  }
  
  layoutIntents: {
    [key: string]: {
      name: string
      description: string
      pageMaster: string
      allowedBlocks: string[]
    }
  }
  
  behaviors: {
    pagination: {
      keepWithNextOnHeadings: number
      widowsOrphans: number
      hyphenation: 'conservative' | 'balanced' | 'aggressive'
    }
    layout: {
      baselineGrid: boolean
      snapToGrid: boolean
      columnBalance: 'auto' | 'manual'
    }
  }
  
  tocDefaults: {
    includeLevels: string[]
    styling: {
      h1: any
      h2: any
      h3: any
    }
    pageNumbers: boolean
    dotLeaders: boolean
  }
  
  exportDefaults: {
    pdf: {
      dpi: number
      embedFonts: boolean
      colorSpace: 'RGB' | 'CMYK'
      compression: 'auto' | 'high' | 'medium' | 'low'
    }
    docx: {
      embedFonts: boolean
      preserveLayout: boolean
    }
  }
}

export async function packageTemplate(
  seedData: SeedFormData,
  templateName: string,
  templateDescription?: string
): Promise<TemplatePackage> {
  const templateId = crypto.randomUUID()
  
  // Create template manifest
  const manifest: TemplateManifest = {
    id: templateId,
    name: templateName,
    version: '1.0.0',
    description: templateDescription,
    author: 'Template Generator',
    created: new Date().toISOString(),
    
    colorways: {
      primary: seedData.colorway || {
        id: 'generated',
        name: 'Generated',
        colors: {
          brand: seedData.primaryColor || '#8B5CF6',
          brandSecondary: seedData.primaryColor || '#8B5CF6',
          textBody: '#1a1a1a',
          textMuted: '#666666',
          bgPage: '#ffffff',
          bgSection: '#f8f9fa',
          borderSubtle: '#e5e5e5'
        },
        isCompliant: true
      }
    },
    
    themeTokens: {
      typography: {
        fontPairings: seedData.typography || {
          id: 'inter-source-serif',
          name: 'Inter × Source Serif',
          sans: { name: 'Inter', family: 'font-inter' },
          serif: { name: 'Source Serif Pro', family: 'font-source-serif' }
        },
        sizes: {
          h1: '32pt',
          h2: '22pt', 
          h3: '16pt',
          body: '11pt',
          caption: '9.5pt',
          quote: '13pt'
        },
        lineHeights: {
          h1: 1.2,
          h2: 1.3,
          h3: 1.4,
          body: 1.5,
          caption: 1.35,
          quote: 1.4
        }
      },
      spacing: {
        scale: [4, 8, 12, 16, 24, 32],
        baseline: 12
      },
      colors: seedData.colorway?.colors || {}
    },
    
    pageMasters: (() => {
      const pageMasters: Record<string, any> = {}
      
      // Always include cover-fullbleed for both paper sizes
      pageMasters['pm/cover-fullbleed-letter'] = {
        pageSize: 'Letter',
        orientation: 'portrait',
        margins: { top: 72, right: 72, bottom: 72, left: 72 },
        columns: 1,
        columnGap: 0,
        hasHeader: false,
        hasFooter: false,
        baselineGrid: true,
        gridSpacing: 12
      }
      pageMasters['pm/cover-fullbleed-a4'] = {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 72, right: 72, bottom: 72, left: 72 },
        columns: 1,
        columnGap: 0,
        hasHeader: false,
        hasFooter: false,
        baselineGrid: true,
        gridSpacing: 12
      }
      
      // Add selected page masters from seedData
      if (seedData.pageMasters?.selected) {
        seedData.pageMasters.selected.forEach(layoutMaster => {
          const layoutType = layoutMaster.id
          if (layoutType === 'cover-fullbleed') return // Already added above
          
          const letterKey = `pm/${layoutType}-letter`
          const a4Key = `pm/${layoutType}-a4`
          
          switch (layoutType) {
            case 'body-1col':
              pageMasters[letterKey] = {
                pageSize: 'Letter',
                orientation: 'portrait',
                margins: { top: 72, right: 72, bottom: 72, left: 72 },
                columns: 1,
                columnGap: 0,
                hasHeader: true,
                hasFooter: true,
                baselineGrid: true,
                gridSpacing: 12
              }
              pageMasters[a4Key] = {
                pageSize: 'A4',
                orientation: 'portrait',
                margins: { top: 72, right: 72, bottom: 72, left: 72 },
                columns: 1,
                columnGap: 0,
                hasHeader: true,
                hasFooter: true,
                baselineGrid: true,
                gridSpacing: 12
              }
              break
              
            case 'body-2col':
              pageMasters[letterKey] = {
                pageSize: 'Letter',
                orientation: 'portrait',
                margins: { top: 72, right: 72, bottom: 72, left: 72 },
                columns: 2,
                columnGap: 18,
                hasHeader: true,
                hasFooter: true,
                baselineGrid: true,
                gridSpacing: 12
              }
              pageMasters[a4Key] = {
                pageSize: 'A4',
                orientation: 'portrait',
                margins: { top: 72, right: 72, bottom: 72, left: 72 },
                columns: 2,
                columnGap: 18,
                hasHeader: true,
                hasFooter: true,
                baselineGrid: true,
                gridSpacing: 12
              }
              break
              
            case 'body-2col-sidebar':
              pageMasters[letterKey] = {
                pageSize: 'Letter',
                orientation: 'portrait',
                margins: { top: 72, right: 72, bottom: 72, left: 72 },
                columns: 2,
                columnGap: 18,
                hasHeader: true,
                hasFooter: true,
                baselineGrid: true,
                gridSpacing: 12,
                sidebar: { width: 144, position: 'right', gap: 18 }
              }
              pageMasters[a4Key] = {
                pageSize: 'A4',
                orientation: 'portrait',
                margins: { top: 72, right: 72, bottom: 72, left: 72 },
                columns: 2,
                columnGap: 18,
                hasHeader: true,
                hasFooter: true,
                baselineGrid: true,
                gridSpacing: 12,
                sidebar: { width: 144, position: 'right', gap: 18 }
              }
              break
              
            case 'data-portrait':
              pageMasters[letterKey] = {
                pageSize: 'Letter',
                orientation: 'portrait',
                margins: { top: 54, right: 36, bottom: 54, left: 36 },
                columns: 1,
                columnGap: 0,
                hasHeader: true,
                hasFooter: true,
                baselineGrid: true,
                gridSpacing: 12,
                allowTableRotation: false
              }
              pageMasters[a4Key] = {
                pageSize: 'A4',
                orientation: 'portrait',
                margins: { top: 54, right: 36, bottom: 54, left: 36 },
                columns: 1,
                columnGap: 0,
                hasHeader: true,
                hasFooter: true,
                baselineGrid: true,
                gridSpacing: 12,
                allowTableRotation: false
              }
              break
          }
        })
      }
      
      return pageMasters
    })(),
    
    objectStyles: {
      figure: seedData.objectStyles?.styles?.['figure-default'] || {
        captionStyle: 'caption',
        spacingAbove: 16,
        spacingBelow: 16,
        width: 'column'
      },
      table: seedData.objectStyles?.styles?.['table-default'] || {
        headerRow: true,
        cellPadding: 8,
        grid: 'border/subtle',
        headerStyle: 'caption-bold',
        alternateRows: true,
        repeatHeader: true
      },
      callout: seedData.objectStyles?.styles?.['callout-default'] || {
        keepTogether: true,
        accentWidth: 4,
        variants: {
          info: { accentColor: 'brand', backgroundColor: 'bg-section' },
          tip: { accentColor: 'brand-secondary', backgroundColor: 'bg-section' },
          warning: { accentColor: 'brand-accent', backgroundColor: 'bg-section' }
        }
      },
      tocItem: seedData.objectStyles?.styles?.['toc-item-default'] || {
        leader: 'dots',
        numbers: 'right', 
        textStyle: 'body',
        indentUnit: 16
      }
    },
    
    snippets: seedData.snippets?.snippets || [],
    
    starterContent: (() => {
      const content: Record<string, any> = {}
      
      // Add snippets as starter content entries
      if (seedData.snippets?.snippets) {
        seedData.snippets.snippets.forEach(snippetId => {
          const snippet = getSnippetById(snippetId)
          if (snippet) {
            content[snippetId] = {
              type: 'snippet',
              name: snippet.name,
              category: snippet.category,
              content: snippet.content,
              appliesTo: snippet.docTypes,
              industries: snippet.industries || []
            }
          }
        })
      }
      
      return content
    })(),
    
    layoutIntents: (() => {
      const intents: Record<string, any> = {}
      
      // Generate layout intents from section presets
      if (seedData.sectionPresets?.mappings) {
        seedData.sectionPresets.mappings
          .filter(mapping => mapping.enabled)
          .forEach(mapping => {
            intents[mapping.sectionType] = {
              name: mapping.sectionName,
              description: `${mapping.sectionName} layout using ${mapping.masterName}`,
              pageMaster: mapping.pageMaster,
              allowedBlocks: getBlocksForSectionType(mapping.sectionType)
            }
          })
      } else {
        // Fallback defaults if no section presets
        intents.cover = {
          name: 'Cover Page',
          description: 'Full-page layout for document covers and title pages',
          pageMaster: 'cover-fullbleed',
          allowedBlocks: ['heading', 'paragraph', 'spacer', 'figure']
        }
        intents.body = {
          name: 'Body Content',
          description: 'Main document content layout',
          pageMaster: 'body-2col',
          allowedBlocks: ['heading', 'paragraph', 'ordered-list', 'unordered-list', 'quote', 'callout', 'figure', 'table']
        }
      }
      
      return intents
    })(),
    
    behaviors: {
      pagination: {
        keepWithNextOnHeadings: 1,
        widowsOrphans: 2,
        hyphenation: 'conservative'
      },
      layout: {
        baselineGrid: true,
        snapToGrid: true,
        columnBalance: 'auto'
      }
    },
    
    tocDefaults: {
      includeLevels: ['H1', 'H2', 'H3'],
      styling: {
        h1: { indent: 0, style: 'body-bold' },
        h2: { indent: 16, style: 'body' },
        h3: { indent: 32, style: 'body' }
      },
      pageNumbers: true,
      dotLeaders: true
    },
    
    exportDefaults: {
      pdf: {
        dpi: 300,
        embedFonts: true,
        colorSpace: 'RGB',
        compression: 'auto'
      },
      docx: {
        embedFonts: true,
        preserveLayout: true
      }
    }
  }

  // Extract assets from motifs
  const assets = {
    'body-bg.svg': '',
    'divider.svg': '', 
    'cover-shape.svg': ''
  }

  if (seedData.motifs?.assets) {
    for (const asset of seedData.motifs.assets) {
      const variant = asset.variants?.[0]
      if (variant?.svg) {
        const fileName = `${asset.type}.svg` as keyof typeof assets
        if (fileName in assets) {
          assets[fileName] = variant.svg
        }
      }
    }
  }

  // Generate preview images (placeholder - would need actual page renders)  
  const previews = {
    'cover.png': new Blob(['placeholder'], { type: 'image/png' }),
    'body-2col.png': new Blob(['placeholder'], { type: 'image/png' }),
    'data.png': new Blob(['placeholder'], { type: 'image/png' })
  }

  return {
    'template.json': manifest,
    assets,
    previews
  }
}

// Helper function to get snippet by ID
function getSnippetById(snippetId: string) {
  const snippets = [
    // Common snippets
    {
      id: 'kpi-3up',
      name: 'KPI 3-Up',
      category: 'common',
      docTypes: ['white-paper', 'report', 'annual-report', 'case-study'],
      content: `<div class="kpi-strip">
  <div class="kpi-item">
    <div class="kpi-value">$2.4M</div>
    <div class="kpi-label">Revenue</div>
    <div class="kpi-change">+12%</div>
  </div>
  <div class="kpi-item">
    <div class="kpi-value">23%</div>
    <div class="kpi-label">Growth</div>
    <div class="kpi-change">+5%</div>
  </div>
  <div class="kpi-item">
    <div class="kpi-value">45.2K</div>
    <div class="kpi-label">Users</div> 
    <div class="kpi-change">+8%</div>
  </div>
</div>`
    },
    {
      id: 'pull-quote',
      name: 'Pull Quote',
      category: 'common',
      docTypes: ['white-paper', 'report', 'annual-report', 'ebook', 'case-study'],
      content: `<blockquote class="pull-quote">
  <p>"Design is not just what it looks like and feels like. Design is how it works."</p>
  <footer>— Steve Jobs</footer>
</blockquote>`
    },
    {
      id: 'cta',
      name: 'Call to Action',
      category: 'common',
      docTypes: ['white-paper', 'ebook', 'case-study', 'proposal'],
      content: `<div class="cta-section">
  <h3>Ready to get started?</h3>
  <p>Download our comprehensive guide today.</p>
  <button class="cta-button">Download Free Guide</button>
</div>`
    },
    {
      id: 'disclaimer-finance',
      name: 'Financial Disclaimer',
      category: 'finance',
      docTypes: ['report', 'annual-report', 'white-paper'],
      industries: ['finance', 'insurance'],
      content: `<div class="disclaimer financial">
  <h4>Important Disclaimer</h4>
  <p>This material is for informational purposes only and should not be construed as investment advice. Past performance does not guarantee future results. All investments carry risk of loss.</p>
</div>`
    },
    {
      id: 'forward-looking-statement',
      name: 'Forward-Looking Statement',
      category: 'finance',
      docTypes: ['annual-report', 'report'],
      industries: ['finance', 'insurance', 'public-sector'],
      content: `<div class="forward-looking-disclaimer">
  <h4>Forward-Looking Statements</h4>
  <p>This document contains forward-looking statements. These statements involve risks and uncertainties that could cause actual results to differ materially from those expressed or implied.</p>
</div>`
    },
    {
      id: 'disclaimer-insurance',
      name: 'Insurance Disclaimer',
      category: 'insurance',
      docTypes: ['report', 'white-paper', 'proposal'],
      industries: ['insurance'],
      content: `<div class="disclaimer insurance">
  <h4>Coverage Disclaimer</h4>
  <p>Coverage details may vary by state and policy. This is a general overview and does not constitute a contract. Please refer to your policy documents for complete terms and conditions.</p>
</div>`
    },
    {
      id: 'terms-summary',
      name: 'Terms Summary',
      category: 'insurance',
      docTypes: ['proposal', 'report'],
      industries: ['insurance'],
      content: `<div class="terms-summary">
  <h4>Policy Summary</h4>
  <ul>
    <li><strong>Policy Term:</strong> 12 months</li>
    <li><strong>Premium:</strong> $XXX/month</li>
    <li><strong>Deductible:</strong> $XXX</li>
    <li><strong>Coverage Limit:</strong> $XXX</li>
  </ul>
</div>`
    },
    {
      id: 'hipaa-note',
      name: 'HIPAA Notice',
      category: 'healthcare',
      docTypes: ['report', 'white-paper', 'case-study'],
      industries: ['healthcare'],
      content: `<div class="hipaa-notice">
  <h4>Privacy Notice</h4>
  <p>All patient information in this document has been de-identified in accordance with HIPAA privacy regulations. No protected health information is disclosed.</p>
</div>`
    },
    {
      id: 'letter-from-ceo',
      name: 'Letter from CEO',
      category: 'annual-report',
      docTypes: ['annual-report'],
      content: `<div class="ceo-letter">
  <h2>Letter from the CEO</h2>
  <p>Dear Shareholders,</p>
  <p>I am pleased to present our annual results and reflect on a year of significant achievement and growth...</p>
  <p>Sincerely,<br/>[CEO Name]<br/>Chief Executive Officer</p>
</div>`
    },
    {
      id: 'governance-summary',
      name: 'Governance Summary',
      category: 'annual-report',
      docTypes: ['annual-report'],
      content: `<div class="governance-summary">
  <h3>Corporate Governance</h3>
  <p>Our Board consists of [X] independent directors who provide strategic oversight and ensure accountability to our shareholders.</p>
  <ul>
    <li>Board Independence: XX%</li>
    <li>Diversity: XX% diverse representation</li>
    <li>Committees: Audit, Compensation, Nominating</li>
  </ul>
</div>`
    }
  ]
  
  return snippets.find(s => s.id === snippetId)
}

// Helper function to get allowed blocks for section types
function getBlocksForSectionType(sectionType: string): string[] {
  switch (sectionType) {
    case 'cover':
      return ['heading', 'paragraph', 'spacer', 'figure']
    case 'toc':
      return ['table-of-contents', 'heading']
    case 'executive-summary':
      return ['heading', 'paragraph', 'quote', 'callout', 'figure']
    case 'body':
    case 'chapters':
    case 'narrative':
      return ['heading', 'paragraph', 'ordered-list', 'unordered-list', 'quote', 'callout', 'figure', 'table']
    case 'data-appendix':
    case 'metrics':
    case 'comparison':
      return ['heading', 'paragraph', 'table', 'figure', 'chart']
    case 'references':
      return ['heading', 'paragraph', 'ordered-list', 'unordered-list']
    case 'feature':
      return ['heading', 'paragraph', 'quote', 'callout', 'figure', 'table']
    default:
      return ['heading', 'paragraph', 'ordered-list', 'unordered-list', 'quote', 'callout', 'figure', 'table']
  }
}

export async function saveTemplateDraft(
  templatePackage: TemplatePackage,
  options: {
    scope: 'workspace' | 'global'
    workspaceId?: string
    brandName?: string
  }
): Promise<string> {
  try {
    const { supabase } = await import('@/integrations/supabase/client')
    
    const templateId = templatePackage['template.json'].id
    
    // Prepare template data based on scope
    const templateData: any = {
      id: templateId,
      name: templatePackage['template.json'].name,
      description: templatePackage['template.json'].description,
      status: 'draft',
      metadata: templatePackage['template.json'] as any,
      category: 'generated',
      scope: options.scope,
      is_global: false, // All drafts start as non-global
      user_id: (await supabase.auth.getUser()).data.user?.id
    }

    // Add workspace_id only for workspace-scoped templates
    if (options.scope === 'workspace') {
      if (!options.workspaceId) {
        throw new Error('Workspace ID is required for workspace-scoped templates')
      }
      templateData.workspace_id = options.workspaceId
    }
    
    // Save template to database
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .insert(templateData)
      .select()
      .single()

    if (templateError) {
      console.error('Error saving template:', templateError)
      throw new Error(`Failed to save template: ${templateError.message}`)
    }

    // Upload assets to Supabase storage if we have any
    if (Object.values(templatePackage.assets).some(asset => asset)) {
      // Upload SVG assets to template-assets bucket
      // This would be implemented in a real scenario
      console.log('Assets would be uploaded to storage:', Object.keys(templatePackage.assets))
    }
    
    return templateId
  } catch (error) {
    console.error('Error saving template draft:', error)
    throw new Error('Failed to save template draft')
  }
}