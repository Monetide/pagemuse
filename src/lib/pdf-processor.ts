/**
 * PDF Processing with Text Extraction and OCR Fallback
 * Handles text-based PDFs with layout analysis and image-only PDFs with OCR
 */

// Mock pdfjs-dist for now - PDF processing disabled
const pdfjsLib = {
  getDocument: (options: any) => ({
    promise: new Promise((resolve) => {
      resolve({
        numPages: 0,
        getPage: (pageNum: number) => Promise.reject(new Error('PDF processing not available in this environment'))
      } as any)
    })
  }),
  GlobalWorkerOptions: { workerSrc: '' }
}
// Mock tesseract.js for now - OCR functionality disabled
const createWorker = async (language?: string) => ({
  loadLanguage: async (lang: string) => {},
  initialize: async (lang: string) => {},
  recognize: async (imageData: string) => ({ 
    data: { 
      text: 'OCR not available in this environment',
      paragraphs: [
        {
          text: 'OCR not available in this environment',
          confidence: 0,
          bbox: { x0: 0, y0: 0, x1: 0, y1: 0 },
          words: []
        }
      ]
    } 
  }),
  terminate: async () => {}
})
import { 
  IRDocument, 
  IRSection, 
  IRBlock, 
  createIRDocument, 
  createIRSection, 
  createIRBlock, 
  createIRHeading, 
  createIRTable,
  createIRFigure,
  IRAssetRef
} from './ir-types'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

export interface PDFProcessingOptions {
  ocrLanguage?: string
  confidenceThreshold?: number
  enableOCR?: boolean
  detectColumns?: boolean
  mergeHyphenatedWords?: boolean
}

export interface TextItem {
  str: string
  dir: string
  width: number
  height: number
  transform: number[]
  fontName: string
  hasEOL?: boolean
}

export interface PDFTextContent {
  items: TextItem[]
  styles: Record<string, any>
}

export interface LayoutElement {
  text: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  fontWeight: string
  fontName: string
  confidence?: number
  type?: 'heading' | 'paragraph' | 'table' | 'figure' | 'caption'
}

export interface OCRResult {
  text: string
  confidence: number
  bbox: { x0: number; y0: number; x1: number; y1: number }
  words: Array<{
    text: string
    confidence: number
    bbox: { x0: number; y0: number; x1: number; y1: number }
  }>
}

export class PDFProcessor {
  private options: PDFProcessingOptions

  constructor(options: PDFProcessingOptions = {}) {
    this.options = {
      ocrLanguage: 'eng',
      confidenceThreshold: 75,
      enableOCR: true,
      detectColumns: true,
      mergeHyphenatedWords: true,
      ...options
    }
  }

  /**
   * Main entry point for PDF processing
   */
  async processFile(file: File): Promise<IRDocument> {
    const arrayBuffer = await file.arrayBuffer()
    
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise as any
    
    const title = file.name.replace(/\.pdf$/, '')
    const irDoc = createIRDocument(title)
    
    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const section = createIRSection(`Page ${pageNum}`, pageNum)
      
      try {
        // Try text extraction first
        const textContent = await page.getTextContent()
        const hasExtractableText = this.hasSignificantText(textContent)
        
        if (hasExtractableText) {
          await this.processTextBasedPage(page, textContent, section)
        } else if (this.options.enableOCR) {
          await this.processImageBasedPage(page, section)
        }
        
        if (section.blocks.length > 0) {
          irDoc.sections.push(section)
        }
        
      } catch (error) {
        console.error(`Error processing page ${pageNum}:`, error)
        // Add error block
        section.blocks.push(createIRBlock('paragraph', 
          `Error processing page ${pageNum}: ${error instanceof Error ? error.message : 'Unknown error'}`, 1))
        irDoc.sections.push(section)
      }
    }
    
    // Merge sections if only one page or if content flows naturally
    if (irDoc.sections.length > 1) {
      irDoc.sections = this.mergeSections(irDoc.sections)
    }
    
    return irDoc
  }

  /**
   * Checks if page has significant extractable text
   */
  private hasSignificantText(textContent: any): boolean {
    const textItems = textContent.items.filter((item: any) => item.str !== undefined)
    const totalText = textItems
      .map((item: any) => item.str.trim())
      .join(' ')
      .trim()
    
    // Consider significant if more than 50 characters of meaningful text
    return totalText.length > 50 && /[a-zA-Z]/.test(totalText)
  }

  /**
   * Processes text-based PDF page with layout analysis
   */
  private async processTextBasedPage(page: any, textContent: any, section: IRSection) {
    const viewport = page.getViewport({ scale: 1.0 })
    const elements = this.extractLayoutElements(textContent, viewport)
    
    // Detect columns
    if (this.options.detectColumns) {
      const columns = this.detectColumns(elements)
      elements.sort((a, b) => this.getReadingOrder(a, b, columns))
    } else {
      elements.sort((a, b) => this.getReadingOrder(a, b))
    }
    
    // Merge hyphenated words
    if (this.options.mergeHyphenatedWords) {
      this.mergeHyphenatedWords(elements)
    }
    
    // Analyze layout and create IR blocks
    let blockOrder = 1
    const blocks = this.analyzeLayout(elements)
    
    for (const block of blocks) {
      switch (block.type) {
        case 'heading':
          const heading = createIRHeading(this.inferHeadingLevel(block), block.text)
          section.blocks.push(createIRBlock('heading', heading, blockOrder++))
          break
          
        case 'table':
          const table = this.parseTextTable(block.text)
          if (table) {
            section.blocks.push(createIRBlock('table', table, blockOrder++))
          }
          break
          
        case 'figure':
          const figure = await this.extractFigure(page, block)
          if (figure) {
            section.blocks.push(createIRBlock('figure', figure, blockOrder++))
          }
          break
          
        case 'paragraph':
        default:
          if (block.text.trim()) {
            section.blocks.push(createIRBlock('paragraph', block.text.trim(), blockOrder++))
          }
          break
      }
    }
  }

  /**
   * Processes image-based PDF page with OCR
   */
  private async processImageBasedPage(page: any, section: IRSection) {
    const viewport = page.getViewport({ scale: 2.0 }) // Higher scale for better OCR
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    
    canvas.height = viewport.height
    canvas.width = viewport.width
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    }
    
    await page.render(renderContext).promise
    
    // Convert canvas to image data for OCR
    const imageData = canvas.toDataURL('image/png')
    const ocrResults = await this.performOCR(imageData)
    
    let blockOrder = 1
    
    for (const result of ocrResults) {
      if (result.confidence >= this.options.confidenceThreshold!) {
        section.blocks.push(createIRBlock('paragraph', result.text, blockOrder++))
      } else {
        // Flag low confidence text for review
        section.blocks.push(createIRBlock('paragraph', result.text, blockOrder++, {
          confidence: result.confidence,
          needsReview: true,
          source: 'ocr'
        }))
      }
    }
  }

  /**
   * Extracts layout elements from PDF text content
   */
  private extractLayoutElements(textContent: any, viewport: any): LayoutElement[] {
    const elements: LayoutElement[] = []
    
    // Filter to only include text items (not marked content)
    const textItems = textContent.items.filter((item: any) => item.str !== undefined)
    
    for (const item of textItems) {
      if (!item.str.trim()) continue
      
      const transform = item.transform
      const x = transform[4]
      const y = viewport.height - transform[5] // Flip Y coordinate
      const fontSize = Math.abs(transform[3])
      const fontName = item.fontName || ''
      
      // Infer font weight from font name
      const fontWeight = this.inferFontWeight(fontName)
      
      elements.push({
        text: item.str,
        x,
        y,
        width: item.width,
        height: item.height,
        fontSize,
        fontWeight,
        fontName
      })
    }
    
    return elements
  }

  /**
   * Detects column layout in page elements
   */
  private detectColumns(elements: LayoutElement[]): Array<{left: number, right: number}> {
    if (elements.length === 0) return []
    
    // Group elements by approximate X position
    const xPositions = elements.map(el => el.x).sort((a, b) => a - b)
    const xClusters: number[][] = []
    let currentCluster: number[] = [xPositions[0]]
    
    for (let i = 1; i < xPositions.length; i++) {
      if (xPositions[i] - currentCluster[currentCluster.length - 1] < 20) {
        currentCluster.push(xPositions[i])
      } else {
        xClusters.push(currentCluster)
        currentCluster = [xPositions[i]]
      }
    }
    xClusters.push(currentCluster)
    
    // Create column boundaries
    const columns: Array<{left: number, right: number}> = []
    
    for (const cluster of xClusters) {
      const left = Math.min(...cluster)
      const elementsInCluster = elements.filter(el => Math.abs(el.x - left) < 20)
      const right = Math.max(...elementsInCluster.map(el => el.x + el.width))
      
      if (elementsInCluster.length > 5) { // Only significant clusters
        columns.push({ left, right })
      }
    }
    
    return columns.sort((a, b) => a.left - b.left)
  }

  /**
   * Determines reading order for layout elements
   */
  private getReadingOrder(a: LayoutElement, b: LayoutElement, columns?: Array<{left: number, right: number}>): number {
    const yTolerance = 5
    
    // If we have columns, sort by column first, then by Y, then by X
    if (columns && columns.length > 1) {
      const aColumn = columns.findIndex(col => a.x >= col.left && a.x <= col.right)
      const bColumn = columns.findIndex(col => b.x >= col.left && b.x <= col.right)
      
      if (aColumn !== bColumn && aColumn !== -1 && bColumn !== -1) {
        return aColumn - bColumn
      }
    }
    
    // Sort by Y position (top to bottom)
    if (Math.abs(a.y - b.y) > yTolerance) {
      return a.y - b.y
    }
    
    // Same line, sort by X position (left to right)
    return a.x - b.x
  }

  /**
   * Merges hyphenated words across line breaks
   */
  private mergeHyphenatedWords(elements: LayoutElement[]) {
    for (let i = 0; i < elements.length - 1; i++) {
      const current = elements[i]
      const next = elements[i + 1]
      
      if (current.text.endsWith('-') && 
          /^[a-z]/.test(next.text) && 
          Math.abs(current.y - next.y) > current.fontSize * 0.8) {
        
        // Merge hyphenated word
        current.text = current.text.slice(0, -1) + next.text
        current.width += next.width
        elements.splice(i + 1, 1)
        i-- // Recheck current position
      }
    }
  }

  /**
   * Analyzes layout and groups elements into logical blocks
   */
  private analyzeLayout(elements: LayoutElement[]): Array<{type: string, text: string, elements: LayoutElement[]}> {
    const blocks: Array<{type: string, text: string, elements: LayoutElement[]}> = []
    let currentBlock: LayoutElement[] = []
    let currentType = 'paragraph'
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      const elementType = this.classifyElement(element, elements, i)
      
      if (elementType !== currentType || this.shouldStartNewBlock(element, currentBlock)) {
        // Finish current block
        if (currentBlock.length > 0) {
          blocks.push({
            type: currentType,
            text: currentBlock.map(el => el.text).join(' ').trim(),
            elements: [...currentBlock]
          })
        }
        
        // Start new block
        currentBlock = [element]
        currentType = elementType
      } else {
        currentBlock.push(element)
      }
    }
    
    // Add final block
    if (currentBlock.length > 0) {
      blocks.push({
        type: currentType,
        text: currentBlock.map(el => el.text).join(' ').trim(),
        elements: [...currentBlock]
      })
    }
    
    return blocks
  }

  /**
   * Classifies element type based on typography and context
   */
  private classifyElement(element: LayoutElement, allElements: LayoutElement[], index: number): string {
    // Check for heading patterns
    if (this.isHeading(element, allElements)) {
      return 'heading'
    }
    
    // Check for table patterns
    if (this.isTableElement(element, allElements, index)) {
      return 'table'
    }
    
    // Check for figure captions
    if (this.isFigureCaption(element)) {
      return 'figure'
    }
    
    return 'paragraph'
  }

  /**
   * Determines if element is a heading based on typography
   */
  private isHeading(element: LayoutElement, allElements: LayoutElement[]): boolean {
    const avgFontSize = allElements.reduce((sum, el) => sum + el.fontSize, 0) / allElements.length
    const maxFontSize = Math.max(...allElements.map(el => el.fontSize))
    
    // Heading heuristics
    const isLargerFont = element.fontSize > avgFontSize * 1.2
    const isBold = element.fontWeight === 'bold' || element.fontName.toLowerCase().includes('bold')
    const isShortLine = element.text.length < 100
    const isCapitalized = /^[A-Z]/.test(element.text.trim())
    
    return (isLargerFont || isBold) && isShortLine && isCapitalized
  }

  /**
   * Determines heading level based on font size and styling
   */
  private inferHeadingLevel(block: {elements: LayoutElement[]}): number {
    const element = block.elements[0]
    const fontSize = element.fontSize
    
    // Simple heuristic based on font size
    if (fontSize >= 20) return 1
    if (fontSize >= 16) return 2
    if (fontSize >= 14) return 3
    if (fontSize >= 12) return 4
    return 5
  }

  /**
   * Checks if element is part of a table
   */
  private isTableElement(element: LayoutElement, allElements: LayoutElement[], index: number): boolean {
    // Look for tabular patterns - aligned text, multiple columns
    const yTolerance = 2
    const sameLineElements = allElements.filter(el => Math.abs(el.y - element.y) <= yTolerance)
    
    // If multiple elements on same line with regular spacing, might be table
    return sameLineElements.length >= 3 && this.hasRegularSpacing(sameLineElements)
  }

  /**
   * Checks if elements have regular spacing (table-like)
   */
  private hasRegularSpacing(elements: LayoutElement[]): boolean {
    if (elements.length < 3) return false
    
    elements.sort((a, b) => a.x - b.x)
    const gaps: number[] = []
    
    for (let i = 1; i < elements.length; i++) {
      gaps.push(elements[i].x - (elements[i-1].x + elements[i-1].width))
    }
    
    // Check if gaps are relatively consistent
    const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
    const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length
    
    return variance < avgGap * 0.5 // Low variance indicates regular spacing
  }

  /**
   * Checks if element is a figure caption
   */
  private isFigureCaption(element: LayoutElement): boolean {
    const text = element.text.toLowerCase().trim()
    return /^(figure|fig\.?|table|chart)\s+\d+/i.test(text) || 
           text.startsWith('fig.') || 
           (element.fontWeight === 'italic' && text.length < 200)
  }

  /**
   * Determines if should start new block
   */
  private shouldStartNewBlock(element: LayoutElement, currentBlock: LayoutElement[]): boolean {
    if (currentBlock.length === 0) return false
    
    const lastElement = currentBlock[currentBlock.length - 1]
    const verticalGap = element.y - (lastElement.y + lastElement.height)
    
    // Start new block if significant vertical gap
    return verticalGap > lastElement.fontSize * 1.5
  }

  /**
   * Parses text that appears to be a table
   */
  private parseTextTable(text: string) {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return null
    
    // Simple table detection - look for consistent column separators
    const separators = ['\t', '  ', ' | ', '|']
    let bestSeparator = ''
    let maxColumns = 0
    
    for (const sep of separators) {
      const columns = lines[0].split(sep).length
      if (columns > maxColumns && columns > 1) {
        maxColumns = columns
        bestSeparator = sep
      }
    }
    
    if (maxColumns < 2) return null
    
    const rows = lines.map(line => 
      line.split(bestSeparator)
         .map(cell => cell.trim())
         .filter(cell => cell)
    ).filter(row => row.length > 1)
    
    if (rows.length < 2) return null
    
    const headers = rows[0]
    const dataRows = rows.slice(1)
    
    return createIRTable(headers, dataRows)
  }

  /**
   * Extracts figure from page
   */
  private async extractFigure(page: any, block: {text: string, elements: LayoutElement[]}): Promise<any> {
    // This would require more complex image extraction from PDF
    // For now, create a placeholder figure with caption
    return createIRFigure(
      {
        id: `pdf-figure-${Date.now()}`,
        filename: 'extracted-figure.png',
        mimeType: 'image/png',
        url: '', // Would need actual image extraction
        alt: block.text
      },
      block.text,
      block.text
    )
  }

  /**
   * Performs OCR on image data
   */
  private async performOCR(imageData: string): Promise<OCRResult[]> {
    const worker = await createWorker(this.options.ocrLanguage)
    
    try {
      const { data } = await worker.recognize(imageData)
      
      const results: OCRResult[] = []
      
      // Process paragraphs
      for (const paragraph of data.paragraphs) {
        if (paragraph.text.trim()) {
          results.push({
            text: paragraph.text,
            confidence: paragraph.confidence,
            bbox: paragraph.bbox,
            words: paragraph.words.map(word => ({
              text: word.text,
              confidence: word.confidence,
              bbox: word.bbox
            }))
          })
        }
      }
      
      return results
      
    } finally {
      await worker.terminate()
    }
  }

  /**
   * Infers font weight from font name
   */
  private inferFontWeight(fontName: string): string {
    const name = fontName.toLowerCase()
    if (name.includes('bold') || name.includes('heavy') || name.includes('black')) {
      return 'bold'
    }
    if (name.includes('light') || name.includes('thin')) {
      return 'light'
    }
    return 'normal'
  }

  /**
   * Merges sections if content flows naturally
   */
  private mergeSections(sections: IRSection[]): IRSection[] {
    if (sections.length <= 1) return sections
    
    // Simple merge strategy - combine if no major headings separate sections
    const merged: IRSection[] = []
    let currentSection = sections[0]
    
    for (let i = 1; i < sections.length; i++) {
      const nextSection = sections[i]
      
      // Check if next section starts with a major heading
      const hasStartingHeading = nextSection.blocks.length > 0 && 
                                 nextSection.blocks[0].type === 'heading'
      
      if (hasStartingHeading) {
        merged.push(currentSection)
        currentSection = nextSection
      } else {
        // Merge sections
        const offset = currentSection.blocks.length
        currentSection.blocks.push(...nextSection.blocks.map(block => ({
          ...block,
          order: block.order + offset
        })))
        
        if (nextSection.notes) {
          currentSection.notes = (currentSection.notes || []).concat(nextSection.notes)
        }
      }
    }
    
    merged.push(currentSection)
    return merged
  }
}

// Factory function
export const createPDFProcessor = (options?: PDFProcessingOptions) => 
  new PDFProcessor(options)

// Convenience function  
export const processPDFFile = async (file: File, options?: PDFProcessingOptions): Promise<IRDocument> => {
  const processor = createPDFProcessor(options)
  return await processor.processFile(file)
}