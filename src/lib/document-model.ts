// Semantic Document Model
// Content hierarchy: Document → Section → Flow → Block

export interface Style {
  id: string
  name: string
  properties: Record<string, any>
  category: 'typography' | 'spacing' | 'color' | 'layout'
}

export interface Theme {
  id: string
  name: string
  description?: string
  styles: Style[]
  variables: Record<string, any>
}

export interface Block {
  id: string
  type: 'heading' | 'paragraph' | 'ordered-list' | 'unordered-list' | 'quote' | 'divider' | 'spacer' | 'figure' | 'table' | 'chart' | 'cross-reference' | 'callout' | 'footnote' | 'table-of-contents'
  content: any
  styles?: Style[]
  metadata?: Record<string, any>
  order: number
  paginationRules?: PaginationRules
}

export interface FootnoteMarker {
  id: string
  number: number
  footnoteId: string
}

export interface FootnoteContent {
  id: string
  number: number
  content: string
  sourceBlockId: string
}

export interface PaginationRules {
  keepWithNext?: boolean // Don't break after this block
  keepTogether?: boolean // Don't break within this block
  breakBefore?: boolean // Always break before this block
  breakAfter?: boolean // Always break after this block
  minOrphans?: number // Minimum lines at bottom of page/column
  minWidows?: number // Minimum lines at top of page/column
  breakAvoid?: boolean // Avoid breaking this block if possible
}

export interface Flow {
  id: string
  name: string
  description?: string
  blocks: Block[]
  type: 'linear' | 'branching' | 'grid'
  metadata?: Record<string, any>
  order: number
}

export interface PageMaster {
  pageSize: 'Letter' | 'A4' | 'Legal' | 'Tabloid'
  orientation?: 'portrait' | 'landscape'
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  columns: 1 | 2 | 3
  columnGap: number
  hasHeader: boolean
  hasFooter: boolean
  baselineGrid: boolean
  gridSpacing: number
  allowTableRotation?: boolean
  tableBreakRules?: {
    repeatHeader: boolean
    avoidRowSplit: boolean
    keepTogetherRows: number
  }
}

export interface Section {
  id: string
  name: string
  description?: string
  flows: Flow[]
  pageMaster: PageMaster
  layoutIntent?: LayoutIntent
  metadata?: Record<string, any>
  order: number
  footnotes: FootnoteContent[]
  useEndnotes?: boolean
  includeInTOC?: boolean
}

export type LayoutIntent = 
  | 'cover'
  | 'executive-summary' 
  | 'body'
  | 'data-appendix'
  | 'custom'

export interface SemanticDocument {
  id: string
  title: string
  description?: string
  sections: Section[]
  theme?: Theme
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

// Factory functions
export const createBlock = (
  type: Block['type'],
  content: any,
  order: number = 0
): Block => {
  const defaultRules = getDefaultPaginationRules(type)
  return {
    id: crypto.randomUUID(),
    type,
    content,
    order,
    paginationRules: defaultRules
  }
}

// Get default pagination rules for block type
export const getDefaultPaginationRules = (type: Block['type']): PaginationRules => {
  switch (type) {
    case 'heading':
      return {
        keepWithNext: true, // Headings should stay with following content
        minOrphans: 1, // At least one line must follow
        breakAvoid: true
      }
    case 'paragraph':
      return {
        minOrphans: 2, // At least 2 lines at bottom
        minWidows: 2, // At least 2 lines at top
        breakAvoid: false
      }
    case 'ordered-list':
    case 'unordered-list':
      return {
        breakAvoid: true, // Lists prefer to stay together
        keepTogether: true,
        minOrphans: 2,
        minWidows: 2
      }
    case 'quote':
      return {
        breakAvoid: true, // Quotes prefer to stay together
        minOrphans: 2,
        minWidows: 2
      }
    case 'figure':
      return {
        keepTogether: true, // Figures are atomic
        breakAvoid: true, // Never split figures
        keepWithNext: false
      }
    case 'chart':
      return {
        keepTogether: true, // Charts are atomic
        breakAvoid: true, // Never split charts
        keepWithNext: false
      }
    case 'table':
      return {
        keepTogether: false, // Tables can span pages but not split rows
        breakAvoid: false, // Tables can be broken between rows
        minOrphans: 1, // At least header + 1 row
        minWidows: 1
      }
    case 'divider':
      return {
        keepWithNext: true, // Dividers should stay with following content
        breakAvoid: true
      }
    case 'spacer':
      return {
        breakAvoid: false // Spacers can be broken
      }
    case 'cross-reference':
      return {
        breakAvoid: true, // Cross-references should not be broken
        keepWithNext: false
      }
    case 'callout':
      return {
        breakAvoid: true, // Callouts prefer to stay together
        keepTogether: true,
        minOrphans: 2,
        minWidows: 2
      }
    case 'footnote':
      return {
        breakAvoid: true, // Footnotes should not be broken
        keepTogether: true
      }
    case 'table-of-contents':
      return {
        breakAvoid: false, // TOC can span pages
        keepTogether: false,
        minOrphans: 2,
        minWidows: 2
      }
    default:
      return {}
  }
}

export const createFlow = (
  name: string,
  type: Flow['type'] = 'linear',
  order: number = 0
): Flow => ({
  id: crypto.randomUUID(),
  name,
  blocks: [],
  type,
  order
})

export const createPageMaster = (): PageMaster => ({
  pageSize: 'Letter',
  orientation: 'portrait',
  margins: {
    top: 1,
    right: 1,
    bottom: 1,
    left: 1
  },
  columns: 1,
  columnGap: 0.25,
  hasHeader: false,
  hasFooter: false,
  baselineGrid: false,
  gridSpacing: 0.125,
  allowTableRotation: false
})

export const createSection = (name: string, order: number = 0): Section => ({
  id: crypto.randomUUID(),
  name,
  flows: [],
  pageMaster: createPageMaster(),
  order,
  footnotes: [],
  useEndnotes: false,
  includeInTOC: true
})

export const createDocument = (title: string): SemanticDocument => {
  // Create default "Body" section with "Main" flow
  const mainFlow = createFlow('Main', 'linear', 0)
  const bodySection = createSection('Body', 0)
  const sectionWithFlow = addFlowToSection(bodySection, mainFlow)
  
  return {
    id: crypto.randomUUID(),
    title,
    sections: [sectionWithFlow],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

// Helper functions
export const addBlockToFlow = (flow: Flow, block: Block): Flow => ({
  ...flow,
  blocks: [...flow.blocks, block].sort((a, b) => a.order - b.order)
})

export const addFlowToSection = (section: Section, flow: Flow): Section => ({
  ...section,
  flows: [...section.flows, flow].sort((a, b) => a.order - b.order)
})

export const addSectionToDocument = (doc: SemanticDocument, section: Section): SemanticDocument => ({
  ...doc,
  sections: [...doc.sections, section].sort((a, b) => a.order - b.order),
  updated_at: new Date().toISOString()
})