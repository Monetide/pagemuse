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
  type: 'heading' | 'paragraph' | 'ordered-list' | 'unordered-list' | 'quote' | 'divider' | 'spacer'
  content: any
  styles?: Style[]
  metadata?: Record<string, any>
  order: number
  paginationRules?: PaginationRules
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
}

export interface Section {
  id: string
  name: string
  description?: string
  flows: Flow[]
  pageMaster: PageMaster
  metadata?: Record<string, any>
  order: number
}

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
    case 'divider':
      return {
        keepWithNext: true, // Dividers should stay with following content
        breakAvoid: true
      }
    case 'spacer':
      return {
        breakAvoid: false // Spacers can be broken
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
  gridSpacing: 0.125
})

export const createSection = (name: string, order: number = 0): Section => ({
  id: crypto.randomUUID(),
  name,
  flows: [],
  pageMaster: createPageMaster(),
  order
})

export const createDocument = (title: string): SemanticDocument => ({
  id: crypto.randomUUID(),
  title,
  sections: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

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