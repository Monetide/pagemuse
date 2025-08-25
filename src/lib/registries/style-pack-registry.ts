// Style Pack Registry - Auto-creating registry for typography, spacing, and divider styles

export interface StylePack {
  id: string
  name: string
  description: string
  category: 'minimal' | 'corporate' | 'creative' | 'academic' | 'modern'
  typography: TypographyConfig
  spacing: SpacingConfig
  dividers: DividerConfig
  metadata: {
    designPrinciple: string
    bestUsedFor: string[]
    inspiration: string
  }
}

export interface TypographyConfig {
  headingFont: {
    family: string
    weights: number[]
    fallback: string
  }
  bodyFont: {
    family: string
    weights: number[]
    fallback: string
  }
  scale: {
    h1: string
    h2: string  
    h3: string
    h4: string
    body: string
    caption: string
  }
  lineHeight: {
    heading: number
    body: number
    tight: number
    loose: number
  }
}

export interface SpacingConfig {
  baseUnit: number // in rem
  scale: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    xxl: number
  }
  sectionGaps: {
    tight: number
    normal: number
    loose: number
  }
  paragraphSpacing: number
}

export interface DividerConfig {
  styles: {
    id: string
    name: string
    thickness: number
    style: 'solid' | 'dashed' | 'dotted' | 'double'
    color: 'border' | 'muted' | 'accent'
    spacing: {
      top: number
      bottom: number
    }
  }[]
  defaultStyle: string
}

// Registry storage
const stylePackRegistry = new Map<string, StylePack>()

// Pre-registered style packs
const defaultStylePacks: StylePack[] = [
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Clean, spacious design with subtle typography',
    category: 'minimal',
    typography: {
      headingFont: {
        family: 'Inter',
        weights: [400, 600, 700],
        fallback: 'system-ui, sans-serif'
      },
      bodyFont: {
        family: 'Inter',
        weights: [400, 500],
        fallback: 'system-ui, sans-serif'
      },
      scale: {
        h1: '2.25rem',
        h2: '1.875rem',
        h3: '1.5rem', 
        h4: '1.25rem',
        body: '1rem',
        caption: '0.875rem'
      },
      lineHeight: {
        heading: 1.2,
        body: 1.6,
        tight: 1.25,
        loose: 1.8
      }
    },
    spacing: {
      baseUnit: 1,
      scale: {
        xs: 0.25,
        sm: 0.5,
        md: 1,
        lg: 1.5,
        xl: 2,
        xxl: 3
      },
      sectionGaps: {
        tight: 1.5,
        normal: 2.5,
        loose: 4
      },
      paragraphSpacing: 1.25
    },
    dividers: {
      styles: [
        {
          id: 'hairline',
          name: 'Hairline',
          thickness: 1,
          style: 'solid',
          color: 'border',
          spacing: { top: 1.5, bottom: 1.5 }
        }
      ],
      defaultStyle: 'hairline'
    },
    metadata: {
      designPrinciple: 'Less is more - focus on content with minimal distractions',
      bestUsedFor: ['whitepapers', 'reports', 'documentation'],
      inspiration: 'Swiss design and modern minimalism'
    }
  },
  {
    id: 'corporate-formal',
    name: 'Corporate Formal',
    description: 'Professional styling for business documents',
    category: 'corporate',
    typography: {
      headingFont: {
        family: 'Source Serif Pro',
        weights: [400, 600, 700],
        fallback: 'Georgia, serif'
      },
      bodyFont: {
        family: 'Source Sans Pro',
        weights: [400, 600],
        fallback: 'system-ui, sans-serif'
      },
      scale: {
        h1: '2.5rem',
        h2: '2rem',
        h3: '1.5rem',
        h4: '1.25rem', 
        body: '1rem',
        caption: '0.875rem'
      },
      lineHeight: {
        heading: 1.15,
        body: 1.65,
        tight: 1.3,
        loose: 1.8
      }
    },
    spacing: {
      baseUnit: 1,
      scale: {
        xs: 0.25,
        sm: 0.5,
        md: 1,
        lg: 2,
        xl: 3,
        xxl: 4
      },
      sectionGaps: {
        tight: 2,
        normal: 3,
        loose: 4.5
      },
      paragraphSpacing: 1.5
    },
    dividers: {
      styles: [
        {
          id: 'formal-line',
          name: 'Formal Line',
          thickness: 2,
          style: 'solid',
          color: 'accent',
          spacing: { top: 2, bottom: 2 }
        },
        {
          id: 'subtle-rule',
          name: 'Subtle Rule',
          thickness: 1,
          style: 'solid',
          color: 'muted',
          spacing: { top: 1, bottom: 1 }
        }
      ],
      defaultStyle: 'formal-line'
    },
    metadata: {
      designPrinciple: 'Authority and trust through traditional design patterns',
      bestUsedFor: ['annual reports', 'proposals', 'legal documents'],
      inspiration: 'Classic business communication design'
    }
  },
  {
    id: 'creative-bold',
    name: 'Creative Bold',
    description: 'Expressive design with strong visual hierarchy',
    category: 'creative',
    typography: {
      headingFont: {
        family: 'Playfair Display',
        weights: [400, 700, 900],
        fallback: 'Georgia, serif'
      },
      bodyFont: {
        family: 'Source Sans Pro',
        weights: [400, 600],
        fallback: 'system-ui, sans-serif'
      },
      scale: {
        h1: '3rem',
        h2: '2.25rem',
        h3: '1.75rem',
        h4: '1.5rem',
        body: '1.125rem',
        caption: '1rem'
      },
      lineHeight: {
        heading: 1.1,
        body: 1.7,
        tight: 1.2,
        loose: 1.9
      }
    },
    spacing: {
      baseUnit: 1.125,
      scale: {
        xs: 0.25,
        sm: 0.75,
        md: 1.25,
        lg: 2,
        xl: 3.5,
        xxl: 5
      },
      sectionGaps: {
        tight: 2,
        normal: 3.5,
        loose: 5.5
      },
      paragraphSpacing: 1.75
    },
    dividers: {
      styles: [
        {
          id: 'bold-accent',
          name: 'Bold Accent',
          thickness: 4,
          style: 'solid',
          color: 'accent',
          spacing: { top: 2.5, bottom: 2.5 }
        },
        {
          id: 'creative-dots',
          name: 'Creative Dots',
          thickness: 3,
          style: 'dotted',
          color: 'accent',
          spacing: { top: 2, bottom: 2 }
        }
      ],
      defaultStyle: 'bold-accent'
    },
    metadata: {
      designPrinciple: 'Memorable impact through bold visual choices',
      bestUsedFor: ['marketing materials', 'brand books', 'portfolios'],
      inspiration: 'Editorial design and brand expression'
    }
  }
]

// Initialize registry
defaultStylePacks.forEach(stylePack => {
  stylePackRegistry.set(stylePack.id, stylePack)
})

// Create minimal style pack with sensible defaults
function createMinimalStylePack(id: string): StylePack {
  const name = id.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
  
  return {
    id,
    name,
    description: `Auto-generated style pack for ${name}`,
    category: 'minimal',
    typography: {
      headingFont: {
        family: 'Inter',
        weights: [400, 600],
        fallback: 'system-ui, sans-serif'
      },
      bodyFont: {
        family: 'Inter', 
        weights: [400, 500],
        fallback: 'system-ui, sans-serif'
      },
      scale: {
        h1: '2rem',
        h2: '1.5rem',
        h3: '1.25rem',
        h4: '1.125rem',
        body: '1rem',
        caption: '0.875rem'
      },
      lineHeight: {
        heading: 1.25,
        body: 1.6,
        tight: 1.3,
        loose: 1.8
      }
    },
    spacing: {
      baseUnit: 1,
      scale: {
        xs: 0.25,
        sm: 0.5,
        md: 1,
        lg: 1.5,
        xl: 2,
        xxl: 3
      },
      sectionGaps: {
        tight: 1.5,
        normal: 2,
        loose: 3
      },
      paragraphSpacing: 1.25
    },
    dividers: {
      styles: [
        {
          id: 'default-line',
          name: 'Default Line',
          thickness: 1,
          style: 'solid',
          color: 'border',
          spacing: { top: 1, bottom: 1 }
        }
      ],
      defaultStyle: 'default-line'
    },
    metadata: {
      designPrinciple: 'Auto-generated with balanced defaults',
      bestUsedFor: ['general documents'],
      inspiration: 'System defaults'
    }
  }
}

// Registry functions
export function getStylePack(id: string): StylePack {
  if (stylePackRegistry.has(id)) {
    return stylePackRegistry.get(id)!
  }
  
  // Auto-create minimal style pack
  console.log(`Auto-creating minimal style pack for ID: ${id}`)
  const minimalStylePack = createMinimalStylePack(id)
  stylePackRegistry.set(id, minimalStylePack)
  return minimalStylePack
}

export function registerStylePack(stylePack: StylePack): void {
  stylePackRegistry.set(stylePack.id, stylePack)
}

export function getAllStylePacks(): StylePack[] {
  return Array.from(stylePackRegistry.values())
}

export function hasStylePack(id: string): boolean {
  return stylePackRegistry.has(id)
}

export function getStylePacksByCategory(category: StylePack['category']): StylePack[] {
  return getAllStylePacks().filter(stylePack => stylePack.category === category)
}