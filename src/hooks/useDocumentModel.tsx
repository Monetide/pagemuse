import { useState, useCallback } from 'react'
import { 
  Document, 
  Section, 
  Flow, 
  Block, 
  createDocument, 
  createSection, 
  createFlow, 
  createBlock 
} from '@/types/document'

export const useDocumentModel = () => {
  const [document, setDocument] = useState<Document | null>(null)

  const createNewDocument = useCallback((title: string) => {
    const newDoc = createDocument(title)
    setDocument(newDoc)
    return newDoc
  }, [])

  const addSection = useCallback((name: string) => {
    if (!document) return null
    
    const newSection = createSection(name)
    setDocument(prev => ({
      ...prev!,
      sections: [...prev!.sections, newSection],
      updatedAt: new Date().toISOString()
    }))
    return newSection
  }, [document])

  const addFlow = useCallback((sectionId: string, name: string) => {
    if (!document) return null
    
    const newFlow = createFlow(name)
    setDocument(prev => ({
      ...prev!,
      sections: prev!.sections.map(section => 
        section.id === sectionId 
          ? { ...section, flows: [...section.flows, newFlow], updatedAt: new Date().toISOString() }
          : section
      ),
      updatedAt: new Date().toISOString()
    }))
    return newFlow
  }, [document])

  const addBlock = useCallback((sectionId: string, flowId: string, type: Block['type'], content: string) => {
    if (!document) return null
    
    const newBlock = createBlock(type, content)
    setDocument(prev => ({
      ...prev!,
      sections: prev!.sections.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              flows: section.flows.map(flow =>
                flow.id === flowId
                  ? { ...flow, blocks: [...flow.blocks, newBlock], updatedAt: new Date().toISOString() }
                  : flow
              ),
              updatedAt: new Date().toISOString()
            }
          : section
      ),
      updatedAt: new Date().toISOString()
    }))
    return newBlock
  }, [document])

  const updateBlock = useCallback((sectionId: string, flowId: string, blockId: string, content: string) => {
    if (!document) return
    
    setDocument(prev => ({
      ...prev!,
      sections: prev!.sections.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              flows: section.flows.map(flow =>
                flow.id === flowId
                  ? {
                      ...flow,
                      blocks: flow.blocks.map(block =>
                        block.id === blockId
                          ? { ...block, content, updatedAt: new Date().toISOString() }
                          : block
                      ),
                      updatedAt: new Date().toISOString()
                    }
                  : flow
              ),
              updatedAt: new Date().toISOString()
            }
          : section
      ),
      updatedAt: new Date().toISOString()
    }))
  }, [document])

  const getDocumentStats = useCallback(() => {
    if (!document) return { sections: 0, flows: 0, blocks: 0 }
    
    const sectionsCount = document.sections.length
    const flowsCount = document.sections.reduce((acc, section) => acc + section.flows.length, 0)
    const blocksCount = document.sections.reduce((acc, section) => 
      acc + section.flows.reduce((flowAcc, flow) => flowAcc + flow.blocks.length, 0), 0
    )
    
    return { sections: sectionsCount, flows: flowsCount, blocks: blocksCount }
  }, [document])

  return {
    document,
    createNewDocument,
    addSection,
    addFlow,
    addBlock,
    updateBlock,
    getDocumentStats
  }
}