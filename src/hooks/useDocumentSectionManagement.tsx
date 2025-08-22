import { useCallback } from 'react'
import { useDocumentModel } from './useDocumentModel'
import { useSectionDeletion } from './useSectionDeletion'
import { Section, createSection, createFlow, addFlowToSection, addSectionToDocument } from '@/lib/document-model'
import { toast } from '@/hooks/use-toast'

export const useDocumentSectionManagement = () => {
  const documentModel = useDocumentModel()
  const sectionDeletion = useSectionDeletion()

  const handleUndoLastDeletion = useCallback(() => {
    if (!documentModel.document) return

    const updatedDocument = sectionDeletion.undoLastDeletion(documentModel.document)
    documentModel.setDocument(updatedDocument)
  }, [documentModel, sectionDeletion])

  const handleDeleteSections = useCallback((
    sectionIds: string[],
    contentAction: 'delete' | 'move' = 'delete',
    targetSectionId?: string,
    removeCrossRefs: boolean = true
  ) => {
    if (!documentModel.document) return

    const updatedDocument = sectionDeletion.deleteSections(
      documentModel.document,
      sectionIds,
      contentAction,
      targetSectionId,
      removeCrossRefs,
      handleUndoLastDeletion // Pass undo callback
    )

    documentModel.setDocument(updatedDocument)
  }, [documentModel, sectionDeletion, handleUndoLastDeletion])

  const handleRestoreSection = useCallback((trashedSectionId: string) => {
    if (!documentModel.document) return

    const updatedDocument = sectionDeletion.restoreSection(
      documentModel.document,
      trashedSectionId
    )

    documentModel.setDocument(updatedDocument)
  }, [documentModel, sectionDeletion])

  const handleRenameSection = useCallback((sectionId: string, newName: string) => {
    if (!documentModel.document) return

    const updatedDocument = {
      ...documentModel.document,
      sections: documentModel.document.sections.map(section =>
        section.id === sectionId ? { ...section, name: newName } : section
      ),
      updated_at: new Date().toISOString()
    }

    documentModel.setDocument(updatedDocument)
    
    toast({
      title: "Section renamed",
      description: `Section renamed to "${newName}"`
    })
  }, [documentModel])

  const handleDuplicateSection = useCallback((sectionId: string) => {
    if (!documentModel.document) return

    const sectionToDuplicate = documentModel.document.sections.find(s => s.id === sectionId)
    if (!sectionToDuplicate) return

    // Create a deep copy of the section with new IDs
    const duplicatedSection: Section = {
      ...sectionToDuplicate,
      id: `section-${Date.now()}`,
      name: `${sectionToDuplicate.name} (Copy)`,
      flows: sectionToDuplicate.flows.map(flow => ({
        ...flow,
        id: `flow-${Date.now()}-${Math.random()}`,
        blocks: flow.blocks.map(block => ({
          ...block,
          id: `block-${Date.now()}-${Math.random()}`
        }))
      })),
      order: documentModel.document.sections.length
    }

    const updatedDocument = addSectionToDocument(documentModel.document, duplicatedSection)
    documentModel.setDocument(updatedDocument)
    
    toast({
      title: "Section duplicated",
      description: `Created copy of "${sectionToDuplicate.name}"`
    })
  }, [documentModel])

  const handleMoveSectionUp = useCallback((sectionId: string) => {
    if (!documentModel.document) return

    const currentIndex = documentModel.document.sections.findIndex(s => s.id === sectionId)
    if (currentIndex <= 0) return

    const newSections = [...documentModel.document.sections]
    const [movedSection] = newSections.splice(currentIndex, 1)
    newSections.splice(currentIndex - 1, 0, movedSection)

    const updatedDocument = {
      ...documentModel.document,
      sections: newSections.map((section, index) => ({ ...section, order: index })),
      updated_at: new Date().toISOString()
    }

    documentModel.setDocument(updatedDocument)
    
    toast({
      title: "Section moved up",
      description: `"${movedSection.name}" moved up`
    })
  }, [documentModel])

  const handleMoveSectionDown = useCallback((sectionId: string) => {
    if (!documentModel.document) return

    const currentIndex = documentModel.document.sections.findIndex(s => s.id === sectionId)
    if (currentIndex >= documentModel.document.sections.length - 1 || currentIndex < 0) return

    const newSections = [...documentModel.document.sections]
    const [movedSection] = newSections.splice(currentIndex, 1)
    newSections.splice(currentIndex + 1, 0, movedSection)

    const updatedDocument = {
      ...documentModel.document,
      sections: newSections.map((section, index) => ({ ...section, order: index })),
      updated_at: new Date().toISOString()
    }

    documentModel.setDocument(updatedDocument)
    
    toast({
      title: "Section moved down",
      description: `"${movedSection.name}" moved down`
    })
  }, [documentModel])

  // Get helper functions for UI state
  const canDeleteSections = useCallback((sectionIds: string[]): boolean => {
    if (!documentModel.document) return false
    return documentModel.document.sections.length > sectionIds.length
  }, [documentModel.document])

  const getAdjacentSections = useCallback((sectionId: string) => {
    if (!documentModel.document) return { previous: null, next: null }

    const currentIndex = documentModel.document.sections.findIndex(s => s.id === sectionId)
    if (currentIndex < 0) return { previous: null, next: null }

    return {
      previous: currentIndex > 0 ? documentModel.document.sections[currentIndex - 1] : null,
      next: currentIndex < documentModel.document.sections.length - 1 
        ? documentModel.document.sections[currentIndex + 1] 
        : null
    }
  }, [documentModel.document])

  return {
    // Document model functions
    ...documentModel,
    
    // Section deletion functions
    trashedSections: sectionDeletion.trashedSections,
    handleDeleteSections,
    handleRestoreSection,
    handleUndoLastDeletion,
    permanentlyDeleteSection: sectionDeletion.permanentlyDeleteSection,
    emptyTrash: sectionDeletion.emptyTrash,
    
    // Section management functions
    handleRenameSection,
    handleDuplicateSection,
    handleMoveSectionUp,
    handleMoveSectionDown,
    
    // Helper functions
    canDeleteSections,
    getAdjacentSections
  }
}