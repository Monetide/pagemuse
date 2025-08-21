import { useState, useCallback } from 'react'
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

export const useDocumentModel = () => {
  const [document, setDocument] = useState<SemanticDocument | null>(null)

  const createNewDocument = useCallback((title: string) => {
    const newDoc = createDocument(title)
    setDocument(newDoc)
    return newDoc
  }, [])

  const addSection = useCallback((name: string, order?: number) => {
    if (!document) return null
    
    const section = createSection(name, order ?? document.sections.length)
    const updatedDoc = addSectionToDocument(document, section)
    setDocument(updatedDoc)
    return section
  }, [document])

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
    return flow
  }, [document])

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
    return block
  }, [document])

  return {
    document,
    createNewDocument,
    addSection,
    addFlow,
    addBlock,
    setDocument
  }
}