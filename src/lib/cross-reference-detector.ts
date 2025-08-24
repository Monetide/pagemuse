import { IRDocument, IRSection, IRBlock } from './ir-types'

export interface CrossReferencePattern {
  pattern: RegExp
  type: 'figure' | 'table' | 'section' | 'page' | 'heading' | 'chart'
  format: 'name-number' | 'number-only' | 'see-name-number' | 'see-page'
}

export interface DetectedCrossReference {
  id: string
  sourceBlockId: string
  matchText: string
  targetType: 'figure' | 'table' | 'section' | 'page' | 'heading' | 'chart'
  targetNumber?: number
  targetId?: string
  startIndex: number
  endIndex: number
  confidence: number
  suggestedReplacement: string
}

// Comprehensive patterns for detecting cross-references
export const crossReferencePatterns: CrossReferencePattern[] = [
  // Figure references
  { pattern: /(?:see\s+)?(?:figure|fig\.?)\s+(\d+)/gi, type: 'figure', format: 'see-name-number' },
  { pattern: /(?:in\s+)?figure\s+(\d+)/gi, type: 'figure', format: 'name-number' },
  { pattern: /fig\.?\s+(\d+)/gi, type: 'figure', format: 'name-number' },
  
  // Table references  
  { pattern: /(?:see\s+)?table\s+(\d+)/gi, type: 'table', format: 'see-name-number' },
  { pattern: /(?:in\s+)?table\s+(\d+)/gi, type: 'table', format: 'name-number' },
  
  // Chart references
  { pattern: /(?:see\s+)?chart\s+(\d+)/gi, type: 'chart', format: 'see-name-number' },
  { pattern: /(?:in\s+)?chart\s+(\d+)/gi, type: 'chart', format: 'name-number' },
  
  // Section references
  { pattern: /(?:see\s+)?section\s+(\d+(?:\.\d+)*)/gi, type: 'section', format: 'see-name-number' },
  { pattern: /(?:in\s+)?section\s+(\d+(?:\.\d+)*)/gi, type: 'section', format: 'name-number' },
  
  // Page references
  { pattern: /(?:see\s+)?page\s+(\d+)/gi, type: 'page', format: 'see-page' },
  { pattern: /(?:on\s+)?page\s+(\d+)/gi, type: 'page', format: 'see-page' },
  { pattern: /\(p\.?\s*(\d+)\)/gi, type: 'page', format: 'number-only' },
  
  // Chapter references
  { pattern: /(?:see\s+)?chapter\s+(\d+)/gi, type: 'section', format: 'see-name-number' },
  { pattern: /(?:in\s+)?chapter\s+(\d+)/gi, type: 'section', format: 'name-number' }
]

export const detectCrossReferences = (document: IRDocument): DetectedCrossReference[] => {
  const references: DetectedCrossReference[] = []
  
  // Build target element registry
  const targetRegistry = buildTargetRegistry(document)
  
  // Scan all text content for patterns
  for (const section of document.sections) {
    for (const block of section.blocks) {
      if (block.type === 'paragraph' || block.type === 'heading') {
        const textContent = typeof block.content === 'string' 
          ? block.content 
          : block.content?.text || ''
        
        const blockRefs = findReferencesInText(
          textContent, 
          block.id, 
          targetRegistry
        )
        references.push(...blockRefs)
      }
    }
  }
  
  return references.sort((a, b) => b.confidence - a.confidence)
}

const buildTargetRegistry = (document: IRDocument) => {
  const registry = {
    figures: [] as { id: string, number: number, title?: string }[],
    tables: [] as { id: string, number: number, title?: string }[],
    charts: [] as { id: string, number: number, title?: string }[],
    sections: [] as { id: string, number: string, title?: string }[],
    headings: [] as { id: string, level: number, title: string }[]
  }
  
  let figureCount = 0
  let tableCount = 0 
  let chartCount = 0
  let sectionCount = 0
  
  for (const section of document.sections) {
    sectionCount++
    
    for (const block of section.blocks) {
      switch (block.type) {
        case 'figure':
          figureCount++
          registry.figures.push({
            id: block.id,
            number: figureCount,
            title: block.attrs?.caption
          })
          break
          
        case 'table':
          tableCount++
          registry.tables.push({
            id: block.id, 
            number: tableCount,
            title: block.attrs?.caption
          })
          break
          
        case 'chart':
          chartCount++
          registry.charts.push({
            id: block.id,
            number: chartCount, 
            title: block.attrs?.title
          })
          break
          
        case 'heading':
          registry.headings.push({
            id: block.id,
            level: block.attrs?.level || 1,
            title: typeof block.content === 'string' 
              ? block.content 
              : block.content?.text || ''
          })
          
          if (block.attrs?.level === 1 || block.attrs?.level === 2) {
            registry.sections.push({
              id: block.id,
              number: sectionCount.toString(),
              title: typeof block.content === 'string' 
                ? block.content 
                : block.content?.text || ''
            })
          }
          break
      }
    }
  }
  
  return registry
}

const findReferencesInText = (
  text: string, 
  sourceBlockId: string,
  registry: ReturnType<typeof buildTargetRegistry>
): DetectedCrossReference[] => {
  const references: DetectedCrossReference[] = []
  
  for (const pattern of crossReferencePatterns) {
    let match
    pattern.pattern.lastIndex = 0 // Reset regex state
    
    while ((match = pattern.pattern.exec(text)) !== null) {
      const matchText = match[0]
      const numberStr = match[1]
      const number = parseInt(numberStr, 10)
      
      let targetId: string | undefined
      let confidence = 0.7 // Base confidence
      
      // Try to find matching target
      switch (pattern.type) {
        case 'figure':
          const figure = registry.figures.find(f => f.number === number)
          if (figure) {
            targetId = figure.id
            confidence = 0.9
          }
          break
          
        case 'table':
          const table = registry.tables.find(t => t.number === number)
          if (table) {
            targetId = table.id
            confidence = 0.9
          }
          break
          
        case 'chart':
          const chart = registry.charts.find(c => c.number === number)
          if (chart) {
            targetId = chart.id
            confidence = 0.9
          }
          break
          
        case 'section':
          const sectionMatch = registry.sections.find(s => s.number === numberStr)
          if (sectionMatch) {
            targetId = sectionMatch.id
            confidence = 0.8
          }
          break
      }
      
      // Generate suggested replacement
      const suggestedReplacement = generateCrossReferenceReplacement(
        pattern.type,
        pattern.format,
        number,
        targetId
      )
      
      references.push({
        id: crypto.randomUUID(),
        sourceBlockId,
        matchText,
        targetType: pattern.type,
        targetNumber: number,
        targetId,
        startIndex: match.index!,
        endIndex: match.index! + matchText.length,
        confidence,
        suggestedReplacement
      })
    }
  }
  
  return references
}

const generateCrossReferenceReplacement = (
  type: string,
  format: string,
  number: number,
  targetId?: string
): string => {
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1)
  
  switch (format) {
    case 'see-name-number':
      return `{crossref:${targetId || 'unknown'}:see-${type}-${number}}`
    case 'name-number': 
      return `{crossref:${targetId || 'unknown'}:${type}-${number}}`
    case 'see-page':
      return `{crossref:${targetId || 'unknown'}:see-page}`
    case 'number-only':
      return `{crossref:${targetId || 'unknown'}:number}`
    default:
      return `{crossref:${targetId || 'unknown'}:${type}-${number}}`
  }
}

export const applyCrossReferences = (
  document: IRDocument, 
  selectedReferences: DetectedCrossReference[]
): IRDocument => {
  if (selectedReferences.length === 0) return document
  
  // Group references by source block for efficient processing
  const referencesByBlock = new Map<string, DetectedCrossReference[]>()
  for (const ref of selectedReferences) {
    if (!referencesByBlock.has(ref.sourceBlockId)) {
      referencesByBlock.set(ref.sourceBlockId, [])
    }
    referencesByBlock.get(ref.sourceBlockId)!.push(ref)
  }
  
  return {
    ...document,
    sections: document.sections.map(section => ({
      ...section,
      blocks: section.blocks.map(block => {
        const blockRefs = referencesByBlock.get(block.id)
        if (!blockRefs || blockRefs.length === 0) return block
        
        // Apply replacements (in reverse order to preserve indices)
        const sortedRefs = blockRefs.sort((a, b) => b.startIndex - a.startIndex)
        let updatedContent = typeof block.content === 'string' 
          ? block.content 
          : block.content?.text || ''
        
        for (const ref of sortedRefs) {
          updatedContent = 
            updatedContent.substring(0, ref.startIndex) +
            ref.suggestedReplacement +
            updatedContent.substring(ref.endIndex)
        }
        
        return {
          ...block,
          content: typeof block.content === 'string' 
            ? updatedContent
            : { ...block.content, text: updatedContent },
          attrs: {
            ...block.attrs,
            crossReferencesApplied: blockRefs.map(ref => ref.id)
          }
        }
      })
    }))
  }
}

export const validateCrossReferences = (document: IRDocument): {
  valid: DetectedCrossReference[]
  broken: DetectedCrossReference[]
} => {
  const allRefs = detectCrossReferences(document)
  const valid = allRefs.filter(ref => ref.targetId && ref.confidence >= 0.8)
  const broken = allRefs.filter(ref => !ref.targetId || ref.confidence < 0.8)
  
  return { valid, broken }
}