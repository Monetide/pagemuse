import { useState, useCallback, useEffect } from 'react'
import {
  SemanticDocument,
  Section,
  Flow,
  Block,
  createDocument,
  createSection,
  createFlow,
  createBlock,
  addBlockToFlow,
  addFlowToSection,
  addSectionToDocument
} from '@/lib/document-model'
import { useDocumentPersistence } from '@/hooks/useDocumentPersistence'

export const useDocumentModel = () => {
  const [document, setDocument] = useState<SemanticDocument | null>(null)
  const persistence = useDocumentPersistence()
  const [autoSaveTimeoutId, setAutoSaveTimeoutId] = useState<NodeJS.Timeout | null>(null)

  // Auto-save with debouncing
  const triggerAutoSave = useCallback((doc: SemanticDocument) => {
    if (autoSaveTimeoutId) {
      clearTimeout(autoSaveTimeoutId)
    }
    
    const timeoutId = setTimeout(() => {
      persistence.saveDocument(doc)
    }, 1000) // 1 second debounce
    
    setAutoSaveTimeoutId(timeoutId)
  }, [autoSaveTimeoutId, persistence])

  const createNewDocument = useCallback((title: string) => {
    const newDoc = createDocument(title)
    setDocument(newDoc)
    persistence.createNewDocument()
    return newDoc
  }, [persistence])

  const loadDocument = useCallback(async (documentId: string) => {
    const doc = await persistence.loadDocument(documentId)
    if (doc) {
      setDocument(doc)
    }
    return doc
  }, [persistence])

  const addSection = useCallback((name: string, order?: number) => {
    if (!document) return null
    
    const section = createSection(name, order ?? document.sections.length)
    const updatedDoc = addSectionToDocument(document, section)
    setDocument(updatedDoc)
    triggerAutoSave(updatedDoc)
    return section
  }, [document, triggerAutoSave])

  const addFlow = useCallback((sectionId: string, name: string, type: Flow['type'] = 'linear') => {
    if (!document) return null
    
    const section = document.sections.find(s => s.id === sectionId)
    if (!section) return null
    
    const flow = createFlow(name, type, section.flows.length)
    const updatedSection = addFlowToSection(section, flow)
    
    const updatedDoc = {
      ...document,
      sections: document.sections.map(s => s.id === sectionId ? updatedSection : s),
      updated_at: new Date().toISOString()
    }
    setDocument(updatedDoc)
    triggerAutoSave(updatedDoc)
    return flow
  }, [document, triggerAutoSave])

  const addBlock = useCallback((
    sectionId: string,
    flowId: string,
    type: Block['type'],
    content: any
  ) => {
    if (!document) return null
    
    const section = document.sections.find(s => s.id === sectionId)
    if (!section) return null
    
    const flow = section.flows.find(f => f.id === flowId)
    if (!flow) return null
    
    const block = createBlock(type, content, flow.blocks.length)
    const updatedFlow = addBlockToFlow(flow, block)
    
    const updatedSection = {
      ...section,
      flows: section.flows.map(f => f.id === flowId ? updatedFlow : f)
    }
    
    const updatedDoc = {
      ...document,
      sections: document.sections.map(s => s.id === sectionId ? updatedSection : s),
      updated_at: new Date().toISOString()
    }
    setDocument(updatedDoc)
    triggerAutoSave(updatedDoc)
    return block
  }, [document, triggerAutoSave])

  const updateDocument = useCallback((updatedDoc: SemanticDocument) => {
    setDocument(updatedDoc)
    triggerAutoSave(updatedDoc)
  }, [triggerAutoSave])

  const updateTitle = useCallback(async (newTitle: string) => {
    if (!document) return false
    
    const updatedDoc = {
      ...document,
      title: newTitle,
      updated_at: new Date().toISOString()
    }
    setDocument(updatedDoc)
    
    // Immediate save for title changes
    if (persistence.currentDocumentId) {
      return await persistence.renameDocument(newTitle)
    }
    return true
  }, [document, persistence])

  const updateBlockContent = useCallback((blockId: string, newContent: any) => {
    if (!document) return

    const updatedDocument = {
      ...document,
      sections: document.sections.map(section => ({
        ...section,
        flows: section.flows.map(flow => ({
          ...flow,
          blocks: flow.blocks.map(block => 
            block.id === blockId 
              ? { ...block, content: newContent }
              : block
          )
        }))
      })),
      updated_at: new Date().toISOString()
    }
    
    setDocument(updatedDocument)
    triggerAutoSave(updatedDocument)
  }, [document, triggerAutoSave])

  const deleteBlock = useCallback((blockId: string) => {
    if (!document) return

    const updatedDocument = {
      ...document,
      sections: document.sections.map(section => ({
        ...section,
        flows: section.flows.map(flow => ({
          ...flow,
          blocks: flow.blocks.filter(block => block.id !== blockId)
        }))
      })),
      updated_at: new Date().toISOString()
    }
    
    setDocument(updatedDocument)
    triggerAutoSave(updatedDocument)
  }, [document, triggerAutoSave])

  const addBlockAfter = useCallback((afterBlockId: string, type: Block['type'], content: any = '', metadata?: any) => {
    if (!document) return

    const insertBefore = metadata?.insertBefore
    const cleanMetadata = metadata ? { ...metadata } : {}
    delete cleanMetadata?.insertBefore

    // Special case: creating first block in empty document
    if (afterBlockId === 'create-first') {
      const firstSection = document.sections[0]
      const firstFlow = firstSection?.flows[0]
      
      if (firstSection && firstFlow) {
        const newBlock = createBlock(type, content, 0)
        if (cleanMetadata && Object.keys(cleanMetadata).length > 0) {
          newBlock.metadata = { ...newBlock.metadata, ...cleanMetadata }
        }
        const updatedDocument = {
          ...document,
          sections: document.sections.map(section => 
            section.id === firstSection.id
              ? {
                  ...section,
                  flows: section.flows.map(flow =>
                    flow.id === firstFlow.id
                      ? addBlockToFlow(flow, newBlock)
                      : flow
                  )
                }
              : section
          ),
          updated_at: new Date().toISOString()
        }
        
        setDocument(updatedDocument)
        triggerAutoSave(updatedDocument)
        return newBlock
      }
      return
    }

    // Find the section and flow containing the target block
    let targetSectionId = ''
    let targetFlowId = ''
    let targetBlockOrder = 0

    for (const section of document.sections) {
      for (const flow of section.flows) {
        const targetBlock = flow.blocks.find(block => block.id === afterBlockId)
        if (targetBlock) {
          targetSectionId = section.id
          targetFlowId = flow.id
          targetBlockOrder = targetBlock.order
          break
        }
      }
      if (targetSectionId) break
    }

    if (targetSectionId && targetFlowId) {
      // Create new block with order before or after target block
      const newOrder = insertBefore ? 
        targetBlockOrder - 0.1 : // Insert before
        targetBlockOrder + 0.5   // Insert after
        
      const newBlock = createBlock(type, content, newOrder)
      if (cleanMetadata && Object.keys(cleanMetadata).length > 0) {
        newBlock.metadata = { ...newBlock.metadata, ...cleanMetadata }
      }
      
      const updatedDocument = {
        ...document,
        sections: document.sections.map(section => 
          section.id === targetSectionId
            ? {
                ...section,
                flows: section.flows.map(flow =>
                  flow.id === targetFlowId
                    ? addBlockToFlow(flow, newBlock)
                    : flow
                )
              }
            : section
        ),
        updated_at: new Date().toISOString()
      }
      
      setDocument(updatedDocument)
      triggerAutoSave(updatedDocument)
      return newBlock
    }
  }, [document, triggerAutoSave])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutId) {
        clearTimeout(autoSaveTimeoutId)
      }
    }
  }, [autoSaveTimeoutId])

  return {
    document,
    createNewDocument,
    loadDocument,
    addSection,
    addFlow,
    addBlock,
    setDocument: updateDocument,
    updateTitle,
    updateBlockContent,
    deleteBlock,
    addBlockAfter,
    persistence
  }
}