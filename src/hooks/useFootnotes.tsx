import { useState, useCallback } from 'react'
import { FootnoteContent, FootnoteMarker, Section, Block } from '@/lib/document-model'

export const useFootnotes = (section: Section | null) => {
  const [footnotes, setFootnotes] = useState<FootnoteContent[]>(section?.footnotes || [])
  
  const addFootnote = useCallback((content: string, sourceBlockId: string): FootnoteMarker => {
    const footnoteId = crypto.randomUUID()
    const number = footnotes.length + 1
    
    const newFootnote: FootnoteContent = {
      id: footnoteId,
      number,
      content,
      sourceBlockId
    }
    
    const marker: FootnoteMarker = {
      id: crypto.randomUUID(),
      number,
      footnoteId
    }
    
    setFootnotes(prev => [...prev, newFootnote])
    
    return marker
  }, [footnotes.length])
  
  const updateFootnote = useCallback((footnoteId: string, content: string) => {
    setFootnotes(prev => 
      prev.map(fn => 
        fn.id === footnoteId ? { ...fn, content } : fn
      )
    )
  }, [])
  
  const deleteFootnote = useCallback((footnoteId: string) => {
    setFootnotes(prev => {
      const filtered = prev.filter(fn => fn.id !== footnoteId)
      // Renumber remaining footnotes
      return filtered.map((fn, index) => ({ ...fn, number: index + 1 }))
    })
  }, [])
  
  const getFootnote = useCallback((footnoteId: string): FootnoteContent | undefined => {
    return footnotes.find(fn => fn.id === footnoteId)
  }, [footnotes])
  
  const getFootnotesForPage = useCallback((pageBlocks: Block[]): FootnoteContent[] => {
    const blockIds = pageBlocks.map(block => block.id)
    return footnotes.filter(fn => blockIds.includes(fn.sourceBlockId))
  }, [footnotes])
  
  return {
    footnotes,
    addFootnote,
    updateFootnote,
    deleteFootnote,
    getFootnote,
    getFootnotesForPage
  }
}