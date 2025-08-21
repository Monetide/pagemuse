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
  type: 'heading' | 'paragraph' | 'image' | 'list' | 'quote' | 'code'
  content: any
  styles?: Style[]
  metadata?: Record<string, any>
  order: number
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

export interface Section {
  id: string
  name: string
  description?: string
  flows: Flow[]
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
): Block => ({
  id: crypto.randomUUID(),
  type,
  content,
  order
})

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

export const createSection = (name: string, order: number = 0): Section => ({
  id: crypto.randomUUID(),
  name,
  flows: [],
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