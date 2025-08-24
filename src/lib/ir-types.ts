/**
 * Intermediate Representation (IR) Types
 * Format-agnostic document structure that captures semantic meaning
 */

export interface IRDocument {
  title: string
  sections: IRSection[]
  metadata?: IRMetadata
  assets?: IRAssetRef[]
}

export interface IRSection {
  id: string
  title?: string
  blocks: IRBlock[]
  notes?: IRFootnote[]
  order: number
  metadata?: Record<string, any>
  sidebarEnabled?: boolean
  sidebarBlocks?: IRBlock[]
}

export interface IRBlock {
  id: string
  type: IRBlockType
  content: any
  marks?: IRMark[]
  attrs?: Record<string, any>
  order: number
}

export type IRBlockType = 
  | 'heading'
  | 'paragraph' 
  | 'list'
  | 'table'
  | 'figure'
  | 'callout'
  | 'quote'
  | 'horizontal-rule'
  | 'code'
  | 'divider'
  | 'spacer'
  | 'toc'
  | 'chart'

export interface IRMark {
  type: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link' | 'highlight'
  attrs?: Record<string, any>
}

export interface IRHeading {
  level: 1 | 2 | 3 | 4 | 5 | 6
  text: string
  anchor?: string
}

export interface IRList {
  type: 'ordered' | 'unordered' | 'task'
  items: IRListItem[]
  tight?: boolean
}

export interface IRListItem {
  content: string
  children?: IRList
  checked?: boolean // For task lists
}

export interface IRTable {
  headers?: string[]
  rows: string[][]
  caption?: string
  headerRow?: boolean
  alignment?: ('left' | 'center' | 'right')[]
}

export interface IRFigure {
  image: IRAssetRef
  caption?: string
  alt?: string
  size?: 'small' | 'medium' | 'large' | 'full-width'
  alignment?: 'left' | 'center' | 'right'
}

export interface IRCallout {
  type: 'info' | 'warning' | 'error' | 'success' | 'note'
  title?: string
  content: string
}

export interface IRQuote {
  content: string
  citation?: string
  author?: string
}

export interface IRCode {
  language?: string
  content: string
  inline?: boolean
}

export interface IRAssetRef {
  id: string
  url?: string
  filename: string
  mimeType: string
  size?: number
  alt?: string
  title?: string
}

export interface IRFootnote {
  id: string
  number: number
  content: string
  backlinks?: string[] // Block IDs that reference this footnote
}

export interface IRMetadata {
  author?: string
  created?: Date
  modified?: Date
  language?: string
  tags?: string[]
  description?: string
  [key: string]: any
}

// Utility functions for working with IR

export const createIRDocument = (title: string): IRDocument => ({
  title,
  sections: [],
  metadata: {
    created: new Date(),
    modified: new Date()
  },
  assets: []
})

export const createIRSection = (title?: string, order: number = 1): IRSection => ({
  id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  title,
  blocks: [],
  notes: [],
  order
})

export const createIRBlock = (
  type: IRBlockType, 
  content: any, 
  order: number = 1,
  attrs?: Record<string, any>
): IRBlock => ({
  id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type,
  content,
  marks: [],
  attrs,
  order
})

export const createIRHeading = (level: number, text: string): IRHeading => ({
  level: Math.min(6, Math.max(1, level)) as 1 | 2 | 3 | 4 | 5 | 6,
  text,
  anchor: text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
})

export const createIRList = (
  type: 'ordered' | 'unordered' | 'task',
  items: string[]
): IRList => ({
  type,
  items: items.map(item => ({ content: item })),
  tight: true
})

export const createIRTable = (
  headers: string[],
  rows: string[][],
  caption?: string
): IRTable => ({
  headers,
  rows,
  caption,
  headerRow: true,
  alignment: headers.map(() => 'left' as const)
})

export const createIRFigure = (
  image: IRAssetRef,
  caption?: string,
  alt?: string
): IRFigure => ({
  image,
  caption,
  alt,
  size: 'medium',
  alignment: 'center'
})

export const createIRCallout = (
  type: IRCallout['type'],
  content: string,
  title?: string
): IRCallout => ({
  type,
  content,
  title
})

export const createIRQuote = (content: string, citation?: string): IRQuote => ({
  content,
  citation
})

// Validation functions
export const validateIRDocument = (doc: IRDocument): boolean => {
  if (!doc.title || !Array.isArray(doc.sections)) {
    return false
  }
  
  return doc.sections.every(section => 
    section.id && 
    Array.isArray(section.blocks) &&
    typeof section.order === 'number'
  )
}

export const validateIRBlock = (block: IRBlock): boolean => {
  return Boolean(
    block.id &&
    block.type &&
    block.content !== undefined &&
    typeof block.order === 'number'
  )
}