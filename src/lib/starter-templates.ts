import {
  Template,
  TemplateColorway,
  TemplateThemeTokens,
  TemplateObjectStyles,
  TemplateBehaviors,
  TemplateNumbering,
  TemplateValidationPreset,
  TemplateTOCDefaults,
  TemplateExportDefaults,
  TemplateSnippet,
  TemplateStarterContent,
  createTemplate
} from './template-model'
import {
  createDocument,
  createSection,
  createFlow,
  createBlock,
  LayoutIntent,
  PageMaster,
  Style
} from './document-model'

/**
 * Starter Templates - Three predefined templates with complete configurations
 */

// Common validation preset for professional documents
const createProfessionalValidationPreset = (): TemplateValidationPreset => ({
  id: 'professional',
  name: 'Professional Document Standards',
  description: 'Ensures professional typography, accessibility, and layout standards',
  rules: {
    typography: {
      minBodyFontSize: 10.5,
      minHeadingFontSize: 14,
      maxLineLength: 75,
      hyphenationEnabled: true,
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
      enforceGridAlignment: true
    },
    content: {
      maxOrphans: 2,
      maxWidows: 2,
      requireCaptions: true,
      enforceNumberingConsistency: true
    },
    brand: {
      enforceColorPalette: true,
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
    typography: true,
    accessibility: false,
    layout: true,
    content: false,
    brand: false
  }
})

// Marketing eBook colorways
const createMarketingColorways = (): TemplateColorway[] => [
  {
    id: 'azure',
    name: 'Azure',
    description: 'Bright blue with energetic accents',
    palette: {
      primary: 'hsl(200, 100%, 45%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(200, 50%, 95%)',
      secondaryForeground: 'hsl(200, 100%, 25%)',
      accent: 'hsl(190, 100%, 50%)',
      accentForeground: 'hsl(0, 0%, 100%)',
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(200, 50%, 10%)',
      muted: 'hsl(200, 50%, 96%)',
      mutedForeground: 'hsl(200, 30%, 40%)',
      border: 'hsl(200, 50%, 85%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(0, 0%, 100%)',
      success: 'hsl(160, 84%, 39%)',
      successForeground: 'hsl(0, 0%, 100%)',
      warning: 'hsl(38, 92%, 50%)',
      warningForeground: 'hsl(0, 0%, 100%)'
    },
    isDefault: true
  },
  {
    id: 'coral',
    name: 'Coral',
    description: 'Warm coral with vibrant energy',
    palette: {
      primary: 'hsl(16, 100%, 60%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(16, 50%, 95%)',
      secondaryForeground: 'hsl(16, 100%, 30%)',
      accent: 'hsl(25, 100%, 65%)',
      accentForeground: 'hsl(0, 0%, 100%)',
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(16, 50%, 10%)',
      muted: 'hsl(16, 50%, 96%)',
      mutedForeground: 'hsl(16, 30%, 40%)',
      border: 'hsl(16, 50%, 85%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(0, 0%, 100%)',
      success: 'hsl(160, 84%, 39%)',
      successForeground: 'hsl(0, 0%, 100%)',
      warning: 'hsl(38, 92%, 50%)',
      warningForeground: 'hsl(0, 0%, 100%)'
    }
  },
  {
    id: 'evergreen',
    name: 'Evergreen',
    description: 'Fresh green with natural appeal',
    palette: {
      primary: 'hsl(150, 100%, 35%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(150, 50%, 95%)',
      secondaryForeground: 'hsl(150, 100%, 20%)',
      accent: 'hsl(140, 100%, 40%)',
      accentForeground: 'hsl(0, 0%, 100%)',
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(150, 50%, 10%)',
      muted: 'hsl(150, 50%, 96%)',
      mutedForeground: 'hsl(150, 30%, 40%)',
      border: 'hsl(150, 50%, 85%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(0, 0%, 100%)',
      success: 'hsl(160, 84%, 39%)',
      successForeground: 'hsl(0, 0%, 100%)',
      warning: 'hsl(38, 92%, 50%)',
      warningForeground: 'hsl(0, 0%, 100%)'
    }
  }
]

// Research White Paper colorways
const createResearchColorways = (): TemplateColorway[] => [
  {
    id: 'navy',
    name: 'Navy Professional',
    description: 'Classic navy with professional appeal',
    palette: {
      primary: 'hsl(220, 100%, 25%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(220, 30%, 95%)',
      secondaryForeground: 'hsl(220, 100%, 15%)',
      accent: 'hsl(215, 100%, 30%)',
      accentForeground: 'hsl(0, 0%, 100%)',
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(220, 50%, 10%)',
      muted: 'hsl(220, 30%, 96%)',
      mutedForeground: 'hsl(220, 20%, 40%)',
      border: 'hsl(220, 30%, 85%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(0, 0%, 100%)',
      success: 'hsl(160, 84%, 39%)',
      successForeground: 'hsl(0, 0%, 100%)',
      warning: 'hsl(38, 92%, 50%)',
      warningForeground: 'hsl(0, 0%, 100%)'
    },
    isDefault: true
  },
  {
    id: 'slate',
    name: 'Slate Gray',
    description: 'Sophisticated slate with subtle warmth',
    palette: {
      primary: 'hsl(210, 20%, 25%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(210, 15%, 95%)',
      secondaryForeground: 'hsl(210, 20%, 15%)',
      accent: 'hsl(205, 20%, 30%)',
      accentForeground: 'hsl(0, 0%, 100%)',
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(210, 30%, 10%)',
      muted: 'hsl(210, 15%, 96%)',
      mutedForeground: 'hsl(210, 15%, 40%)',
      border: 'hsl(210, 15%, 85%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(0, 0%, 100%)',
      success: 'hsl(160, 84%, 39%)',
      successForeground: 'hsl(0, 0%, 100%)',
      warning: 'hsl(38, 92%, 50%)',
      warningForeground: 'hsl(0, 0%, 100%)'
    }
  },
  {
    id: 'warm-gray',
    name: 'Warm Gray',
    description: 'Neutral warm gray for academic documents',
    palette: {
      primary: 'hsl(30, 10%, 25%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(30, 10%, 95%)',
      secondaryForeground: 'hsl(30, 10%, 15%)',
      accent: 'hsl(25, 15%, 30%)',
      accentForeground: 'hsl(0, 0%, 100%)',
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(30, 20%, 10%)',
      muted: 'hsl(30, 10%, 96%)',
      mutedForeground: 'hsl(30, 10%, 40%)',
      border: 'hsl(30, 10%, 85%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(0, 0%, 100%)',
      success: 'hsl(160, 84%, 39%)',
      successForeground: 'hsl(0, 0%, 100%)',
      warning: 'hsl(38, 92%, 50%)',
      warningForeground: 'hsl(0, 0%, 100%)'
    }
  }
]

// Case Study colorways
const createCaseStudyColorways = (): TemplateColorway[] => [
  {
    id: 'blue',
    name: 'Professional Blue',
    description: 'Clean blue for business case studies',
    palette: {
      primary: 'hsl(210, 100%, 45%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(210, 50%, 95%)',
      secondaryForeground: 'hsl(210, 100%, 25%)',
      accent: 'hsl(205, 100%, 50%)',
      accentForeground: 'hsl(0, 0%, 100%)',
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(210, 50%, 10%)',
      muted: 'hsl(210, 50%, 96%)',
      mutedForeground: 'hsl(210, 30%, 40%)',
      border: 'hsl(210, 50%, 85%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(0, 0%, 100%)',
      success: 'hsl(160, 84%, 39%)',
      successForeground: 'hsl(0, 0%, 100%)',
      warning: 'hsl(38, 92%, 50%)',
      warningForeground: 'hsl(0, 0%, 100%)'
    },
    isDefault: true
  },
  {
    id: 'plum',
    name: 'Rich Plum',
    description: 'Sophisticated plum for creative case studies',
    palette: {
      primary: 'hsl(280, 100%, 35%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(280, 50%, 95%)',
      secondaryForeground: 'hsl(280, 100%, 20%)',
      accent: 'hsl(275, 100%, 40%)',
      accentForeground: 'hsl(0, 0%, 100%)',
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(280, 50%, 10%)',
      muted: 'hsl(280, 50%, 96%)',
      mutedForeground: 'hsl(280, 30%, 40%)',
      border: 'hsl(280, 50%, 85%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(0, 0%, 100%)',
      success: 'hsl(160, 84%, 39%)',
      successForeground: 'hsl(0, 0%, 100%)',
      warning: 'hsl(38, 92%, 50%)',
      warningForeground: 'hsl(0, 0%, 100%)'
    }
  }
]

// Create Marketing eBook Template
export const createMarketingEBookTemplate = (): Template => {
  const template = createTemplate(
    'Marketing eBook',
    'Modern, engaging template for marketing eBooks with bright colorways and snippets for highlights',
    'marketing'
  )

  // Override with specific configurations
  template.themeTokens = {
    colorways: createMarketingColorways(),
    activeColorway: 'azure',
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
        soft: '0 2px 20px -2px rgba(0,0,0,0.08)',
        medium: '0 8px 30px -6px rgba(0,0,0,0.12)'
      },
      borders: {
        subtle: '1px solid rgba(0,0,0,0.1)'
      },
      animations: {
        smooth: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
  }

  template.behaviors = {
    autoNumbering: {
      headings: false,
      figures: true,
      tables: true,
      equations: false
    },
    crossReferences: {
      enableAutoText: true,
      updateOnRename: true,
      showPageNumbers: true
    },
    validation: {
      requireAltText: true,
      checkSpelling: true,
      enforceStyles: true
    },
    collaboration: {
      allowComments: true,
      trackChanges: false,
      shareSettings: 'team'
    }
  }

  template.validationPreset = createProfessionalValidationPreset()

  // Page Masters
  template.pageMasters = {
    'cover': {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
      columns: 1,
      columnGap: 0,
      hasHeader: false,
      hasFooter: false,
      baselineGrid: false,
      gridSpacing: 12
    },
    '1-col-intro': {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
      columns: 1,
      columnGap: 0,
      hasHeader: false,
      hasFooter: true,
      baselineGrid: true,
      gridSpacing: 12
    },
    '2-col-body': {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
      columns: 2,
      columnGap: 36,
      hasHeader: false,
      hasFooter: true,
      baselineGrid: true,
      gridSpacing: 12
    },
    'full-bleed-figure': {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 36, right: 36, bottom: 36, left: 36 },
      columns: 1,
      columnGap: 0,
      hasHeader: false,
      hasFooter: true,
      baselineGrid: false,
      gridSpacing: 12
    }
  }

  // Snippets
  template.snippets = [
    {
      id: 'stat-callout',
      name: 'Stat Callout',
      description: 'Highlight key statistics with visual impact',
      category: 'marketing',
      keywords: ['stat', 'number', 'highlight', 'metric'],
      content: [
        createBlock('callout', {
          type: 'stat',
          content: {
            title: '85%',
            subtitle: 'Customer Satisfaction',
            description: 'of customers report improved outcomes after implementation'
          }
        })
      ],
      insertionPoint: 'cursor'
    },
    {
      id: 'cta-card',
      name: 'Call to Action Card',
      description: 'Encourage reader action with prominent CTA',
      category: 'marketing',
      keywords: ['cta', 'action', 'button', 'conversion'],
      content: [
        createBlock('callout', {
          type: 'cta',
          content: {
            title: 'Ready to Get Started?',
            description: 'Join thousands of satisfied customers who have transformed their business.',
            buttonText: 'Start Free Trial',
            buttonUrl: '#'
          }
        })
      ],
      insertionPoint: 'cursor'
    }
  ]

  // Starter Content
  template.starterContent = {
    sections: [
      {
        name: 'Cover',
        layoutIntent: 'cover' as LayoutIntent,
        flows: [
          {
            name: 'main',
            type: 'linear' as const,
            blocks: [
              {
                type: 'heading',
                content: { level: 1, text: '' },
                placeholder: 'Your eBook Title Here',
                required: true
              },
              {
                type: 'paragraph',
                content: { text: '' },
                placeholder: 'Compelling subtitle that describes the value proposition',
                required: false
              }
            ]
          }
        ]
      },
      {
        name: 'Introduction',
        layoutIntent: 'body' as LayoutIntent,
        flows: [
          {
            name: 'main',
            type: 'linear' as const,
            blocks: [
              {
                type: 'heading',
                content: { level: 2, text: '' },
                placeholder: 'Introduction',
                required: true
              },
              {
                type: 'paragraph',
                content: { text: '' },
                placeholder: 'Welcome your readers and explain what they\'ll learn from this eBook...',
                required: false
              }
            ]
          }
        ]
      },
      {
        name: 'Chapter 1',
        layoutIntent: 'body' as LayoutIntent,
        flows: [
          {
            name: 'main',
            type: 'linear' as const,
            blocks: [
              {
                type: 'heading',
                content: { level: 2, text: '' },
                placeholder: 'Chapter 1: Getting Started',
                required: true
              },
              {
                type: 'heading',
                content: { level: 3, text: '' },
                placeholder: 'Key Concepts',
                required: false
              },
              {
                type: 'paragraph',
                content: { text: '' },
                placeholder: 'Explain the foundational concepts your readers need to understand...',
                required: false
              }
            ]
          }
        ]
      }
    ]
  }

  template.tags = ['marketing', 'ebook', 'modern', 'colorful']
  template.layoutIntents = ['cover', 'body']

  return template
}

// Create Research White Paper Template
export const createResearchWhitePaperTemplate = (): Template => {
  const template = createTemplate(
    'Research White Paper',
    'Academic-style template for research papers with serif typography and conservative design',
    'academic'
  )

  template.themeTokens = {
    colorways: createResearchColorways(),
    activeColorway: 'navy',
    typography: {
      fontFamily: {
        heading: 'Inter, system-ui, sans-serif',
        body: 'Georgia, serif',
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
        tight: 1.4,
        normal: 1.6,
        relaxed: 1.8
      }
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.5rem',
      '2xl': '2rem'
    },
    effects: {
      shadows: {
        soft: '0 1px 3px rgba(0,0,0,0.1)',
        medium: '0 4px 12px rgba(0,0,0,0.15)'
      },
      borders: {
        subtle: '1px solid rgba(0,0,0,0.15)'
      },
      animations: {
        smooth: 'all 0.2s ease-in-out'
      }
    }
  }

  template.behaviors = {
    autoNumbering: {
      headings: true,
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
      checkSpelling: true,
      enforceStyles: true
    },
    collaboration: {
      allowComments: true,
      trackChanges: true,
      shareSettings: 'private'
    }
  }

  template.numbering = {
    headings: {
      enabled: true,
      format: '{n}.',
      startLevel: 1,
      separator: '.'
    },
    figures: {
      enabled: true,
      prefix: 'Figure',
      format: '{prefix} {section}-{n}'
    },
    tables: {
      enabled: true,
      prefix: 'Table',
      format: '{prefix} {section}-{n}'
    },
    equations: {
      enabled: true,
      prefix: 'Eq.',
      format: '({prefix} {section}.{n})'
    },
    footnotes: {
      enabled: true,
      format: 'numeric',
      restart: 'section'
    }
  }

  template.validationPreset = {
    ...createProfessionalValidationPreset(),
    rules: {
      ...createProfessionalValidationPreset().rules,
      typography: {
        ...createProfessionalValidationPreset().rules.typography,
        hyphenationEnabled: false // Conservative hyphenation
      }
    }
  }

  // Page Masters
  template.pageMasters = {
    'cover': {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
      columns: 1,
      columnGap: 0,
      hasHeader: false,
      hasFooter: false,
      baselineGrid: false,
      gridSpacing: 12
    },
    '2-col-body': {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 72, right: 72, bottom: 90, left: 72 },
      columns: 2,
      columnGap: 27,
      hasHeader: false,
      hasFooter: true,
      baselineGrid: true,
      gridSpacing: 12
    },
    'landscape-data': {
      pageSize: 'Tabloid',
      orientation: 'landscape',
      margins: { top: 54, right: 54, bottom: 72, left: 54 },
      columns: 1,
      columnGap: 0,
      hasHeader: false,
      hasFooter: true,
      baselineGrid: false,
      gridSpacing: 12
    }
  }

  // Starter Content
  template.starterContent = {
    sections: [
      {
        name: 'Cover',
        layoutIntent: 'cover' as LayoutIntent,
        flows: [
          {
            name: 'main',
            type: 'linear' as const,
            blocks: [
              {
                type: 'heading',
                content: { level: 1, text: '' },
                placeholder: 'Research Paper Title',
                required: true
              },
              {
                type: 'paragraph',
                content: { text: '' },
                placeholder: 'Author Name(s), Institution, Date',
                required: false
              }
            ]
          }
        ]
      },
      {
        name: 'Executive Summary',
        layoutIntent: 'executive-summary' as LayoutIntent,
        flows: [
          {
            name: 'main',
            type: 'linear' as const,
            blocks: [
              {
                type: 'heading',
                content: { level: 2, text: '' },
                placeholder: 'Executive Summary',
                required: true
              },
              {
                type: 'paragraph',
                content: { text: '' },
                placeholder: 'Provide a concise overview of the research objectives, methodology, key findings, and implications...',
                required: false
              }
            ]
          }
        ]
      },
      {
        name: 'Methods',
        layoutIntent: 'body' as LayoutIntent,
        flows: [
          {
            name: 'main',
            type: 'linear' as const,
            blocks: [
              {
                type: 'heading',
                content: { level: 2, text: '' },
                placeholder: 'Methodology',
                required: true
              },
              {
                type: 'paragraph',
                content: { text: '' },
                placeholder: 'Describe the research methodology, data collection procedures, and analytical approaches used...',
                required: false
              }
            ]
          }
        ]
      },
      {
        name: 'References',
        layoutIntent: 'data-appendix' as LayoutIntent,
        flows: [
          {
            name: 'main',
            type: 'linear' as const,
            blocks: [
              {
                type: 'heading',
                content: { level: 2, text: '' },
                placeholder: 'References',
                required: true
              },
              {
                type: 'paragraph',
                content: { text: '' },
                placeholder: 'List your references here in appropriate academic format...',
                required: false
              }
            ]
          }
        ]
      }
    ]
  }

  template.tags = ['research', 'academic', 'whitepaper', 'professional']
  template.layoutIntents = ['cover', 'executive-summary', 'body', 'data-appendix']

  return template
}

// Create Case Study Template
export const createCaseStudyTemplate = (): Template => {
  const template = createTemplate(
    'Case Study',
    'Clean, high-contrast template for business case studies with KPI highlights and customer quotes',
    'business'
  )

  template.themeTokens = {
    colorways: createCaseStudyColorways(),
    activeColorway: 'blue',
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
        tight: 1.3,
        normal: 1.5,
        relaxed: 1.7
      }
    },
    spacing: {
      xs: '0.5rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '2.5rem',
      '2xl': '3rem'
    },
    effects: {
      shadows: {
        soft: '0 4px 20px -4px rgba(0,0,0,0.1)',
        medium: '0 8px 32px -8px rgba(0,0,0,0.15)'
      },
      borders: {
        subtle: '1px solid rgba(0,0,0,0.08)'
      },
      animations: {
        smooth: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
  }

  template.behaviors = {
    autoNumbering: {
      headings: false,
      figures: true,
      tables: false,
      equations: false
    },
    crossReferences: {
      enableAutoText: true,
      updateOnRename: true,
      showPageNumbers: false
    },
    validation: {
      requireAltText: true,
      checkSpelling: true,
      enforceStyles: true
    },
    collaboration: {
      allowComments: true,
      trackChanges: false,
      shareSettings: 'team'
    }
  }

  template.validationPreset = {
    ...createProfessionalValidationPreset(),
    rules: {
      ...createProfessionalValidationPreset().rules,
      typography: {
        ...createProfessionalValidationPreset().rules.typography,
        hyphenationEnabled: false // Minimal hyphenation
      }
    }
  }

  // Page Masters
  template.pageMasters = {
    'cover': {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
      columns: 1,
      columnGap: 0,
      hasHeader: false,
      hasFooter: false,
      baselineGrid: false,
      gridSpacing: 12
    },
    '1-col-narrative': {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 108, right: 144, bottom: 108, left: 144 },
      columns: 1,
      columnGap: 0,
      hasHeader: false,
      hasFooter: false,
      baselineGrid: true,
      gridSpacing: 18
    },
    'sidebar-quote': {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 108, right: 72, bottom: 108, left: 72 },
      columns: 2,
      columnGap: 72,
      hasHeader: false,
      hasFooter: false,
      baselineGrid: true,
      gridSpacing: 18
    },
    'full-bleed-metric': {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
      columns: 1,
      columnGap: 0,
      hasHeader: false,
      hasFooter: false,
      baselineGrid: false,
      gridSpacing: 12
    }
  }

  // Snippets
  template.snippets = [
    {
      id: 'kpi-strip',
      name: 'KPI Strip',
      description: 'Display 3 key performance indicators in a row',
      category: 'business',
      keywords: ['kpi', 'metrics', 'performance', 'results'],
      content: [
        createBlock('callout', {
          type: 'kpi-strip',
          content: {
            metrics: [
              { value: '150%', label: 'Revenue Growth', description: 'Year over year increase' },
              { value: '89%', label: 'Customer Retention', description: 'Improved satisfaction scores' },
              { value: '45%', label: 'Time Savings', description: 'Process efficiency gains' }
            ]
          }
        })
      ],
      insertionPoint: 'cursor'
    },
    {
      id: 'pull-quote',
      name: 'Pull Quote',
      description: 'Highlight important customer testimonials or insights',
      category: 'business',
      keywords: ['quote', 'testimonial', 'customer', 'highlight'],
      content: [
        createBlock('callout', {
          type: 'quote',
          content: {
            quote: 'This solution transformed our entire workflow and saved us countless hours.',
            author: 'John Smith',
            title: 'CEO, Example Company'
          }
        })
      ],
      insertionPoint: 'cursor'
    },
    {
      id: 'before-after-table',
      name: 'Before/After Comparison',
      description: 'Show the impact with before and after comparison',
      category: 'business',
      keywords: ['comparison', 'before', 'after', 'impact', 'results'],
      content: [
        createBlock('table', {
          headers: ['Metric', 'Before', 'After', 'Improvement'],
          rows: [
            ['Processing Time', '4 hours', '45 minutes', '81% reduction'],
            ['Error Rate', '12%', '2%', '83% improvement'],
            ['Customer Satisfaction', '72%', '94%', '22 point increase']
          ]
        })
      ],
      insertionPoint: 'cursor'
    }
  ]

  // Starter Content
  template.starterContent = {
    sections: [
      {
        name: 'Cover',
        layoutIntent: 'cover' as LayoutIntent,
        flows: [
          {
            name: 'main',
            type: 'linear' as const,
            blocks: [
              {
                type: 'heading',
                content: { level: 1, text: '' },
                placeholder: 'Case Study: [Client Name]',
                required: true
              },
              {
                type: 'paragraph',
                content: { text: '' },
                placeholder: 'How [solution] helped [client] achieve [key outcome]',
                required: false
              }
            ]
          }
        ]
      },
      {
        name: 'Who/Context',
        layoutIntent: 'body' as LayoutIntent,
        flows: [
          {
            name: 'main',
            type: 'linear' as const,
            blocks: [
              {
                type: 'heading',
                content: { level: 2, text: '' },
                placeholder: 'About [Client Name]',
                required: true
              },
              {
                type: 'paragraph',
                content: { text: '' },
                placeholder: 'Who is the client? What industry are they in? What is their context and background?',
                required: false
              }
            ]
          }
        ]
      },
      {
        name: 'Problem',
        layoutIntent: 'body' as LayoutIntent,
        flows: [
          {
            name: 'main',
            type: 'linear' as const,
            blocks: [
              {
                type: 'heading',
                content: { level: 2, text: '' },
                placeholder: 'The Challenge',
                required: true
              },
              {
                type: 'paragraph',
                content: { text: '' },
                placeholder: 'What specific challenges was the client facing? What was the impact on their business?',
                required: false
              }
            ]
          }
        ]
      },
      {
        name: 'Solution',
        layoutIntent: 'body' as LayoutIntent,
        flows: [
          {
            name: 'main',
            type: 'linear' as const,
            blocks: [
              {
                type: 'heading',
                content: { level: 2, text: '' },
                placeholder: 'Our Solution',
                required: true
              },
              {
                type: 'paragraph',
                content: { text: '' },
                placeholder: 'How did you address the client\'s challenges? What was your approach and methodology?',
                required: false
              }
            ]
          }
        ]
      },
      {
        name: 'Results',
        layoutIntent: 'body' as LayoutIntent,
        flows: [
          {
            name: 'main',
            type: 'linear' as const,
            blocks: [
              {
                type: 'heading',
                content: { level: 2, text: '' },
                placeholder: 'The Results',
                required: true
              },
              {
                type: 'paragraph',
                content: { text: '' },
                placeholder: 'What were the measurable outcomes? Include specific metrics and improvements achieved.',
                required: false
              }
            ]
          }
        ]
      },
      {
        name: 'Next Steps',
        layoutIntent: 'body' as LayoutIntent,
        flows: [
          {
            name: 'main',
            type: 'linear' as const,
            blocks: [
              {
                type: 'heading',
                content: { level: 2, text: '' },
                placeholder: 'Next Steps',
                required: true
              },
              {
                type: 'paragraph',
                content: { text: '' },
                placeholder: 'What are the ongoing plans? How can similar clients benefit from this approach?',
                required: false
              }
            ]
          }
        ]
      }
    ]
  }

  template.tags = ['case-study', 'business', 'clean', 'professional']
  template.layoutIntents = ['cover', 'body']

  return template
}

// Export all starter templates
export const STARTER_TEMPLATES = {
  'marketing-ebook': createMarketingEBookTemplate(),
  'research-whitepaper': createResearchWhitePaperTemplate(),
  'case-study': createCaseStudyTemplate()
}

export const getAllStarterTemplates = (): Template[] => {
  return Object.values(STARTER_TEMPLATES)
}