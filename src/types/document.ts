// Core document structure types

export interface Block {
  id: string
  type: 'heading' | 'paragraph' | 'image' | 'list' | 'quote'
  content: string
  properties?: Record<string, any>
  style?: Style
  createdAt: string
  updatedAt: string
}

export interface Flow {
  id: string
  name: string
  blocks: Block[]
  style?: Style
  createdAt: string
  updatedAt: string
}

export interface Section {
  id: string
  name: string
  flows: Flow[]
  style?: Style
  createdAt: string
  updatedAt: string
}

export interface Style {
  id: string
  name?: string
  properties: Record<string, any> // CSS-like properties
  createdAt: string
  updatedAt: string
}

export interface Theme {
  id: string
  name: string
  colors: Record<string, string>
  typography: Record<string, any>
  spacing: Record<string, string>
  styles: Style[]
  createdAt: string
  updatedAt: string
}

export interface Document {
  id: string
  title: string
  sections: Section[]
  theme?: Theme
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

// Block type definitions
export interface HeadingBlock extends Block {
  type: 'heading'
  content: string
  level: 1 | 2 | 3 | 4 | 5 | 6
}

export interface ParagraphBlock extends Block {
  type: 'paragraph'
  content: string
}

export interface ImageBlock extends Block {
  type: 'image'
  content: string // URL or path
  alt?: string
  caption?: string
}

// Factory functions for creating new entities
export const createBlock = (type: Block['type'], content: string): Block => ({
  id: crypto.randomUUID(),
  type,
  content,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export const createFlow = (name: string): Flow => ({
  id: crypto.randomUUID(),
  name,
  blocks: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export const createSection = (name: string): Section => ({
  id: crypto.randomUUID(),
  name,
  flows: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export const createDocument = (title: string): Document => ({
  id: crypto.randomUUID(),
  title,
  sections: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})