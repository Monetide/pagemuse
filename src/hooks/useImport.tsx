import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { SemanticDocument, Section, Flow, Block } from '@/lib/document-model'
import { ImportMode } from '@/components/import/ImportDialog'

interface ImportResult {
  title: string
  sections: Section[]
}

export const useImport = () => {
  const [isImporting, setIsImporting] = useState(false)
  const { toast } = useToast()

  const parseFile = useCallback(async (file: File): Promise<ImportResult> => {
    const extension = file.name.split('.').pop()?.toLowerCase()
    
    try {
      switch (extension) {
        case 'txt':
        case 'md':
          return await parseTextFile(file)
        case 'html':
          return await parseHtmlFile(file)
        case 'docx':
          return await parseDocxFile(file)
        case 'pdf':
          return await parsePdfFile(file)
        default:
          throw new Error(`Unsupported file type: ${extension}`)
      }
    } catch (error) {
      console.error(`Error parsing ${file.name}:`, error)
      throw new Error(`Failed to parse ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [])

  const parseTextFile = async (file: File): Promise<ImportResult> => {
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    const title = file.name.replace(/\.(txt|md)$/, '')
    const blocks: Block[] = []
    let blockId = 1

    // Parse markdown-style headings and content
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line.startsWith('#')) {
        // Heading
        const level = (line.match(/^#+/) || [''])[0].length
        const text = line.replace(/^#+\s*/, '')
        blocks.push({
          id: `imported-block-${blockId}`,
          type: 'heading',
          content: text,
          metadata: { level: Math.min(level, 6) },
          order: blockId
        })
        blockId++
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Bullet list (collect consecutive items)
        const listItems: string[] = []
        let j = i
        while (j < lines.length && (lines[j].startsWith('- ') || lines[j].startsWith('* '))) {
          listItems.push(lines[j].replace(/^[-*]\s*/, ''))
          j++
        }
        blocks.push({
          id: `imported-block-${blockId}`,
          type: 'unordered-list',
          content: listItems,
          order: blockId
        })
        blockId++
        i = j - 1 // Skip processed lines
      } else if (/^\d+\.\s/.test(line)) {
        // Numbered list (collect consecutive items)
        const listItems: string[] = []
        let j = i
        while (j < lines.length && /^\d+\.\s/.test(lines[j])) {
          listItems.push(lines[j].replace(/^\d+\.\s*/, ''))
          j++
        }
        blocks.push({
          id: `imported-block-${blockId}`,
          type: 'ordered-list',
          content: listItems,
          order: blockId
        })
        blockId++
        i = j - 1 // Skip processed lines
      } else if (line.startsWith('>')) {
        // Quote
        const quoteText = line.replace(/^>\s*/, '')
        blocks.push({
          id: `imported-block-${blockId}`,
          type: 'quote',
          content: quoteText,
          order: blockId
        })
        blockId++
      } else if (line.length > 0) {
        // Regular paragraph
        blocks.push({
          id: `imported-block-${blockId}`,
          type: 'paragraph',
          content: line,
          order: blockId
        })
        blockId++
      }
    }

    return {
      title,
      sections: [{
        id: 'imported-section-1',
        name: 'Imported Content',
        order: 1,
        pageMaster: null,
        footnotes: [],
        flows: [{
          id: 'imported-flow-1',
          name: 'Main Flow',
          type: 'linear',
          order: 1,
          blocks
        }]
      }]
    }
  }

  const parseHtmlFile = async (file: File): Promise<ImportResult> => {
    const html = await file.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    const title = doc.title || file.name.replace(/\.html$/, '')
    const blocks: Block[] = []
    let blockId = 1

    // Extract content from body
    const walkNodes = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element
        const tagName = element.tagName.toLowerCase()
        const textContent = element.textContent?.trim()

        if (!textContent) return

        switch (tagName) {
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            blocks.push({
              id: `imported-block-${blockId}`,
              type: 'heading',
              content: textContent,
              metadata: { level: parseInt(tagName[1]) },
              order: blockId
            })
            blockId++
            break
          case 'p':
            blocks.push({
              id: `imported-block-${blockId}`,
              type: 'paragraph',
              content: textContent,
              order: blockId
            })
            blockId++
            break
          case 'blockquote':
            blocks.push({
              id: `imported-block-${blockId}`,
              type: 'quote',
              content: textContent,
              order: blockId
            })
            blockId++
            break
          case 'ul':
            const ulItems = Array.from(element.querySelectorAll('li')).map(li => li.textContent?.trim() || '')
            blocks.push({
              id: `imported-block-${blockId}`,
              type: 'unordered-list',
              content: ulItems,
              order: blockId
            })
            blockId++
            break
          case 'ol':
            const olItems = Array.from(element.querySelectorAll('li')).map(li => li.textContent?.trim() || '')
            blocks.push({
              id: `imported-block-${blockId}`,
              type: 'ordered-list',
              content: olItems,
              order: blockId
            })
            blockId++
            break
          default:
            // For other elements, recurse through children
            for (const child of Array.from(element.childNodes)) {
              walkNodes(child)
            }
        }
      }
    }

    if (doc.body) {
      for (const child of Array.from(doc.body.childNodes)) {
        walkNodes(child)
      }
    }

    return {
      title,
      sections: [{
        id: 'imported-section-1',
        name: 'Imported Content',
        order: 1,
        pageMaster: null,
        footnotes: [],
        flows: [{
          id: 'imported-flow-1',
          name: 'Main Flow',
          type: 'linear',
          order: 1,
          blocks
        }]
      }]
    }
  }

  const parseDocxFile = async (file: File): Promise<ImportResult> => {
    // For now, return a placeholder implementation
    // In a real app, you'd use a library like mammoth.js
    const title = file.name.replace(/\.docx$/, '')
    
    toast({
      title: "DOCX Import",
      description: "DOCX import is not yet fully implemented. Creating placeholder content.",
      variant: "default"
    })

    return {
      title,
      sections: [{
        id: 'imported-section-1',
        name: 'Imported Content',
        order: 1,
        pageMaster: null,
        footnotes: [],
        flows: [{
          id: 'imported-flow-1',
          name: 'Main Flow',
          type: 'linear',
          order: 1,
          blocks: [{
            id: 'imported-block-1',
            type: 'paragraph',
            content: `Content imported from ${file.name}. Full DOCX parsing will be implemented with proper libraries.`,
            order: 1
          }]
        }]
      }]
    }
  }

  const parsePdfFile = async (file: File): Promise<ImportResult> => {
    // For now, return a placeholder implementation
    // In a real app, you'd use a library like pdf.js
    const title = file.name.replace(/\.pdf$/, '')
    
    toast({
      title: "PDF Import",
      description: "PDF import is not yet fully implemented. Creating placeholder content.",
      variant: "default"
    })

    return {
      title,
      sections: [{
        id: 'imported-section-1',
        name: 'Imported Content',
        order: 1,
        pageMaster: null,
        footnotes: [],
        flows: [{
          id: 'imported-flow-1',
          name: 'Main Flow',
          type: 'linear',
          order: 1,
          blocks: [{
            id: 'imported-block-1',
            type: 'paragraph',
            content: `Content imported from ${file.name}. Full PDF parsing will be implemented with proper libraries.`,
            order: 1
          }]
        }]
      }]
    }
  }

  const importFiles = useCallback(async (
    files: File[], 
    mode: ImportMode,
    currentDocument?: SemanticDocument,
    onCreateDocument?: (title: string, sections: Section[]) => void,
    onUpdateDocument?: (updatedDocument: SemanticDocument) => void
  ) => {
    setIsImporting(true)

    try {
      let allResults: ImportResult[] = []
      
      // Parse all files
      for (const file of files) {
        const result = await parseFile(file)
        allResults.push(result)
      }

      // Combine results based on mode
      switch (mode) {
        case 'new-document':
          if (allResults.length === 1) {
            onCreateDocument?.(allResults[0].title, allResults[0].sections)
          } else {
            // Multiple files - create a combined document
            const combinedTitle = `Imported Documents (${allResults.length} files)`
            const combinedSections = allResults.flatMap((result, index) => 
              result.sections.map(section => ({
                ...section,
                id: `imported-section-${index + 1}-${section.id}`,
                name: `${result.title} - ${section.name}`,
                order: index + 1
              }))
            )
            onCreateDocument?.(combinedTitle, combinedSections)
          }
          break

        case 'append-section':
        case 'insert-section':
          if (!currentDocument || !onUpdateDocument) {
            throw new Error('Current document is required for this import mode')
          }

          const updatedDocument = { ...currentDocument }
          const newSections = allResults.flatMap(result => result.sections)
          
          if (mode === 'append-section') {
            // Add to existing sections
            updatedDocument.sections = [...updatedDocument.sections, ...newSections]
          } else {
            // Insert as new sections
            updatedDocument.sections = [...updatedDocument.sections, ...newSections]
          }
          
          onUpdateDocument(updatedDocument)
          break

        case 'replace-document':
          if (!currentDocument || !onUpdateDocument) {
            throw new Error('Current document is required for this import mode')
          }

          const replacedDocument = {
            ...currentDocument,
            title: allResults.length === 1 ? allResults[0].title : `Imported Documents`,
            sections: allResults.flatMap(result => result.sections)
          }
          
          onUpdateDocument(replacedDocument)
          break
      }

      toast({
        title: "Import Successful",
        description: `Successfully imported ${files.length} file${files.length !== 1 ? 's' : ''}`
      })

    } catch (error) {
      console.error('Import failed:', error)
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      })
      throw error
    } finally {
      setIsImporting(false)
    }
  }, [parseFile, toast])

  return {
    importFiles,
    isImporting
  }
}