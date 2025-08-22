/**
 * Ingest Pipeline
 * Processes files and converts them to Intermediate Representation (IR)
 */

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
  validateIRDocument
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
   * Placeholder for DOCX processing
   */
  private async processDocxFile(file: File): Promise<IRDocument> {
    const title = file.name.replace(/\.docx$/, '')
    const irDoc = createIRDocument(title)
    const section = createIRSection('Imported Content', 1)
    
    // Placeholder - in real implementation, use mammoth.js or similar
    section.blocks.push(createIRBlock('paragraph', 
      `DOCX content from ${file.name}. Full DOCX parsing requires additional libraries.`, 1))
    
    irDoc.sections.push(section)
    return irDoc
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
