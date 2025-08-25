// Document Type Registry - Auto-creating registry for document types with page masters

export interface DocType {
  id: string
  name: string
  description: string
  category: 'business' | 'academic' | 'marketing' | 'creative'
  pageMasters: {
    cover: PageMasterConfig
    body: PageMasterConfig
    appendix?: PageMasterConfig
  }
  defaultSections: string[]
  metadata: {
    typicalLength: string
    primaryUse: string
    audience: string
  }
}

export interface PageMasterConfig {
  id: string
  name: string
  dimensions: {
    width: number
    height: number
    unit: 'px' | 'in' | 'mm'
  }
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  columns: number
  gutterWidth?: number
  layout: 'single' | 'double' | 'magazine' | 'report'
}

// Registry storage
const docTypeRegistry = new Map<string, DocType>()

// Pre-registered document types
const defaultDocTypes: DocType[] = [
  {
    id: 'whitepaper',
    name: 'Whitepaper',
    description: 'In-depth analytical document for thought leadership',
    category: 'business',
    pageMasters: {
      cover: {
        id: 'whitepaper-cover',
        name: 'Whitepaper Cover',
        dimensions: { width: 8.5, height: 11, unit: 'in' },
        margins: { top: 1, right: 1, bottom: 1, left: 1 },
        columns: 1,
        layout: 'single'
      },
      body: {
        id: 'whitepaper-body', 
        name: 'Whitepaper Body',
        dimensions: { width: 8.5, height: 11, unit: 'in' },
        margins: { top: 1, right: 1, bottom: 1, left: 1 },
        columns: 2,
        gutterWidth: 0.25,
        layout: 'double'
      }
    },
    defaultSections: ['Executive Summary', 'Introduction', 'Analysis', 'Recommendations', 'Conclusion'],
    metadata: {
      typicalLength: '8-16 pages',
      primaryUse: 'Lead generation and thought leadership',
      audience: 'B2B decision makers'
    }
  },
  {
    id: 'ebook',
    name: 'eBook',
    description: 'Digital publication for content marketing',
    category: 'marketing',
    pageMasters: {
      cover: {
        id: 'ebook-cover',
        name: 'eBook Cover',
        dimensions: { width: 6, height: 9, unit: 'in' },
        margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
        columns: 1,
        layout: 'single'
      },
      body: {
        id: 'ebook-body',
        name: 'eBook Body',
        dimensions: { width: 6, height: 9, unit: 'in' },
        margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
        columns: 1,
        layout: 'single'
      }
    },
    defaultSections: ['Introduction', 'Chapter 1', 'Chapter 2', 'Chapter 3', 'Conclusion', 'About Us'],
    metadata: {
      typicalLength: '20-50 pages',
      primaryUse: 'Lead magnets and content marketing',
      audience: 'General consumers and professionals'
    }
  },
  {
    id: 'case-study',
    name: 'Case Study',
    description: 'Success story showcasing results and methodology',
    category: 'business',
    pageMasters: {
      cover: {
        id: 'case-study-cover',
        name: 'Case Study Cover',
        dimensions: { width: 8.5, height: 11, unit: 'in' },
        margins: { top: 1, right: 1, bottom: 1, left: 1 },
        columns: 1,
        layout: 'single'
      },
      body: {
        id: 'case-study-body',
        name: 'Case Study Body', 
        dimensions: { width: 8.5, height: 11, unit: 'in' },
        margins: { top: 1, right: 1, bottom: 1, left: 1 },
        columns: 1,
        layout: 'report'
      }
    },
    defaultSections: ['Challenge', 'Solution', 'Implementation', 'Results', 'Key Takeaways'],
    metadata: {
      typicalLength: '4-8 pages',
      primaryUse: 'Sales enablement and social proof',
      audience: 'Prospects and customers'
    }
  }
]

// Initialize registry
defaultDocTypes.forEach(docType => {
  docTypeRegistry.set(docType.id, docType)
})

// Create minimal doc type with sensible defaults
function createMinimalDocType(id: string): DocType {
  const name = id.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
  
  return {
    id,
    name,
    description: `Auto-generated document type for ${name}`,
    category: 'business',
    pageMasters: {
      cover: {
        id: `${id}-cover`,
        name: `${name} Cover`,
        dimensions: { width: 8.5, height: 11, unit: 'in' },
        margins: { top: 1, right: 1, bottom: 1, left: 1 },
        columns: 1,
        layout: 'single'
      },
      body: {
        id: `${id}-body`,
        name: `${name} Body`,
        dimensions: { width: 8.5, height: 11, unit: 'in' },
        margins: { top: 1, right: 1, bottom: 1, left: 1 },
        columns: 1,
        layout: 'single'
      }
    },
    defaultSections: ['Introduction', 'Content', 'Conclusion'],
    metadata: {
      typicalLength: '6-12 pages',
      primaryUse: 'General purpose document',
      audience: 'General audience'
    }  
  }
}

// Registry functions
export function getDocType(id: string): DocType {
  if (docTypeRegistry.has(id)) {
    return docTypeRegistry.get(id)!
  }
  
  // Auto-create minimal doc type
  console.log(`Auto-creating minimal doc type for ID: ${id}`)
  const minimalDocType = createMinimalDocType(id)
  docTypeRegistry.set(id, minimalDocType)
  return minimalDocType
}

export function registerDocType(docType: DocType): void {
  docTypeRegistry.set(docType.id, docType)
}

export function getAllDocTypes(): DocType[] {
  return Array.from(docTypeRegistry.values())
}

export function hasDocType(id: string): boolean {
  return docTypeRegistry.has(id)
}

export function getDocTypesByCategory(category: DocType['category']): DocType[] {
  return getAllDocTypes().filter(docType => docType.category === category)
}