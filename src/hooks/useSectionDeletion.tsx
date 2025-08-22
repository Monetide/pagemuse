import { useState, useCallback } from 'react'
import { Section, Block, SemanticDocument } from '@/lib/document-model'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'

export interface TrashedSection {
  id: string
  section: Section
  deletedAt: Date
  originalPosition: number
  contentAction: 'delete' | 'move'
  targetSectionId?: string
  removeCrossRefs: boolean
}

interface SectionDeletionState {
  trashedSections: TrashedSection[]
  lastDeletedSections: TrashedSection[]
}

export const useSectionDeletion = () => {
  const [state, setState] = useState<SectionDeletionState>({
    trashedSections: [],
    lastDeletedSections: []
  })

  const deleteSections = useCallback((
    document: SemanticDocument,
    sectionIds: string[],
    contentAction: 'delete' | 'move',
    targetSectionId?: string,
    removeCrossRefs: boolean = true,
    onUndo?: () => void
  ): SemanticDocument => {
    const sectionsToDelete = document.sections.filter(s => sectionIds.includes(s.id))
    const remainingSections = document.sections.filter(s => !sectionIds.includes(s.id))
    
    // Create trashed section records
    const trashedSectionRecords: TrashedSection[] = sectionsToDelete.map(section => ({
      id: `trash-${section.id}-${Date.now()}`,
      section,
      deletedAt: new Date(),
      originalPosition: document.sections.findIndex(s => s.id === section.id),
      contentAction,
      targetSectionId,
      removeCrossRefs
    }))

    let updatedDocument = { ...document }

    // Handle content movement if specified
    if (contentAction === 'move' && targetSectionId) {
      const targetSection = remainingSections.find(s => s.id === targetSectionId)
      if (targetSection) {
        // Collect all blocks from sections being deleted
        const blocksToMove: Block[] = []
        sectionsToDelete.forEach(section => {
          section.flows.forEach(flow => {
            blocksToMove.push(...flow.blocks)
          })
        })

        // Add blocks to target section's first flow (or create one if needed)
        const updatedTargetSection = { ...targetSection }
        if (updatedTargetSection.flows.length === 0) {
          updatedTargetSection.flows = [{
            id: `flow-${Date.now()}`,
            name: 'Main Content',
            type: 'linear' as const,
            blocks: blocksToMove.map((block, index) => ({ ...block, order: index })),
            order: 0
          }]
        } else {
          const firstFlow = updatedTargetSection.flows[0]
          const maxOrder = Math.max(...firstFlow.blocks.map(b => b.order), -1)
          updatedTargetSection.flows[0] = {
            ...firstFlow,
            blocks: [
              ...firstFlow.blocks,
              ...blocksToMove.map((block, index) => ({ 
                ...block, 
                order: maxOrder + index + 1 
              }))
            ]
          }
        }

        // Update the remaining sections
        updatedDocument.sections = remainingSections.map(s => 
          s.id === targetSectionId ? updatedTargetSection : s
        )
      }
    } else {
      // Just remove the sections
      updatedDocument.sections = remainingSections
    }

    // Handle cross-references if specified
    if (removeCrossRefs) {
      updatedDocument = removeCrossReferencesToSections(updatedDocument, sectionIds)
    }

    // Handle TOC relocation
    updatedDocument = handleTOCRelocation(updatedDocument, sectionsToDelete)

    // Update section orders
    updatedDocument.sections = updatedDocument.sections.map((section, index) => ({
      ...section,
      order: index
    }))

    updatedDocument.updated_at = new Date().toISOString()

    // Update state
    setState(prev => ({
      trashedSections: [...prev.trashedSections, ...trashedSectionRecords],
      lastDeletedSections: trashedSectionRecords
    }))

    // Show toast with undo option
    const sectionNames = sectionsToDelete.map(s => s.name).join(', ')
    const message = sectionsToDelete.length === 1 
      ? `Section "${sectionNames}" deleted`
      : `${sectionsToDelete.length} sections deleted`

    toast({
      title: message,
      description: "Moved to trash for 30 days",
      action: onUndo ? (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onUndo}
        >
          Undo
        </Button>
      ) : undefined
    })

    return updatedDocument
  }, [])

  const restoreSection = useCallback((
    document: SemanticDocument,
    trashedSectionId: string
  ): SemanticDocument => {
    const trashedSection = state.trashedSections.find(t => t.id === trashedSectionId)
    if (!trashedSection) return document

    // Insert section back at original position
    const newSections = [...document.sections]
    const insertIndex = Math.min(trashedSection.originalPosition, newSections.length)
    newSections.splice(insertIndex, 0, trashedSection.section)

    // Update state
    setState(prev => ({
      ...prev,
      trashedSections: prev.trashedSections.filter(t => t.id !== trashedSectionId)
    }))

    toast({
      title: "Section restored",
      description: `"${trashedSection.section.name}" has been restored to its original position.`
    })

    return {
      ...document,
      sections: newSections.map((section, index) => ({ ...section, order: index })),
      updated_at: new Date().toISOString()
    }
  }, [state.trashedSections])

  const undoLastDeletion = useCallback((document: SemanticDocument): SemanticDocument => {
    if (state.lastDeletedSections.length === 0) return document

    let updatedDocument = { ...document }
    
    // Restore all sections from last deletion in reverse order to maintain positions
    const sectionsToRestore = [...state.lastDeletedSections].reverse()
    
    sectionsToRestore.forEach(trashedSection => {
      const newSections = [...updatedDocument.sections]
      const insertIndex = Math.min(trashedSection.originalPosition, newSections.length)
      newSections.splice(insertIndex, 0, trashedSection.section)
      updatedDocument.sections = newSections
    })

    // Remove from trash
    setState(prev => ({
      trashedSections: prev.trashedSections.filter(t => 
        !state.lastDeletedSections.some(last => last.id === t.id)
      ),
      lastDeletedSections: []
    }))

    const sectionNames = sectionsToRestore.map(t => t.section.name).join(', ')
    const message = sectionsToRestore.length === 1 
      ? `Section "${sectionNames}" restored`
      : `${sectionsToRestore.length} sections restored`

    toast({
      title: message,
      description: "Sections have been restored to their original positions."
    })

    return {
      ...updatedDocument,
      sections: updatedDocument.sections.map((section, index) => ({ ...section, order: index })),
      updated_at: new Date().toISOString()
    }
  }, [state.lastDeletedSections])

  const permanentlyDeleteSection = useCallback((trashedSectionId: string) => {
    setState(prev => ({
      ...prev,
      trashedSections: prev.trashedSections.filter(t => t.id !== trashedSectionId)
    }))

    toast({
      title: "Section permanently deleted",
      description: "This action cannot be undone."
    })
  }, [])

  const emptyTrash = useCallback(() => {
    setState(prev => ({
      ...prev,
      trashedSections: []
    }))

    toast({
      title: "Trash emptied",
      description: "All sections have been permanently deleted."
    })
  }, [])

  // Clean up expired sections (older than 30 days)
  const cleanupExpiredSections = useCallback(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    setState(prev => ({
      ...prev,
      trashedSections: prev.trashedSections.filter(t => t.deletedAt > thirtyDaysAgo)
    }))
  }, [])

  return {
    trashedSections: state.trashedSections,
    deleteSections,
    restoreSection,
    undoLastDeletion,
    permanentlyDeleteSection,
    emptyTrash,
    cleanupExpiredSections
  }
}

// Helper function to remove cross-references to deleted sections
function removeCrossReferencesToSections(document: SemanticDocument, deletedSectionIds: string[]): SemanticDocument {
  return {
    ...document,
    sections: document.sections.map(section => ({
      ...section,
      flows: section.flows.map(flow => ({
        ...flow,
        blocks: flow.blocks.map(block => {
          if (block.type === 'cross-reference' && block.content?.targetSectionId && 
              deletedSectionIds.includes(block.content.targetSectionId)) {
            // Convert cross-reference to plain text
            return {
              ...block,
              type: 'paragraph' as const,
              content: block.content.displayText || 'Reference removed',
              metadata: { ...block.metadata, wasReference: true }
            }
          }
          return block
        })
      }))
    }))
  }
}

// Helper function to handle TOC relocation
function handleTOCRelocation(document: SemanticDocument, deletedSections: Section[]): SemanticDocument {
  // Find TOC blocks in deleted sections
  const tocBlocks: Block[] = []
  deletedSections.forEach(section => {
    section.flows.forEach(flow => {
      flow.blocks.forEach(block => {
        if (block.type === 'table-of-contents') {
          tocBlocks.push(block)
        }
      })
    })
  })

  if (tocBlocks.length === 0) return document

  // Move TOC to the beginning of the first remaining section
  if (document.sections.length > 0) {
    const firstSection = document.sections[0]
    const firstFlow = firstSection.flows[0]
    
    if (firstFlow) {
      // Add TOC blocks to the beginning
      const updatedBlocks = [
        ...tocBlocks.map((block, index) => ({ ...block, order: -1000 + index })),
        ...firstFlow.blocks
      ]
      
      const updatedFirstSection = {
        ...firstSection,
        flows: [
          { ...firstFlow, blocks: updatedBlocks },
          ...firstSection.flows.slice(1)
        ]
      }

      return {
        ...document,
        sections: [updatedFirstSection, ...document.sections.slice(1)]
      }
    }
  }

  return document
}