import { 
  SemanticDocument, 
  Section, 
  Flow, 
  Block, 
  PageMaster, 
  LayoutIntent,
  Style,
  Theme,
  createDocument,
  createSection,
  createFlow,
  createBlock,
  addSectionToDocument,
  addFlowToSection,
  addBlockToFlow
} from './document-model'

/**
 * Template Model - Defines reusable document templates
 */

export interface TemplateColorPalette {
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  accent: string
  accentForeground: string
  background: string
  foreground: string
  muted: string
  mutedForeground: string
  border: string
  destructive: string
  destructiveForeground: string
  success: string
  successForeground: string
  warning: string
  warningForeground: string
}

export interface TemplateColorway {
  id: string
  name: string
  description: string
  palette: TemplateColorPalette
  isDefault?: boolean
}

export interface TemplateThemeTokens {
  colorways: TemplateColorway[]
  activeColorway: string
  typography: {
    fontFamily: {
      heading: string
      body: string
      mono: string
    }
    fontSize: {
      xs: string
      sm: string
      base: string
      lg: string
      xl: string
      '2xl': string
      '3xl': string
      '4xl': string
    }
    lineHeight: {
      tight: number
      normal: number
      relaxed: number
    }
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
  }
  effects: {
    shadows: Record<string, string>
    borders: Record<string, string>
    animations: Record<string, string>
  }
}

export interface TemplateObjectStyles {
  headings: {
    h1: Style
    h2: Style
    h3: Style
    h4: Style
    h5: Style
    h6: Style
  }
  paragraphs: {
    body: Style
    lead: Style
    caption: Style
    quote: Style
  }
  lists: {
    bulleted: Style
    numbered: Style
    definition: Style
  }
  tables: {
    default: Style
    striped: Style
    bordered: Style
  }
  figures: {
    image: Style
    chart: Style
    diagram: Style
  }
  callouts: {
    info: Style
    warning: Style
    error: Style
    success: Style
  }
}

export interface TemplateBehaviors {
  autoNumbering: {
    headings: boolean
    figures: boolean
    tables: boolean
    equations: boolean
  }
  crossReferences: {
    enableAutoText: boolean
    updateOnRename: boolean
    showPageNumbers: boolean
  }
  validation: {
    requireAltText: boolean
    checkSpelling: boolean
    enforceStyles: boolean
  }
  collaboration: {
    allowComments: boolean
    trackChanges: boolean
    shareSettings: 'private' | 'team' | 'public'
  }
}

export interface TemplateValidationPreset {
  id: string
  name: string
  description: string
  rules: {
    typography: {
      minBodyFontSize: number // in points
      minHeadingFontSize: number
      maxLineLength: number // in characters
      hyphenationEnabled: boolean
      requireProperHeadingHierarchy: boolean
    }
    accessibility: {
      minContrastRatio: number // WCAG standard (4.5:1 for AA, 7:1 for AAA)
      requireAltText: boolean
      requireDescriptiveLinks: boolean
      maxClickTargetSize: number // in pixels
    }
    layout: {
      minMargins: number // in inches
      maxColumnsPerPage: number
      requireConsistentSpacing: boolean
      enforceGridAlignment: boolean
    }
    content: {
      maxOrphans: number // lines at bottom of page
      maxWidows: number // lines at top of page
      requireCaptions: boolean
      enforceNumberingConsistency: boolean
    }
    brand: {
      enforceColorPalette: boolean
      requireBrandElements: boolean
      enforceTypographySystem: boolean
    }
  }
  severity: {
    typography: 'error' | 'warning' | 'info'
    accessibility: 'error' | 'warning' | 'info'
    layout: 'error' | 'warning' | 'info'
    content: 'error' | 'warning' | 'info'
    brand: 'error' | 'warning' | 'info'
  }
  autoFix: {
    typography: boolean
    accessibility: boolean
    layout: boolean
    content: boolean
    brand: boolean
  }
}

export interface TemplateNumbering {
  headings: {
    enabled: boolean
    format: string // e.g., "1.1.1", "I.A.1", "Chapter {n}"
    startLevel: number
    separator: string
  }
  figures: {
    enabled: boolean
    prefix: string // e.g., "Figure", "Fig."
    format: string // e.g., "{prefix} {n}", "{prefix} {section}.{n}"
  }
  tables: {
    enabled: boolean
    prefix: string
    format: string
  }
  equations: {
    enabled: boolean
    prefix: string
    format: string
  }
  footnotes: {
    enabled: boolean
    format: 'numeric' | 'alphabetic' | 'roman'
    restart: 'never' | 'section' | 'page'
  }
}

export interface TemplateTOCDefaults {
  enabled: boolean
  title: string
  includePageNumbers: boolean
  levels: {
    min: number
    max: number
  }
  styles: {
    title: Style
    level1: Style
    level2: Style
    level3: Style
  }
  formatting: {
    indentPerLevel: string
    tabStops: string[]
    dotLeader: boolean
  }
}

export interface TemplateExportDefaults {
  pdf: {
    pageSize: string
    margins: { top: number; right: number; bottom: number; left: number }
    includeMetadata: boolean
    embedFonts: boolean
    quality: 'standard' | 'high' | 'print'
  }
  docx: {
    compatibility: 'modern' | 'legacy'
    includeComments: boolean
    trackChanges: boolean
  }
  html: {
    includeCSS: boolean
    embedImages: boolean
    responsiveDesign: boolean
  }
}

export interface TemplateSnippet {
  id: string
  name: string
  description: string
  category: string
  keywords: string[]
  content: Block[]
  insertionPoint: 'cursor' | 'section-start' | 'section-end' | 'document-end'
}

export interface TemplateStarterContent {
  sections: {
    name: string
    layoutIntent: LayoutIntent
    flows: {
      name: string
      type: Flow['type']
      blocks: {
        type: Block['type']
        content: any
        placeholder?: string
        required?: boolean
      }[]
    }[]
  }[]
}

export interface Template {
  id: string
  name: string
  description: string
  tags: string[]
  category: string
  version: string
  author: string
  createdAt: Date
  updatedAt: Date
  
  // Structure
  sections: Section[]
  pageMasters: Record<string, PageMaster>
  layoutIntents: LayoutIntent[]
  
  // Styling
  themeTokens: TemplateThemeTokens
  objectStyles: TemplateObjectStyles
  
  // Configuration
  behaviors: TemplateBehaviors
  numbering: TemplateNumbering
  validationPreset: TemplateValidationPreset
  tocDefaults: TemplateTOCDefaults
  exportDefaults: TemplateExportDefaults
  
  // Content
  snippets: TemplateSnippet[]
  starterContent: TemplateStarterContent
  
  // Metadata
  metadata: {
    previewImage?: string
    usageCount: number
    isPublic: boolean
    permissions: string[]
  }
}

/**
 * Factory function to create a new template
 */
export function createTemplate(
  name: string,
  description: string = '',
  category: string = 'general'
): Template {
  return {
    id: crypto.randomUUID(),
    name,
    description,
    tags: [],
    category,
    version: '1.0.0',
    author: 'Anonymous',
    createdAt: new Date(),
    updatedAt: new Date(),
    
    sections: [],
    pageMasters: {},
    layoutIntents: ['body'],
    
    themeTokens: createDefaultThemeTokens(),
    objectStyles: createDefaultObjectStyles(),
    
    behaviors: createDefaultBehaviors(),
    numbering: createDefaultNumbering(),
    validationPreset: createDefaultValidationPreset(),
    tocDefaults: createDefaultTOCDefaults(),
    exportDefaults: createDefaultExportDefaults(),
    
    snippets: createDefaultSnippets(),
    starterContent: {
      sections: []
    },
    
    metadata: {
      usageCount: 0,
      isPublic: false,
      permissions: []
    }
  }
}

/**
 * Create default colorways
 */
function createDefaultColorways(): TemplateColorway[] {
  return [
    {
      id: 'default',
      name: 'Professional',
      description: 'Clean and professional dark blue theme',
      palette: {
        primary: 'hsl(222, 84%, 5%)',
        primaryForeground: 'hsl(0, 0%, 100%)',
        secondary: 'hsl(210, 40%, 95%)',
        secondaryForeground: 'hsl(222, 84%, 5%)',
        accent: 'hsl(210, 40%, 8%)',
        accentForeground: 'hsl(0, 0%, 100%)',
        background: 'hsl(0, 0%, 100%)',
        foreground: 'hsl(222, 84%, 5%)',
        muted: 'hsl(210, 40%, 95%)',
        mutedForeground: 'hsl(215, 20%, 65%)',
        border: 'hsl(214, 32%, 91%)',
        destructive: 'hsl(0, 84%, 60%)',
        destructiveForeground: 'hsl(0, 0%, 100%)',
        success: 'hsl(142, 76%, 36%)',
        successForeground: 'hsl(0, 0%, 100%)',
        warning: 'hsl(38, 92%, 50%)',
        warningForeground: 'hsl(0, 0%, 100%)'
      },
      isDefault: true
    },
    {
      id: 'ocean',
      name: 'Ocean Blue',
      description: 'Calming ocean-inspired blue palette',
      palette: {
        primary: 'hsl(200, 100%, 28%)',
        primaryForeground: 'hsl(0, 0%, 100%)',
        secondary: 'hsl(200, 50%, 95%)',
        secondaryForeground: 'hsl(200, 100%, 28%)',
        accent: 'hsl(195, 100%, 35%)',
        accentForeground: 'hsl(0, 0%, 100%)',
        background: 'hsl(0, 0%, 100%)',
        foreground: 'hsl(200, 50%, 10%)',
        muted: 'hsl(200, 50%, 95%)',
        mutedForeground: 'hsl(200, 30%, 50%)',
        border: 'hsl(200, 50%, 85%)',
        destructive: 'hsl(0, 84%, 60%)',
        destructiveForeground: 'hsl(0, 0%, 100%)',
        success: 'hsl(160, 84%, 39%)',
        successForeground: 'hsl(0, 0%, 100%)',
        warning: 'hsl(38, 92%, 50%)',
        warningForeground: 'hsl(0, 0%, 100%)'
      }
    },
    {
      id: 'forest',
      name: 'Forest Green',
      description: 'Natural green theme for sustainability reports',
      palette: {
        primary: 'hsl(140, 100%, 20%)',
        primaryForeground: 'hsl(0, 0%, 100%)',
        secondary: 'hsl(140, 30%, 95%)',
        secondaryForeground: 'hsl(140, 100%, 20%)',
        accent: 'hsl(120, 100%, 25%)',
        accentForeground: 'hsl(0, 0%, 100%)',
        background: 'hsl(0, 0%, 100%)',
        foreground: 'hsl(140, 50%, 10%)',
        muted: 'hsl(140, 30%, 95%)',
        mutedForeground: 'hsl(140, 20%, 50%)',
        border: 'hsl(140, 30%, 85%)',
        destructive: 'hsl(0, 84%, 60%)',
        destructiveForeground: 'hsl(0, 0%, 100%)',
        success: 'hsl(142, 76%, 36%)',
        successForeground: 'hsl(0, 0%, 100%)',
        warning: 'hsl(45, 93%, 47%)',
        warningForeground: 'hsl(0, 0%, 100%)'
      }
    }
  ]
}

/**
 * Default theme tokens
 */
export function createDefaultThemeTokens(): TemplateThemeTokens {
  const colorways = createDefaultColorways()
  
  return {
    colorways,
    activeColorway: 'default',
    typography: {
      fontFamily: {
        heading: 'Inter, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
        mono: 'JetBrains Mono, monospace'
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem'
      },
      lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75
      }
    },
    spacing: {
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem'
    },
    effects: {
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
      },
      borders: {
        thin: '1px solid',
        medium: '2px solid',
        thick: '4px solid'
      },
      animations: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideUp: 'slideUp 0.3s ease-out'
      }
    }
  }
}

/**
 * Get active colorway from theme tokens
 */
export function getActiveColorway(themeTokens: TemplateThemeTokens): TemplateColorway | null {
  return themeTokens.colorways.find(c => c.id === themeTokens.activeColorway) || 
         themeTokens.colorways.find(c => c.isDefault) ||
         themeTokens.colorways[0] ||
         null
}

/**
 * Switch colorway in theme tokens
 */
export function switchColorway(themeTokens: TemplateThemeTokens, colorwayId: string): TemplateThemeTokens {
  const colorway = themeTokens.colorways.find(c => c.id === colorwayId)
  if (!colorway) {
    return themeTokens
  }

  return {
    ...themeTokens,
    activeColorway: colorwayId
  }
}

/**
 * Default object styles
 */
function createDefaultObjectStyles(): TemplateObjectStyles {
  return {
    headings: {
      h1: { id: 'h1', name: 'Heading 1', category: 'typography', properties: { fontFamily: 'Inter', fontSize: '2.25rem', fontWeight: 'bold', lineHeight: 1.25, color: 'hsl(222, 84%, 5%)', marginTop: '2rem', marginBottom: '1rem' } },
      h2: { id: 'h2', name: 'Heading 2', category: 'typography', properties: { fontFamily: 'Inter', fontSize: '1.875rem', fontWeight: 'semibold', lineHeight: 1.3, color: 'hsl(222, 84%, 5%)', marginTop: '1.5rem', marginBottom: '0.75rem' } },
      h3: { id: 'h3', name: 'Heading 3', category: 'typography', properties: { fontFamily: 'Inter', fontSize: '1.5rem', fontWeight: 'semibold', lineHeight: 1.35, color: 'hsl(222, 84%, 5%)', marginTop: '1.25rem', marginBottom: '0.5rem' } },
      h4: { id: 'h4', name: 'Heading 4', category: 'typography', properties: { fontFamily: 'Inter', fontSize: '1.25rem', fontWeight: 'medium', lineHeight: 1.4, color: 'hsl(222, 84%, 5%)', marginTop: '1rem', marginBottom: '0.5rem' } },
      h5: { id: 'h5', name: 'Heading 5', category: 'typography', properties: { fontFamily: 'Inter', fontSize: '1.125rem', fontWeight: 'medium', lineHeight: 1.45, color: 'hsl(222, 84%, 5%)', marginTop: '0.75rem', marginBottom: '0.25rem' } },
      h6: { id: 'h6', name: 'Heading 6', category: 'typography', properties: { fontFamily: 'Inter', fontSize: '1rem', fontWeight: 'medium', lineHeight: 1.5, color: 'hsl(210, 40%, 8%)', marginTop: '0.5rem', marginBottom: '0.25rem' } }
    },
    paragraphs: {
      body: { id: 'p-body', name: 'Body Text', category: 'typography', properties: { fontFamily: 'Inter', fontSize: '1rem', lineHeight: 1.5, color: 'hsl(222, 84%, 5%)', marginBottom: '1rem' } },
      lead: { id: 'p-lead', name: 'Lead Text', category: 'typography', properties: { fontFamily: 'Inter', fontSize: '1.125rem', lineHeight: 1.6, color: 'hsl(210, 40%, 8%)', marginBottom: '1.25rem' } },
      caption: { id: 'p-caption', name: 'Caption', category: 'typography', properties: { fontFamily: 'Inter', fontSize: '0.875rem', lineHeight: 1.4, color: 'hsl(215, 20%, 65%)', fontStyle: 'italic' } },
      quote: { id: 'p-quote', name: 'Quote', category: 'typography', properties: { fontFamily: 'Inter', fontSize: '1.125rem', lineHeight: 1.6, color: 'hsl(210, 40%, 8%)', fontStyle: 'italic', paddingLeft: '1.5rem', borderLeft: '4px solid hsl(214, 32%, 91%)' } }
    },
    lists: {
      bulleted: { id: 'list-bulleted', name: 'Bulleted List', category: 'layout', properties: { marginBottom: '1rem', paddingLeft: '1.5rem' } },
      numbered: { id: 'list-numbered', name: 'Numbered List', category: 'layout', properties: { marginBottom: '1rem', paddingLeft: '1.5rem' } },
      definition: { id: 'list-definition', name: 'Definition List', category: 'layout', properties: { marginBottom: '1rem' } }
    },
    tables: {
      default: { id: 'table-default', name: 'Default Table', category: 'layout', properties: { width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' } },
      striped: { id: 'table-striped', name: 'Striped Table', category: 'layout', properties: { width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' } },
      bordered: { id: 'table-bordered', name: 'Bordered Table', category: 'layout', properties: { width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', border: '1px solid hsl(214, 32%, 91%)' } }
    },
    figures: {
      image: { id: 'figure-image', name: 'Image Figure', category: 'layout', properties: { marginBottom: '1.5rem', textAlign: 'center' } },
      chart: { id: 'figure-chart', name: 'Chart Figure', category: 'layout', properties: { marginBottom: '1.5rem', textAlign: 'center' } },
      diagram: { id: 'figure-diagram', name: 'Diagram Figure', category: 'layout', properties: { marginBottom: '1.5rem', textAlign: 'center' } }
    },
    callouts: {
      info: { id: 'callout-info', name: 'Info Callout', category: 'layout', properties: { padding: '1rem', marginBottom: '1rem', backgroundColor: 'hsl(214, 100%, 97%)', borderLeft: '4px solid hsl(214, 100%, 70%)', borderRadius: '0.375rem' } },
      warning: { id: 'callout-warning', name: 'Warning Callout', category: 'layout', properties: { padding: '1rem', marginBottom: '1rem', backgroundColor: 'hsl(48, 100%, 97%)', borderLeft: '4px solid hsl(48, 100%, 70%)', borderRadius: '0.375rem' } },
      error: { id: 'callout-error', name: 'Error Callout', category: 'layout', properties: { padding: '1rem', marginBottom: '1rem', backgroundColor: 'hsl(0, 100%, 97%)', borderLeft: '4px solid hsl(0, 100%, 70%)', borderRadius: '0.375rem' } },
      success: { id: 'callout-success', name: 'Success Callout', category: 'layout', properties: { padding: '1rem', marginBottom: '1rem', backgroundColor: 'hsl(142, 100%, 97%)', borderLeft: '4px solid hsl(142, 100%, 70%)', borderRadius: '0.375rem' } }
    }
  }
}

/**
 * Default behaviors
 */
function createDefaultBehaviors(): TemplateBehaviors {
  return {
    autoNumbering: {
      headings: false,
      figures: true,
      tables: true,
      equations: true
    },
    crossReferences: {
      enableAutoText: true,
      updateOnRename: true,
      showPageNumbers: true
    },
    validation: {
      requireAltText: true,
      checkSpelling: false,
      enforceStyles: false
    },
    collaboration: {
      allowComments: true,
      trackChanges: false,
      shareSettings: 'private'
    }
  }
}

/**
 * Default validation preset
 */
function createDefaultValidationPreset(): TemplateValidationPreset {
  return {
    id: 'default',
    name: 'Standard Validation',
    description: 'Balanced validation rules for professional documents',
    rules: {
      typography: {
        minBodyFontSize: 10.5,
        minHeadingFontSize: 12,
        maxLineLength: 80,
        hyphenationEnabled: false,
        requireProperHeadingHierarchy: true
      },
      accessibility: {
        minContrastRatio: 4.5,
        requireAltText: true,
        requireDescriptiveLinks: true,
        maxClickTargetSize: 44
      },
      layout: {
        minMargins: 0.75,
        maxColumnsPerPage: 3,
        requireConsistentSpacing: true,
        enforceGridAlignment: false
      },
      content: {
        maxOrphans: 2,
        maxWidows: 2,
        requireCaptions: true,
        enforceNumberingConsistency: true
      },
      brand: {
        enforceColorPalette: false,
        requireBrandElements: false,
        enforceTypographySystem: true
      }
    },
    severity: {
      typography: 'warning',
      accessibility: 'error',
      layout: 'warning',
      content: 'info',
      brand: 'info'
    },
    autoFix: {
      typography: false,
      accessibility: false,
      layout: true,
      content: true,
      brand: false
    }
  }
}

/**
 * Create validation preset variations
 */
export function createValidationPresets(): TemplateValidationPreset[] {
  return [
    createDefaultValidationPreset(),
    {
      id: 'strict',
      name: 'Strict Compliance',
      description: 'Rigorous validation for professional publications',
      rules: {
        typography: {
          minBodyFontSize: 12,
          minHeadingFontSize: 14,
          maxLineLength: 70,
          hyphenationEnabled: false,
          requireProperHeadingHierarchy: true
        },
        accessibility: {
          minContrastRatio: 7.0, // WCAG AAA
          requireAltText: true,
          requireDescriptiveLinks: true,
          maxClickTargetSize: 44
        },
        layout: {
          minMargins: 1.0,
          maxColumnsPerPage: 2,
          requireConsistentSpacing: true,
          enforceGridAlignment: true
        },
        content: {
          maxOrphans: 1,
          maxWidows: 1,
          requireCaptions: true,
          enforceNumberingConsistency: true
        },
        brand: {
          enforceColorPalette: true,
          requireBrandElements: true,
          enforceTypographySystem: true
        }
      },
      severity: {
        typography: 'error',
        accessibility: 'error',
        layout: 'error',
        content: 'warning',
        brand: 'warning'
      },
      autoFix: {
        typography: true,
        accessibility: false,
        layout: true,
        content: true,
        brand: false
      }
    },
    {
      id: 'relaxed',
      name: 'Flexible Guidelines',
      description: 'Permissive validation for creative documents',
      rules: {
        typography: {
          minBodyFontSize: 9,
          minHeadingFontSize: 10,
          maxLineLength: 100,
          hyphenationEnabled: true,
          requireProperHeadingHierarchy: false
        },
        accessibility: {
          minContrastRatio: 3.0,
          requireAltText: false,
          requireDescriptiveLinks: false,
          maxClickTargetSize: 36
        },
        layout: {
          minMargins: 0.5,
          maxColumnsPerPage: 4,
          requireConsistentSpacing: false,
          enforceGridAlignment: false
        },
        content: {
          maxOrphans: 3,
          maxWidows: 3,
          requireCaptions: false,
          enforceNumberingConsistency: false
        },
        brand: {
          enforceColorPalette: false,
          requireBrandElements: false,
          enforceTypographySystem: false
        }
      },
      severity: {
        typography: 'info',
        accessibility: 'warning',
        layout: 'info',
        content: 'info',
        brand: 'info'
      },
      autoFix: {
        typography: false,
        accessibility: false,
        layout: false,
        content: false,
        brand: false
      }
    }
  ]
}

/**
 * Default numbering configuration
 */
function createDefaultNumbering(): TemplateNumbering {
  return {
    headings: {
      enabled: false,
      format: '1.1.1',
      startLevel: 1,
      separator: '.'
    },
    figures: {
      enabled: true,
      prefix: 'Figure',
      format: '{prefix} {n}'
    },
    tables: {
      enabled: true,
      prefix: 'Table',
      format: '{prefix} {n}'
    },
    equations: {
      enabled: true,
      prefix: 'Equation',
      format: '({n})'
    },
    footnotes: {
      enabled: true,
      format: 'numeric',
      restart: 'never'
    }
  }
}

/**
 * Default TOC configuration
 */
function createDefaultTOCDefaults(): TemplateTOCDefaults {
  return {
    enabled: true,
    title: 'Table of Contents',
    includePageNumbers: true,
    levels: {
      min: 1,
      max: 3
    },
    styles: {
      title: { id: 'toc-title', name: 'TOC Title', category: 'typography', properties: { fontFamily: 'Inter', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' } },
      level1: { id: 'toc-level1', name: 'TOC Level 1', category: 'typography', properties: { fontFamily: 'Inter', fontSize: '1rem', fontWeight: 'medium', marginBottom: '0.5rem' } },
      level2: { id: 'toc-level2', name: 'TOC Level 2', category: 'typography', properties: { fontFamily: 'Inter', fontSize: '0.875rem', fontWeight: 'normal', marginBottom: '0.25rem', paddingLeft: '1rem' } },
      level3: { id: 'toc-level3', name: 'TOC Level 3', category: 'typography', properties: { fontFamily: 'Inter', fontSize: '0.875rem', fontWeight: 'normal', marginBottom: '0.25rem', paddingLeft: '2rem' } }
    },
    formatting: {
      indentPerLevel: '1rem',
      tabStops: ['50%', '90%'],
      dotLeader: true
    }
  }
}

/**
 * Default export configuration
 */
function createDefaultExportDefaults(): TemplateExportDefaults {
  return {
    pdf: {
      pageSize: 'Letter',
      margins: { top: 1, right: 1, bottom: 1, left: 1 },
      includeMetadata: true,
      embedFonts: true,
      quality: 'standard'
    },
    docx: {
      compatibility: 'modern',
      includeComments: false,
      trackChanges: false
    },
    html: {
      includeCSS: true,
      embedImages: false,
      responsiveDesign: true
    }
  }
}

/**
 * Create default snippets
 */
export function createDefaultSnippets(): TemplateSnippet[] {
  return [
    // KPI Strip
    {
      id: 'kpi-strip',
      name: 'KPI Strip',
      description: 'A row of key performance indicators with numbers and labels',
      category: 'metrics',
      keywords: ['kpi', 'metrics', 'numbers', 'stats', 'performance'],
      content: [
        createBlock('figure', {
          type: 'kpi-strip',
          items: [
            { value: '85%', label: 'Customer Satisfaction', trend: 'up' },
            { value: '$2.4M', label: 'Revenue Growth', trend: 'up' },
            { value: '12', label: 'New Markets', trend: 'neutral' },
            { value: '99.9%', label: 'Uptime', trend: 'up' }
          ]
        }, 0),
      ],
      insertionPoint: 'cursor'
    },
    
    // Pull Quote
    {
      id: 'pull-quote',
      name: 'Pull Quote',
      description: 'Highlighted quote with attribution for emphasis',
      category: 'content',
      keywords: ['quote', 'testimonial', 'pullquote', 'emphasis', 'citation'],
      content: [
        createBlock('figure', {
          type: 'pull-quote',
          quote: 'This solution transformed our entire workflow and increased productivity by 300%.',
          attribution: 'Sarah Johnson, CEO',
          company: 'TechCorp Solutions'
        }, 0),
      ],
      insertionPoint: 'cursor'
    },
    
    // CTA Card
    {
      id: 'cta-card',
      name: 'CTA Card',
      description: 'Call-to-action card with headline, description, and button',
      category: 'marketing',
      keywords: ['cta', 'call to action', 'button', 'card', 'conversion'],
      content: [
        createBlock('figure', {
          type: 'cta-card',
          headline: 'Ready to Get Started?',
          description: 'Join thousands of professionals who trust our platform to streamline their workflow.',
          buttonText: 'Start Free Trial',
          buttonUrl: '#',
          style: 'primary'
        }, 0),
      ],
      insertionPoint: 'cursor'
    },
    
    // Feature Grid
    {
      id: 'feature-grid',
      name: 'Feature Grid',
      description: 'Grid layout showcasing features with icons and descriptions',
      category: 'marketing',
      keywords: ['features', 'grid', 'benefits', 'icons', 'layout'],
      content: [
        createBlock('figure', {
          type: 'feature-grid',
          title: 'Key Features',
          items: [
            { icon: 'rocket', title: 'Fast Performance', description: 'Lightning-fast load times and responsive design' },
            { icon: 'shield', title: 'Secure', description: 'Enterprise-grade security and data protection' },
            { icon: 'users', title: 'Collaborative', description: 'Real-time collaboration with your team' },
            { icon: 'chart', title: 'Analytics', description: 'Detailed insights and reporting dashboard' }
          ]
        }, 0),
      ],
      insertionPoint: 'cursor'
    },
    
    // Timeline
    {
      id: 'timeline',
      name: 'Timeline',
      description: 'Vertical timeline showing process steps or milestones',
      category: 'content',
      keywords: ['timeline', 'process', 'steps', 'milestones', 'roadmap'],
      content: [
        createBlock('figure', {
          type: 'timeline',
          title: 'Project Timeline',
          items: [
            { date: 'Q1 2024', title: 'Planning Phase', description: 'Define requirements and set project scope' },
            { date: 'Q2 2024', title: 'Development', description: 'Build core features and functionality' },
            { date: 'Q3 2024', title: 'Testing', description: 'Quality assurance and user testing' },
            { date: 'Q4 2024', title: 'Launch', description: 'Go live with full rollout' }
          ]
        }, 0),
      ],
      insertionPoint: 'cursor'
    },
    
    // Comparison Table
    {
      id: 'comparison-table',
      name: 'Comparison Table',
      description: 'Side-by-side comparison of plans or features',
      category: 'content',
      keywords: ['comparison', 'table', 'plans', 'features', 'pricing'],
      content: [
        createBlock('table', {
          headers: ['Feature', 'Basic', 'Pro', 'Enterprise'],
          rows: [
            ['Users', '5', '25', 'Unlimited'],
            ['Storage', '10GB', '100GB', '1TB'],
            ['Support', 'Email', '24/7 Chat', 'Dedicated Manager'],
            ['Advanced Features', '✗', '✓', '✓'],
            ['Custom Integrations', '✗', '✗', '✓']
          ],
          caption: 'Plan Comparison',
          style: 'comparison'
        }, 0),
      ],
      insertionPoint: 'cursor'
    }
  ]
}

/**
 * Create a snippet
 */
export function createSnippet(
  name: string,
  content: Block[],
  category: string = 'general'
): TemplateSnippet {
  return {
    id: crypto.randomUUID(),
    name,
    description: '',
    category,
    keywords: [],
    content,
    insertionPoint: 'cursor'
  }
}