import { useCallback, useMemo } from 'react'
import { SemanticDocument, Block } from '@/lib/document-model'

export interface ReferenceableElement {
  id: string
  type: 'heading' | 'figure' | 'table' | 'chart'
  label: string
  number: number | string
  title?: string
  pageNumber?: number
}

export interface CrossReference {
  targetId: string
  type: 'see' | 'reference' | 'equation' | 'page'
  format: 'full' | 'number-only' | 'title-only'
}

export const useCrossReferences = (document: SemanticDocument | null) => {
  // Extract all referenceable elements from the document
  const referenceableElements = useMemo(() => {
    if (!document) return []

    const elements: ReferenceableElement[] = []
    let headingCounters = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    let figureCounter = 0
    let tableCounter = 0
    let chartCounter = 0

    // Traverse all sections, flows, and blocks
    document.sections.forEach(section => {
      section.flows.forEach(flow => {
        flow.blocks
          .sort((a, b) => a.order - b.order)
          .forEach(block => {
            switch (block.type) {
              case 'heading':
                const level = block.metadata?.level || 1
                headingCounters[level as keyof typeof headingCounters]++
                
                // Reset lower-level counters when a higher-level heading is encountered
                for (let i = level + 1; i <= 6; i++) {
                  headingCounters[i as keyof typeof headingCounters] = 0
                }

                // Create hierarchical numbering (e.g., "1.2.1")
                const numberParts = []
                for (let i = 1; i <= level; i++) {
                  if (headingCounters[i as keyof typeof headingCounters] > 0) {
                    numberParts.push(headingCounters[i as keyof typeof headingCounters])
                  }
                }
                
                elements.push({
                  id: block.id,
                  type: 'heading',
                  label: `Section ${numberParts.join('.')}`,
                  number: numberParts.join('.'),
                  title: block.content?.toString() || 'Untitled Section'
                })
                break

              case 'figure':
                figureCounter++
                elements.push({
                  id: block.id,
                  type: 'figure',
                  label: `Figure ${figureCounter}`,
                  number: figureCounter,
                  title: block.content?.caption || 'Untitled Figure'
                })
                break

              case 'table':
                tableCounter++
                elements.push({
                  id: block.id,
                  type: 'table',
                  label: `Table ${tableCounter}`,
                  number: tableCounter,
                  title: block.content?.caption || 'Untitled Table'
                })
                break

              case 'chart':
                chartCounter++
                elements.push({
                  id: block.id,
                  type: 'chart',
                  label: `Chart ${chartCounter}`,
                  number: chartCounter,
                  title: block.content?.caption || block.content?.title || 'Untitled Chart'
                })
                break
            }
          })
      })
    })

    return elements
  }, [document])

  // Get a referenceable element by ID
  const getElementById = useCallback((id: string) => {
    return referenceableElements.find(element => element.id === id)
  }, [referenceableElements])

  // Format a cross-reference
  const formatCrossReference = useCallback((
    crossRef: CrossReference, 
    pageNumber?: number
  ): string => {
    const element = getElementById(crossRef.targetId)
    if (!element) return '[Invalid reference]'

    switch (crossRef.format) {
      case 'number-only':
        return element.number.toString()
      
      case 'title-only':
        return element.title || 'Untitled'
      
      case 'full':
      default:
        const baseRef = `${element.label}`
        if (crossRef.type === 'see') {
          return pageNumber 
            ? `See ${baseRef} on page ${pageNumber}`
            : `See ${baseRef}`
        } else if (crossRef.type === 'page') {
          return pageNumber ? `page ${pageNumber}` : '[page unknown]'
        } else {
          return baseRef
        }
    }
  }, [getElementById])

  // Get available references for insertion
  const getAvailableReferences = useCallback(() => {
    return referenceableElements.map(element => ({
      id: element.id,
      label: element.label,
      title: element.title,
      type: element.type
    }))
  }, [referenceableElements])

  // Create a cross-reference block content
  const createCrossReference = useCallback((
    targetId: string, 
    type: CrossReference['type'] = 'see',
    format: CrossReference['format'] = 'full'
  ) => {
    return {
      targetId,
      type,
      format
    }
  }, [])

  return {
    referenceableElements,
    getElementById,
    formatCrossReference,
    getAvailableReferences,
    createCrossReference
  }
}