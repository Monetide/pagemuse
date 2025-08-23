import { useState, useEffect } from 'react'
import { SemanticDocument, Section } from '@/lib/document-model'
import { LayoutResult, generateLayout } from '@/lib/layout-engine'

export const useTOCLayoutResults = (document: SemanticDocument | null) => {
  const [layoutResults, setLayoutResults] = useState<Map<string, LayoutResult>>(new Map())
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (!document) {
      setLayoutResults(new Map())
      return
    }

    const generateAllLayouts = async () => {
      setIsGenerating(true)
      const results = new Map<string, LayoutResult>()

      try {
        // Generate layout for each section with proper page numbering
        let currentPageNumber = 1
        for (const section of document.sections) {
          const layoutResult = generateLayout(section, currentPageNumber)
          results.set(section.id, layoutResult)
          currentPageNumber += layoutResult.totalPages
        }

        setLayoutResults(results)
      } catch (error) {
        console.error('Error generating TOC layouts:', error)
      } finally {
        setIsGenerating(false)
      }
    }

    // Debounce layout generation
    const timeoutId = setTimeout(generateAllLayouts, 500)

    return () => clearTimeout(timeoutId)
  }, [document])

  const refreshLayouts = () => {
    if (!document) return

    setIsGenerating(true)
    const results = new Map<string, LayoutResult>()

    try {
      let currentPageNumber = 1
      for (const section of document.sections) {
        const layoutResult = generateLayout(section, currentPageNumber)
        results.set(section.id, layoutResult)
        currentPageNumber += layoutResult.totalPages
      }

      setLayoutResults(results)
    } catch (error) {
      console.error('Error refreshing TOC layouts:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    layoutResults,
    isGenerating,
    refreshLayouts
  }
}