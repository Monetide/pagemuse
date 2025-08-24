import { SemanticDocument, Block } from './document-model'

export interface CrossReferencePattern {
  pattern: RegExp
  type: 'figure' | 'table' | 'heading' | 'page'
  format: 'see' | 'reference'
}

/**
 * Common cross-reference patterns to detect and convert
 */
export const CROSS_REFERENCE_PATTERNS: CrossReferencePattern[] = [
  // Figure references
  { pattern: /\b(?:see|refer to|as shown in)\s+figure\s+(\d+)/gi, type: 'figure', format: 'see' },
  { pattern: /\bfigure\s+(\d+)\b/gi, type: 'figure', format: 'reference' },
  { pattern: /\b(?:see|refer to|as shown in)\s+fig\s*\.?\s*(\d+)/gi, type: 'figure', format: 'see' },
  { pattern: /\bfig\s*\.?\s*(\d+)\b/gi, type: 'figure', format: 'reference' },

  // Table references  
  { pattern: /\b(?:see|refer to|as shown in)\s+table\s+(\d+)/gi, type: 'table', format: 'see' },
  { pattern: /\btable\s+(\d+)\b/gi, type: 'table', format: 'reference' },
  { pattern: /\b(?:see|refer to|as shown in)\s+tbl\s*\.?\s*(\d+)/gi, type: 'table', format: 'see' },

  // Section/Heading references
  { pattern: /\b(?:see|refer to)\s+section\s+(\d+(?:\.\d+)*)/gi, type: 'heading', format: 'see' },
  { pattern: /\bsection\s+(\d+(?:\.\d+)*)/gi, type: 'heading', format: 'reference' },
  { pattern: /\b(?:see|refer to)\s+chapter\s+(\d+)/gi, type: 'heading', format: 'see' },

  // Page references
  { pattern: /\b(?:see|refer to)\s+page\s+(\d+)/gi, type: 'page', format: 'see' },
  { pattern: /\bon\s+page\s+(\d+)/gi, type: 'page', format: 'reference' },
  { pattern: /\bp\.\s*(\d+)/gi, type: 'page', format: 'reference' }
]

export interface DetectedCrossReference {
  blockId: string
  originalText: string
  matchText: string
  targetNumber: string
  targetType: 'figure' | 'table' | 'heading' | 'page'
  referenceType: 'see' | 'reference'
  startIndex: number
  endIndex: number
  confidence: number
}

/**
 * Detect cross-reference patterns in document text
 */
export const detectCrossReferences = (document: SemanticDocument): DetectedCrossReference[] => {
  const detectedRefs: DetectedCrossReference[] = []

  for (const section of document.sections) {
    for (const flow of section.flows) {
      for (const block of flow.blocks) {
        const blockText = extractTextFromBlock(block)
        if (!blockText) continue

        for (const pattern of CROSS_REFERENCE_PATTERNS) {
          let match
          const regex = new RegExp(pattern.pattern)
          
          while ((match = regex.exec(blockText)) !== null) {
            detectedRefs.push({
              blockId: block.id,
              originalText: blockText,
              matchText: match[0],
              targetNumber: match[1],
              targetType: pattern.type,
              referenceType: pattern.format,
              startIndex: match.index,
              endIndex: match.index + match[0].length,
              confidence: calculateConfidence(match[0], pattern.type)
            })
          }
        }
      }
    }
  }

  return detectedRefs
}

/**
 * Convert detected patterns into actual cross-reference blocks
 */
export const convertCrossReferences = (
  document: SemanticDocument, 
  detectedRefs: DetectedCrossReference[]
): SemanticDocument => {
  if (detectedRefs.length === 0) return document

  // Build mapping of target numbers to actual block IDs
  const targetMap = buildTargetMap(document)
  
  const sections = document.sections.map(section => ({
    ...section,
    flows: section.flows.map(flow => ({
      ...flow,
      blocks: flow.blocks.map(block => {
        const blockRefs = detectedRefs.filter(ref => ref.blockId === block.id)
        if (blockRefs.length === 0) return block

        return convertBlockCrossReferences(block, blockRefs, targetMap)
      })
    }))
  }))

  return { ...document, sections }
}

/**
 * Build mapping from figure/table numbers to block IDs
 */
const buildTargetMap = (document: SemanticDocument): Map<string, string> => {
  const targetMap = new Map<string, string>()
  let figureCounter = 1
  let tableCounter = 1
  let headingCounters = [0, 0, 0, 0, 0, 0] // For H1-H6

  for (const section of document.sections) {
    for (const flow of section.flows) {
      for (const block of flow.blocks) {
        switch (block.type) {
          case 'figure':
            targetMap.set(`figure-${figureCounter}`, block.id)
            figureCounter++
            break
          
          case 'table':
            targetMap.set(`table-${tableCounter}`, block.id)
            tableCounter++
            break
          
          case 'heading':
            const level = block.metadata?.level || 1
            headingCounters[level - 1]++
            // Reset lower-level counters
            for (let i = level; i < 6; i++) {
              headingCounters[i] = 0
            }
            const sectionNumber = headingCounters.slice(0, level).join('.')
            targetMap.set(`section-${sectionNumber}`, block.id)
            break
        }
      }
    }
  }

  return targetMap
}

/**
 * Convert cross-references in a single block
 */
const convertBlockCrossReferences = (
  block: Block, 
  refs: DetectedCrossReference[], 
  targetMap: Map<string, string>
): Block => {
  const blockText = extractTextFromBlock(block)
  if (!blockText) return block

  // Sort refs by position (reverse order to maintain indices during replacement)
  const sortedRefs = refs.sort((a, b) => b.startIndex - a.startIndex)
  
  let updatedText = blockText
  const convertedRefs = []

  for (const ref of sortedRefs) {
    const targetKey = `${ref.targetType}-${ref.targetNumber}`
    const targetId = targetMap.get(targetKey)
    
    if (targetId) {
      // Replace text with cross-reference marker
      const crossRefId = crypto.randomUUID()
      const marker = `[CROSSREF:${crossRefId}]`
      
      updatedText = 
        updatedText.slice(0, ref.startIndex) + 
        marker + 
        updatedText.slice(ref.endIndex)

      convertedRefs.push({
        id: crossRefId,
        targetId,
        type: ref.referenceType,
        format: 'full' as const,
        originalText: ref.matchText
      })
    }
  }

  // Update block content and add cross-reference metadata
  const updatedBlock = { ...block }
  if (typeof updatedBlock.content === 'string') {
    updatedBlock.content = updatedText
  } else if (updatedBlock.content?.text) {
    updatedBlock.content = { ...updatedBlock.content, text: updatedText }
  }

  if (convertedRefs.length > 0) {
    updatedBlock.metadata = {
      ...updatedBlock.metadata,
      crossReferences: convertedRefs
    }
  }

  return updatedBlock
}

/**
 * Extract text content from various block types
 */
const extractTextFromBlock = (block: Block): string | null => {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
      return typeof block.content === 'string' 
        ? block.content 
        : block.content?.text || null
    
    case 'quote':
      return block.content?.quote || null
    
    case 'callout':
      return block.content?.content || null
    
    default:
      return null
  }
}

/**
 * Calculate confidence score for cross-reference detection
 */
const calculateConfidence = (matchText: string, type: string): number => {
  let confidence = 0.7 // Base confidence
  
  // Higher confidence for explicit reference words
  if (/\b(?:see|refer to|as shown in)\s/i.test(matchText)) {
    confidence += 0.2
  }
  
  // Higher confidence for proper capitalization
  if (/^[A-Z]/.test(matchText)) {
    confidence += 0.1
  }
  
  // Type-specific adjustments
  if (type === 'figure' && /figure/i.test(matchText)) {
    confidence += 0.1
  } else if (type === 'table' && /table/i.test(matchText)) {
    confidence += 0.1
  }
  
  return Math.min(confidence, 1.0)
}