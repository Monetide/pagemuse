// Industry Registry - Auto-creating registry for industry palettes and snippet hints

export interface Industry {
  id: string
  name: string
  description: string
  category: 'technology' | 'finance' | 'healthcare' | 'education' | 'manufacturing' | 'services' | 'nonprofit'
  palette: IndustryPalette
  snippetHints: SnippetHint[]
  commonTerms: string[]
  metadata: {
    formalityLevel: 'casual' | 'business' | 'formal' | 'academic'
    audienceType: string
    keyValues: string[]
    designTrends: string[]
  }
}

export interface IndustryPalette {
  primary: string
  secondary: string
  accent: string
  neutral: {
    darkest: string
    dark: string  
    medium: string
    light: string
    lightest: string
  }
  semantic: {
    success: string
    warning: string
    error: string
    info: string
  }
  mood: 'trustworthy' | 'innovative' | 'energetic' | 'sophisticated' | 'reliable'
}

export interface SnippetHint {
  type: 'heading' | 'paragraph' | 'callout' | 'list' | 'quote'
  context: string
  examples: string[]
  tone: 'professional' | 'friendly' | 'authoritative' | 'technical' | 'persuasive'
}

// Registry storage
const industryRegistry = new Map<string, Industry>()

// Pre-registered industries
const defaultIndustries: Industry[] = [
  {
    id: 'technology',
    name: 'Technology',
    description: 'Software, hardware, and digital innovation companies',
    category: 'technology',
    palette: {
      primary: '#0066cc',
      secondary: '#4a90e2',
      accent: '#00d4aa',
      neutral: {
        darkest: '#1a1a1a',
        dark: '#333333',
        medium: '#666666',
        light: '#cccccc',
        lightest: '#f5f5f5'
      },
      semantic: {
        success: '#00c851',
        warning: '#ffbb33',
        error: '#ff4444',
        info: '#33b5e5'
      },
      mood: 'innovative'
    },
    snippetHints: [
      {
        type: 'heading',
        context: 'Product features',
        examples: [
          'Next-Generation Architecture',
          'Scalable Cloud Solutions',
          'AI-Powered Analytics',
          'Seamless Integration'
        ],
        tone: 'technical'
      },
      {
        type: 'paragraph',
        context: 'Problem statement',
        examples: [
          'Organizations struggle with legacy systems that can\'t scale with modern demands.',
          'Data silos prevent teams from accessing critical insights when they need them most.',
          'Manual processes create bottlenecks that slow innovation and increase costs.'
        ],
        tone: 'professional'
      },
      {
        type: 'callout',
        context: 'Key benefits',
        examples: [
          '99.9% uptime guaranteed',
          'Reduce operational costs by up to 40%',
          'Deploy in minutes, not months',
          'Enterprise-grade security built-in'
        ],
        tone: 'authoritative'
      }
    ],
    commonTerms: ['API', 'cloud', 'scalability', 'integration', 'automation', 'analytics', 'security', 'performance'],
    metadata: {
      formalityLevel: 'business',
      audienceType: 'Technical decision makers and IT professionals',
      keyValues: ['innovation', 'efficiency', 'reliability', 'scalability'],
      designTrends: ['gradients', 'geometric shapes', 'clean lines', 'blue-tech palette']
    }
  },
  {
    id: 'finance',
    name: 'Financial Services',
    description: 'Banking, investment, insurance, and fintech companies',
    category: 'finance',
    palette: {
      primary: '#1e3a8a',
      secondary: '#3b82f6',
      accent: '#10b981',
      neutral: {
        darkest: '#0f172a',
        dark: '#334155',
        medium: '#64748b',
        light: '#cbd5e1',
        lightest: '#f8fafc'
      },
      semantic: {
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        info: '#0284c7'
      },
      mood: 'trustworthy'
    },
    snippetHints: [
      {
        type: 'heading',
        context: 'Service offerings',
        examples: [
          'Wealth Management Solutions',
          'Risk Assessment & Mitigation',
          'Digital Banking Platform',
          'Investment Portfolio Optimization'
        ],
        tone: 'professional'
      },
      {
        type: 'paragraph',
        context: 'Compliance statement',
        examples: [
          'Our solutions meet all regulatory requirements including SOX, PCI DSS, and GDPR.',
          'With over 20 years of experience, we understand the complex regulatory landscape.',
          'All data is encrypted end-to-end and stored in certified facilities.'
        ],
        tone: 'authoritative'
      },
      {
        type: 'quote',
        context: 'Client testimonial',
        examples: [
          '"The platform helped us reduce processing time by 75% while maintaining full compliance."',
          '"We\'ve seen a 40% improvement in client satisfaction since implementing their solution."',
          '"Their expertise in regulatory requirements gave us confidence throughout the transition."'
        ],
        tone: 'professional'
      }
    ],
    commonTerms: ['compliance', 'regulation', 'security', 'portfolio', 'investment', 'risk', 'audit', 'reporting'],
    metadata: {
      formalityLevel: 'formal',
      audienceType: 'Financial executives and compliance officers',
      keyValues: ['trust', 'security', 'compliance', 'stability'],
      designTrends: ['conservative colors', 'serif typography', 'charts/graphs', 'professional imagery']
    }
  },
  {
    id: 'healthcare',
    name: 'Healthcare',  
    description: 'Medical providers, pharma, healthtech, and wellness companies',
    category: 'healthcare',
    palette: {
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      accent: '#10b981',
      neutral: {
        darkest: '#0f172a',
        dark: '#1e293b',
        medium: '#64748b',
        light: '#cbd5e1',
        lightest: '#f1f5f9'
      },
      semantic: {
        success: '#16a34a',
        warning: '#ea580c',
        error: '#dc2626',
        info: '#0284c7'
      },
      mood: 'trustworthy'
    },
    snippetHints: [
      {
        type: 'heading',
        context: 'Care services',
        examples: [
          'Patient-Centered Care Approach',
          'Evidence-Based Treatment Protocols',
          'Integrated Health Solutions',
          'Preventive Care Programs'
        ],
        tone: 'professional'
      },
      {
        type: 'paragraph',
        context: 'Outcome statement',
        examples: [
          'Our integrated approach has resulted in 30% better patient outcomes across all care metrics.',
          'Studies show that early intervention programs reduce hospital readmissions by up to 45%.',
          'Patient satisfaction scores have consistently ranked in the top 5% nationally.'
        ],
        tone: 'authoritative'
      },
      {
        type: 'callout',
        context: 'Safety assurance',
        examples: [
          'HIPAA compliant and fully secure',
          'Board-certified specialists only',
          '24/7 monitoring and support',
          'FDA-approved treatments exclusively'
        ],
        tone: 'authoritative'
      }
    ],
    commonTerms: ['patient', 'treatment', 'clinical', 'outcomes', 'compliance', 'safety', 'care', 'wellness'],
    metadata: {
      formalityLevel: 'formal',
      audienceType: 'Healthcare professionals and patients',
      keyValues: ['care', 'safety', 'expertise', 'innovation'],
      designTrends: ['calming colors', 'clean layouts', 'medical imagery', 'accessibility focus']
    }
  }
]

// Initialize registry
defaultIndustries.forEach(industry => {
  industryRegistry.set(industry.id, industry)
})

// Create minimal industry with sensible defaults
function createMinimalIndustry(id: string): Industry {
  const name = id.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
  
  return {
    id,
    name,
    description: `Auto-generated industry profile for ${name}`,
    category: 'services',
    palette: {
      primary: '#3b82f6',
      secondary: '#6366f1',
      accent: '#10b981',
      neutral: {
        darkest: '#1f2937',
        dark: '#374151',
        medium: '#6b7280',
        light: '#d1d5db',
        lightest: '#f9fafb'
      },
      semantic: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },
      mood: 'reliable'
    },
    snippetHints: [
      {
        type: 'heading',
        context: 'General services',
        examples: [
          'Our Solutions',
          'Key Benefits', 
          'Why Choose Us',
          'Getting Started'
        ],
        tone: 'professional'
      },
      {
        type: 'paragraph',
        context: 'Value proposition',
        examples: [
          'We provide comprehensive solutions tailored to your specific needs.',
          'Our experienced team delivers results that exceed expectations.',
          'With proven methodologies, we help organizations achieve their goals.'
        ],
        tone: 'professional'
      },
      {
        type: 'callout',
        context: 'Key differentiators',
        examples: [
          'Industry-leading expertise',
          'Proven track record',
          'Personalized approach',
          'Comprehensive support'
        ],
        tone: 'professional'
      }
    ],
    commonTerms: ['solutions', 'services', 'expertise', 'results', 'support', 'quality', 'experience', 'success'],
    metadata: {
      formalityLevel: 'business',
      audienceType: 'Business professionals',
      keyValues: ['quality', 'reliability', 'expertise', 'results'],
      designTrends: ['professional colors', 'balanced layouts', 'business imagery', 'clear hierarchy']
    }
  }
}

// Registry functions  
export function getIndustry(id: string): Industry {
  if (industryRegistry.has(id)) {
    return industryRegistry.get(id)!
  }
  
  // Auto-create minimal industry
  console.log(`Auto-creating minimal industry profile for ID: ${id}`)
  const minimalIndustry = createMinimalIndustry(id)
  industryRegistry.set(id, minimalIndustry)
  return minimalIndustry
}

export function registerIndustry(industry: Industry): void {
  industryRegistry.set(industry.id, industry)
}

export function getAllIndustries(): Industry[] {
  return Array.from(industryRegistry.values())
}

export function hasIndustry(id: string): boolean {
  return industryRegistry.has(id)
}

export function getIndustriesByCategory(category: Industry['category']): Industry[] {
  return getAllIndustries().filter(industry => industry.category === category)
}