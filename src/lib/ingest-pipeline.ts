/**
 * Ingest Pipeline
 * Processes files and converts them to Intermediate Representation (IR)
 */

import mammoth from 'mammoth'
import { 
  IRDocument, 
  IRSection, 
  IRBlock, 
  createIRDocument, 
  createIRSection, 
  createIRBlock, 
  createIRHeading, 
  createIRList, 
  createIRTable,
  createIRQuote,
  createIRFigure,
  createIRCallout,
  validateIRDocument,
  IRAssetRef
} from './ir-types'

export interface IngestOptions {
  preserveFormatting?: boolean
  extractAssets?: boolean
  generateAnchors?: boolean
  mergeShortParagraphs?: boolean
}

export class IngestPipeline {
  private options: IngestOptions

  constructor(options: IngestOptions = {}) {
    this.options = {
      preserveFormatting: true,
      extractAssets: false,
      generateAnchors: true,
      mergeShortParagraphs: false,
      ...options
    }
  }

  /**
   * Main entry point - processes a file and returns IR
   */
  async processFile(file: File): Promise<IRDocument> {
    const extension = file.name.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'txt':
      case 'md':
        return await this.processTextFile(file)
      case 'html':
        return await this.processHtmlFile(file)
      case 'json':
        return await this.processJsonFile(file)
      case 'docx':
        return await this.processDocxFile(file)
      case 'pdf':
        return await this.processPdfFile(file)
      default:
        throw new Error(`Unsupported file format: ${extension}`)
    }
  }

  /**
   * Processes plain text and markdown files
   */
  private async processTextFile(file: File): Promise<IRDocument> {
    const text = await file.text()
    const title = file.name.replace(/\.(txt|md)$/, '')
    
    const irDoc = createIRDocument(title)
    const section = createIRSection('Content', 1)
    
    const lines = text.split('\n')
    let blockOrder = 1
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (!line) continue
      
      if (line.startsWith('#')) {
        // Markdown heading
        const level = (line.match(/^#+/) || [''])[0].length
        const text = line.replace(/^#+\s*/, '')
        const heading = createIRHeading(level, text)
        
        section.blocks.push(createIRBlock('heading', heading, blockOrder++))
        
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Unordered list
        const listItems: string[] = []
        let j = i
        
        while (j < lines.length) {
          const listLine = lines[j].trim()
          if (listLine.startsWith('- ') || listLine.startsWith('* ')) {
            listItems.push(listLine.replace(/^[-*]\s*/, ''))
            j++
          } else if (!listLine) {
            j++
          } else {
            break
          }
        }
        
        const list = createIRList('unordered', listItems)
        section.blocks.push(createIRBlock('list', list, blockOrder++))
        i = j - 1
        
      } else if (/^\d+\.\s/.test(line)) {
        // Ordered list
        const listItems: string[] = []
        let j = i
        
        while (j < lines.length) {
          const listLine = lines[j].trim()
          if (/^\d+\.\s/.test(listLine)) {
            listItems.push(listLine.replace(/^\d+\.\s*/, ''))
            j++
          } else if (!listLine) {
            j++
          } else {
            break
          }
        }
        
        const list = createIRList('ordered', listItems)
        section.blocks.push(createIRBlock('list', list, blockOrder++))
        i = j - 1
        
      } else if (line.startsWith('>')) {
        // Quote
        const quoteText = line.replace(/^>\s*/, '')
        const quote = createIRQuote(quoteText)
        
        section.blocks.push(createIRBlock('quote', quote, blockOrder++))
        
      } else if (line === '---' || line === '***') {
        // Horizontal rule
        section.blocks.push(createIRBlock('horizontal-rule', null, blockOrder++))
        
      } else if (line.startsWith('```')) {
        // Code block
        const language = line.substring(3).trim()
        const codeLines: string[] = []
        let j = i + 1
        
        while (j < lines.length && !lines[j].trim().startsWith('```')) {
          codeLines.push(lines[j])
          j++
        }
        
        section.blocks.push(createIRBlock('code', {
          language: language || undefined,
          content: codeLines.join('\n'),
          inline: false
        }, blockOrder++))
        
        i = j
        
      } else {
        // Regular paragraph
        section.blocks.push(createIRBlock('paragraph', line, blockOrder++))
      }
    }
    
    irDoc.sections.push(section)
    return irDoc
  }

  /**
   * Processes HTML files
   */
  private async processHtmlFile(file: File): Promise<IRDocument> {
    const html = await file.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    const title = doc.title || file.name.replace(/\.html$/, '')
    const irDoc = createIRDocument(title)
    const section = createIRSection('Content', 1)
    
    let blockOrder = 1
    
    const processNode = (node: Node) => {
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
            const level = parseInt(tagName[1])
            const heading = createIRHeading(level, textContent)
            section.blocks.push(createIRBlock('heading', heading, blockOrder++))
            break
            
          case 'p':
            section.blocks.push(createIRBlock('paragraph', textContent, blockOrder++))
            break
            
          case 'blockquote':
            const quote = createIRQuote(textContent)
            section.blocks.push(createIRBlock('quote', quote, blockOrder++))
            break
            
          case 'ul':
            const ulItems = Array.from(element.querySelectorAll('li'))
              .map(li => li.textContent?.trim() || '')
              .filter(text => text)
            const ulList = createIRList('unordered', ulItems)
            section.blocks.push(createIRBlock('list', ulList, blockOrder++))
            break
            
          case 'ol':
            const olItems = Array.from(element.querySelectorAll('li'))
              .map(li => li.textContent?.trim() || '')
              .filter(text => text)
            const olList = createIRList('ordered', olItems)
            section.blocks.push(createIRBlock('list', olList, blockOrder++))
            break
            
          case 'table':
            const table = this.parseHtmlTable(element)
            if (table) {
              section.blocks.push(createIRBlock('table', table, blockOrder++))
            }
            break
            
          case 'hr':
            section.blocks.push(createIRBlock('horizontal-rule', null, blockOrder++))
            break
            
          case 'pre':
          case 'code':
            const isInline = tagName === 'code' && element.parentElement?.tagName.toLowerCase() !== 'pre'
            section.blocks.push(createIRBlock('code', {
              content: textContent,
              inline: isInline,
              language: element.getAttribute('class')?.replace('language-', '') || undefined
            }, blockOrder++))
            break
            
          default:
            // Recurse through children for other elements
            Array.from(element.childNodes).forEach(processNode)
        }
      }
    }
    
    if (doc.body) {
      Array.from(doc.body.childNodes).forEach(processNode)
    }
    
    irDoc.sections.push(section)
    return irDoc
  }

  /**
   * Processes JSON files (expecting IR format)
   */
  private async processJsonFile(file: File): Promise<IRDocument> {
    try {
      const json = await file.text()
      const data = JSON.parse(json)
      
      // Validate if it's already in IR format
      if (validateIRDocument(data)) {
        return data as IRDocument
      }
      
      // Otherwise, try to convert generic JSON structure
      return this.convertJsonToIR(data, file.name)
      
    } catch (error) {
      throw new Error(`Invalid JSON file: ${error instanceof Error ? error.message : 'Parse error'}`)
    }
  }

  /**
   * Processes DOCX files using mammoth.js
   */
  private async processDocxFile(file: File): Promise<IRDocument> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      
      // Configure mammoth with style mappings
      const options = {
        styleMap: [
          // Headings
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh", 
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Heading 4'] => h4:fresh",
          "p[style-name='Heading 5'] => h5:fresh",
          "p[style-name='Heading 6'] => h6:fresh",
          // Lists
          "p[style-name='List Paragraph'] => ul > li:fresh",
          "p[style-name='List Number'] => ol > li:fresh",
          // Other styles
          "p[style-name='Quote'] => blockquote:fresh",
          "p[style-name='Caption'] => p.caption:fresh"
        ],
        includeDefaultStyleMap: true,
        ignoreEmptyParagraphs: false
      }

      const result = await mammoth.convertToHtml({ arrayBuffer }, options)
      
      if (result.messages.length > 0) {
        console.warn('DOCX conversion warnings:', result.messages)
      }

      // Parse the HTML result and convert to IR
      const title = file.name.replace(/\.docx$/, '')
      const irDoc = await this.parseDocxHtml(result.value, title)
      
      // Note: Mammoth.js doesn't directly expose footnotes in the result
      // Advanced footnote extraction would require custom processing
      
      return irDoc

    } catch (error) {
      console.error('Error processing DOCX:', error)
      throw new Error(`Failed to process DOCX file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Parses DOCX-generated HTML and converts to IR
   */
  private async parseDocxHtml(html: string, title: string): Promise<IRDocument> {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    const irDoc = createIRDocument(title)
    const section = createIRSection('Document Content', 1)
    
    let blockOrder = 1
    let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null
    let footnoteCounter = 1
    
    const processElement = (element: Element) => {
      const tagName = element.tagName.toLowerCase()
      const textContent = element.textContent?.trim() || ''
      
      if (!textContent && tagName !== 'img' && tagName !== 'table') return

      switch (tagName) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          // Flush any pending list
          if (currentList) {
            this.flushCurrentList(section, currentList, blockOrder++)
            currentList = null
          }
          
          const level = parseInt(tagName[1])
          const heading = createIRHeading(level, textContent)
          section.blocks.push(createIRBlock('heading', heading, blockOrder++))
          break

        case 'p':
          const className = element.getAttribute('class') || ''
          
          if (className.includes('caption')) {
            // Handle figure caption - look for preceding image
            const prevImg = this.findPrecedingImage(element)
            if (prevImg) {
              const figure = createIRFigure(
                {
                  id: `asset-${Date.now()}`,
                  filename: prevImg.src.split('/').pop() || 'image',
                  mimeType: 'image/jpeg', // Default, would need proper detection
                  url: prevImg.src,
                  alt: prevImg.alt || ''
                },
                textContent,
                prevImg.alt
              )
              section.blocks.push(createIRBlock('figure', figure, blockOrder++))
              break
            }
          }

          // Flush any pending list
          if (currentList) {
            this.flushCurrentList(section, currentList, blockOrder++)
            currentList = null
          }

          // Extract formatting marks
          const marks = this.extractFormattingMarks(element)
          const block = createIRBlock('paragraph', textContent, blockOrder++, { marks })
          section.blocks.push(block)
          break

        case 'ul':
          if (currentList && currentList.type !== 'ul') {
            this.flushCurrentList(section, currentList, blockOrder++)
          }
          if (!currentList) {
            currentList = { type: 'ul', items: [] }
          }
          
          const ulItems = Array.from(element.querySelectorAll('li'))
            .map(li => li.textContent?.trim() || '')
            .filter(text => text)
          currentList.items.push(...ulItems)
          break

        case 'ol':
          if (currentList && currentList.type !== 'ol') {
            this.flushCurrentList(section, currentList, blockOrder++)
          }
          if (!currentList) {
            currentList = { type: 'ol', items: [] }
          }
          
          const olItems = Array.from(element.querySelectorAll('li'))
            .map(li => li.textContent?.trim() || '')
            .filter(text => text)
          currentList.items.push(...olItems)
          break

        case 'blockquote':
          // Flush any pending list
          if (currentList) {
            this.flushCurrentList(section, currentList, blockOrder++)
            currentList = null
          }
          
          const quote = createIRQuote(textContent)
          section.blocks.push(createIRBlock('quote', quote, blockOrder++))
          break

        case 'table':
          // Flush any pending list
          if (currentList) {
            this.flushCurrentList(section, currentList, blockOrder++)
            currentList = null
          }
          
          const table = this.parseDocxTable(element)
          if (table) {
            section.blocks.push(createIRBlock('table', table, blockOrder++))
          }
          break

        case 'img':
          // Handle standalone images
          const figure = createIRFigure(
            {
              id: `asset-${Date.now()}`,
              filename: element.getAttribute('src')?.split('/').pop() || 'image',
              mimeType: 'image/jpeg', // Default
              url: element.getAttribute('src') || '',
              alt: element.getAttribute('alt') || ''
            },
            '', // No caption yet
            element.getAttribute('alt') || ''
          )
          section.blocks.push(createIRBlock('figure', figure, blockOrder++))
          break

        case 'hr':
          // Flush any pending list
          if (currentList) {
            this.flushCurrentList(section, currentList, blockOrder++)
            currentList = null
          }
          
          section.blocks.push(createIRBlock('horizontal-rule', null, blockOrder++))
          break

        default:
          // For other elements, process children
          Array.from(element.children).forEach(child => {
            if (child instanceof Element) {
              processElement(child)
            }
          })
      }
    }

    // Process all body elements
    if (doc.body) {
      Array.from(doc.body.children).forEach(child => {
        if (child instanceof Element) {
          processElement(child)
        }
      })
    }

    // Flush any remaining list
    if (currentList) {
      this.flushCurrentList(section, currentList, blockOrder++)
    }

    irDoc.sections.push(section)
    return irDoc
  }

  /**
   * Extracts formatting marks from an element
   */
  private extractFormattingMarks(element: Element) {
    const marks = []
    const htmlElement = element as HTMLElement
    
    // Check for bold
    if (element.querySelector('strong, b') || 
        htmlElement.style?.fontWeight === 'bold' ||
        htmlElement.style?.fontWeight === '700') {
      marks.push({ type: 'bold' })
    }

    // Check for italic
    if (element.querySelector('em, i') || 
        htmlElement.style?.fontStyle === 'italic') {
      marks.push({ type: 'italic' })
    }

    // Check for underline
    if (element.querySelector('u') || 
        htmlElement.style?.textDecoration?.includes('underline')) {
      marks.push({ type: 'underline' })
    }

    // Check for strikethrough
    if (element.querySelector('s, strike, del') || 
        htmlElement.style?.textDecoration?.includes('line-through')) {
      marks.push({ type: 'strikethrough' })
    }

    // Check for links
    const link = element.querySelector('a')
    if (link) {
      marks.push({ 
        type: 'link', 
        attrs: { href: link.getAttribute('href') } 
      })
    }

    return marks
  }

  /**
   * Flushes current list to IR blocks
   */
  private flushCurrentList(section: IRSection, currentList: { type: 'ul' | 'ol'; items: string[] }, order: number) {
    if (currentList.items.length === 0) return

    const listType = currentList.type === 'ul' ? 'unordered' : 'ordered'
    const list = createIRList(listType, currentList.items)
    section.blocks.push(createIRBlock('list', list, order))
  }

  /**
   * Finds preceding image element for caption association
   */
  private findPrecedingImage(element: Element): HTMLImageElement | null {
    let prev = element.previousElementSibling
    
    while (prev) {
      if (prev.tagName.toLowerCase() === 'img') {
        return prev as HTMLImageElement
      }
      
      const img = prev.querySelector('img')
      if (img) {
        return img
      }
      
      prev = prev.previousElementSibling
    }
    
    return null
  }

  /**
   * Parses DOCX table structure
   */
  private parseDocxTable(tableElement: Element) {
    const headers: string[] = []
    const rows: string[][] = []
    let hasHeaderRow = false

    // Get all rows
    const tableRows = Array.from(tableElement.querySelectorAll('tr'))
    
    if (tableRows.length === 0) return null

    // Process first row - check if it's a header
    const firstRow = tableRows[0]
    const firstRowCells = Array.from(firstRow.querySelectorAll('th, td'))
    
    // If first row has th elements or looks like a header, treat as header
    if (firstRow.querySelectorAll('th').length > 0 || 
        this.looksLikeHeaderRow(firstRowCells)) {
      hasHeaderRow = true
      firstRowCells.forEach(cell => {
        headers.push(cell.textContent?.trim() || '')
      })
      
      // Process remaining rows as data
      tableRows.slice(1).forEach(row => {
        const cells = Array.from(row.querySelectorAll('td, th'))
        const rowData: string[] = []
        cells.forEach(cell => {
          rowData.push(cell.textContent?.trim() || '')
        })
        if (rowData.length > 0) {
          rows.push(rowData)
        }
      })
    } else {
      // No header row, all rows are data
      tableRows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td, th'))
        const rowData: string[] = []
        cells.forEach(cell => {
          rowData.push(cell.textContent?.trim() || '')
        })
        if (rowData.length > 0) {
          rows.push(rowData)
        }
      })
    }

    return createIRTable(headers, rows, undefined)
  }

  /**
   * Heuristic to determine if a row looks like a header
   */
  private looksLikeHeaderRow(cells: Element[]): boolean {
    if (cells.length === 0) return false

    // Check for bold styling
    const boldCells = cells.filter(cell => {
      const hasStrongOrB = cell.querySelector('strong, b')
      const htmlCell = cell as HTMLElement
      const hasBoldStyle = htmlCell.style?.fontWeight === 'bold' || htmlCell.style?.fontWeight === '700'
      return hasStrongOrB || hasBoldStyle
    })

    // If more than half the cells are bold, likely a header
    return boldCells.length > cells.length / 2
  }

  /**
   * Processes DOCX footnotes
   */
  private async processDocxFootnotes(irDoc: IRDocument, footnotes: any[]) {
    if (!footnotes || footnotes.length === 0) return

    footnotes.forEach((footnote, index) => {
      const footnoteObj = {
        id: `footnote-${index + 1}`,
        number: index + 1,
        content: footnote.body || footnote.content || '',
        backlinks: [] // Would need more complex processing to link back to references
      }

      // Add to first section's notes (could be more sophisticated)
      if (irDoc.sections.length > 0) {
        if (!irDoc.sections[0].notes) {
          irDoc.sections[0].notes = []
        }
        irDoc.sections[0].notes.push(footnoteObj)
      }
    })
  }

  /**
   * Placeholder for PDF processing
   */
  private async processPdfFile(file: File): Promise<IRDocument> {
    const title = file.name.replace(/\.pdf$/, '')
    const irDoc = createIRDocument(title)
    const section = createIRSection('Imported Content', 1)
    
    // Placeholder - in real implementation, use pdf.js or similar
    section.blocks.push(createIRBlock('paragraph', 
      `PDF content from ${file.name}. Full PDF parsing requires additional libraries.`, 1))
    
    irDoc.sections.push(section)
    return irDoc
  }

  /**
   * Converts generic JSON to IR format
   */
  private convertJsonToIR(data: any, filename: string): IRDocument {
    const title = filename.replace(/\.json$/, '')
    const irDoc = createIRDocument(title)
    const section = createIRSection('JSON Data', 1)
    
    // Convert JSON to readable format
    const jsonString = JSON.stringify(data, null, 2)
    section.blocks.push(createIRBlock('code', {
      language: 'json',
      content: jsonString,
      inline: false
    }, 1))
    
    irDoc.sections.push(section)
    return irDoc
  }

  /**
   * Parses HTML table to IR table format
   */
  private parseHtmlTable(tableElement: Element) {
    const headers: string[] = []
    const rows: string[][] = []
    
    // Get headers
    const headerRow = tableElement.querySelector('thead tr, tr:first-child')
    if (headerRow) {
      const headerCells = headerRow.querySelectorAll('th, td')
      headerCells.forEach(cell => {
        headers.push(cell.textContent?.trim() || '')
      })
    }
    
    // Get data rows
    const dataRows = tableElement.querySelectorAll('tbody tr, tr:not(:first-child)')
    dataRows.forEach(row => {
      const cells = row.querySelectorAll('td, th')
      const rowData: string[] = []
      cells.forEach(cell => {
        rowData.push(cell.textContent?.trim() || '')
      })
      if (rowData.length > 0) {
        rows.push(rowData)
      }
    })
    
    if (headers.length > 0 || rows.length > 0) {
      return createIRTable(headers, rows)
    }
    
    return null
  }

  /**
   * Post-processes IR document to clean up and optimize
   */
  postProcess(irDoc: IRDocument): IRDocument {
    return {
      ...irDoc,
      sections: irDoc.sections.map(section => this.postProcessSection(section))
    }
  }

  /**
   * Post-processes a section
   */
  private postProcessSection(section: IRSection): IRSection {
    let blocks = [...section.blocks]
    
    // Merge short paragraphs if enabled
    if (this.options.mergeShortParagraphs) {
      blocks = this.mergeShortParagraphs(blocks)
    }
    
    // Re-order blocks
    blocks = blocks.map((block, index) => ({
      ...block,
      order: index + 1
    }))
    
    return {
      ...section,
      blocks
    }
  }

  /**
   * Merges consecutive short paragraphs
   */
  private mergeShortParagraphs(blocks: IRBlock[]): IRBlock[] {
    const result: IRBlock[] = []
    let i = 0
    
    while (i < blocks.length) {
      const block = blocks[i]
      
      if (block.type === 'paragraph' && 
          typeof block.content === 'string' && 
          block.content.length < 50) {
        
        // Look for consecutive short paragraphs
        const mergeCandidates = [block.content]
        let j = i + 1
        
        while (j < blocks.length && 
               blocks[j].type === 'paragraph' && 
               typeof blocks[j].content === 'string' && 
               blocks[j].content.length < 50) {
          mergeCandidates.push(blocks[j].content)
          j++
        }
        
        if (mergeCandidates.length > 1) {
          // Merge into single paragraph
          result.push(createIRBlock('paragraph', mergeCandidates.join(' '), block.order))
          i = j
        } else {
          result.push(block)
          i++
        }
      } else {
        result.push(block)
        i++
      }
    }
    
    return result
  }
}

// Factory function
export const createIngestPipeline = (options?: IngestOptions) => 
  new IngestPipeline(options)

// Convenience function
export const ingestFile = async (file: File, options?: IngestOptions): Promise<IRDocument> => {
  const pipeline = createIngestPipeline(options)
  const irDoc = await pipeline.processFile(file)
  return pipeline.postProcess(irDoc)
}
