import { SemanticDocument, Section, Block } from './document-model'
import { LayoutResult, PageBox } from './layout-engine'

export interface TOCEntry {
  id: string
  text: string
  level: number
  pageNumber: number
  sectionId: string
  sectionName: string
  blockId: string
}

export interface TOCConfiguration {
  title: string
  includeLevels: boolean[] // [H1, H2, H3, H4, H5, H6]
  excludeSections: string[] // Section IDs to exclude
  columns: 1 | 2
  columnGap: number
  showPageNumbers: boolean
  pageNumberAlignment: 'right' | 'inline'
  leader: 'dots' | 'dashes' | 'none'
  indentPerLevel: number
  itemSpacing: number
  linkStyle: 'hover' | 'always' | 'none'
  autoUpdate: boolean
  allowPageBreaks: boolean
  showContinued: boolean
}

export const defaultTOCConfig: TOCConfiguration = {
  title: 'Table of Contents',
  includeLevels: [true, true, true, false, false, false], // H1-H3 by default
  excludeSections: [],
  columns: 1,
  columnGap: 0.5,
  showPageNumbers: true,
  pageNumberAlignment: 'right',
  leader: 'dots',
  indentPerLevel: 0.25,
  itemSpacing: 0.125,
  linkStyle: 'hover',
  autoUpdate: true,
  allowPageBreaks: true,
  showContinued: true
}

export const generateTOC = (
  document: SemanticDocument | null,
  layoutResults: Map<string, LayoutResult>,
  config: TOCConfiguration,
  currentSectionId?: string
): TOCEntry[] => {
  if (!document) return []

  const entries: TOCEntry[] = []

  // Process each section
  for (const section of document.sections.sort((a, b) => a.order - b.order)) {
    // Skip excluded sections
    if (config.excludeSections.includes(section.id)) continue
    
    // Skip current section to prevent recursion
    if (section.id === currentSectionId) continue
    
    // Skip sections marked as exclude from TOC
    if (section.includeInTOC === false) continue

    const layoutResult = layoutResults.get(section.id)
    if (!layoutResult) continue

    // Process each flow in the section
    for (const flow of section.flows.sort((a, b) => a.order - b.order)) {
      for (const block of flow.blocks.sort((a, b) => a.order - b.order)) {
        if (block.type === 'heading') {
          const level = block.metadata?.level || 1
          
          // Check if this heading level should be included
          if (!config.includeLevels[level - 1]) continue
          
          // Check if heading has "include in TOC" disabled
          if (block.metadata?.includeInTOC === false) continue

          // Find the page number for this block
          const pageNumber = findBlockPageNumber(block.id, layoutResult)
          
          if (pageNumber > 0) {
            entries.push({
              id: crypto.randomUUID(),
              text: typeof block.content === 'string' ? block.content : block.content?.text || 'Untitled',
              level,
              pageNumber,
              sectionId: section.id,
              sectionName: section.name,
              blockId: block.id
            })
          }
        }
      }
    }
  }

  return entries
}

const findBlockPageNumber = (blockId: string, layoutResult: LayoutResult): number => {
  for (const page of layoutResult.pages) {
    for (const column of page.columnBoxes) {
      for (const block of column.content) {
        if (block.id === blockId || block.metadata?.originalBlockId === blockId) {
          return page.pageNumber
        }
      }
    }
  }
  return 0
}

export const formatTOCEntry = (entry: TOCEntry, config: TOCConfiguration): string => {
  const indent = '  '.repeat((entry.level - 1) * Math.floor(config.indentPerLevel * 4))
  const leader = config.leader === 'dots' ? '.' : config.leader === 'dashes' ? '-' : ' '
  
  if (!config.showPageNumbers) {
    return `${indent}${entry.text}`
  }
  
  if (config.pageNumberAlignment === 'inline') {
    return `${indent}${entry.text} (p. ${entry.pageNumber})`
  }
  
  // Right-aligned with leader
  const maxWidth = 80 // Approximate characters per line
  const textWithIndent = `${indent}${entry.text}`
  const pageText = `${entry.pageNumber}`
  const availableSpace = maxWidth - textWithIndent.length - pageText.length
  const leaderCount = Math.max(2, availableSpace)
  const leaderLine = config.leader === 'none' ? ' '.repeat(leaderCount) : leader.repeat(leaderCount)
  
  return `${textWithIndent}${leaderLine}${pageText}`
}

export const shouldUpdateTOC = (
  lastUpdate: string,
  document: SemanticDocument | null
): boolean => {
  if (!document) return false
  return new Date(document.updated_at) > new Date(lastUpdate)
}