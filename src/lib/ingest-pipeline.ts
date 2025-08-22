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
   * Processes plain text and markdown files with enhanced parsing
   */
  private async processTextFile(file: File): Promise<IRDocument> {
    const text = await file.text()
    const title = file.name.replace(/\.(txt|md)$/, '')
    const extension = file.name.split('.').pop()?.toLowerCase()
    
    const irDoc = createIRDocument(title)
    const section = createIRSection('Content', 1)
    
    if (extension === 'md') {
      await this.parseMarkdownContent(text, section)
    } else {
      await this.parsePlainTextContent(text, section)
    }
    
    irDoc.sections.push(section)
    return irDoc
  }

  /**
   * Parses Markdown content with CommonMark + GitHub extensions
   */
  private async parseMarkdownContent(text: string, section: IRSection) {
    const lines = text.split('\n')
    let blockOrder = 1
    let i = 0
    
    while (i < lines.length) {
      const line = lines[i].trim()
      
      if (!line) {
        i++
        continue
      }
      
      // Headings: # to ######
      if (line.startsWith('#')) {
        const match = line.match(/^(#{1,6})\s+(.+)$/)
        if (match) {
          const level = match[1].length
          const text = match[2].trim()
          const heading = createIRHeading(level, text)
          section.blocks.push(createIRBlock('heading', heading, blockOrder++))
        }
        i++
        continue
      }
      
      // Horizontal rules: --- or ***
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
        section.blocks.push(createIRBlock('horizontal-rule', null, blockOrder++))
        i++
        continue
      }
      
      // Code fences: ```
      if (line.startsWith('```')) {
        const result = this.parseCodeFence(lines, i)
        if (result) {
          section.blocks.push(createIRBlock('code', result.code, blockOrder++))
          i = result.nextIndex
          continue
        }
      }
      
      // Tables: | header | header |
      if (line.includes('|') && this.looksLikeTableRow(line)) {
        const result = this.parseMarkdownTable(lines, i)
        if (result) {
          const table = createIRTable(result.headers, result.rows, result.caption)
          section.blocks.push(createIRBlock('table', table, blockOrder++))
          i = result.nextIndex
          continue
        }
      }
      
      // Blockquotes and Callouts: >
      if (line.startsWith('>')) {
        const result = this.parseBlockquote(lines, i)
        if (result.isCallout) {
          const callout = createIRCallout(result.calloutType!, result.content, result.title)
          section.blocks.push(createIRBlock('callout', callout, blockOrder++))
        } else {
          const quote = createIRQuote(result.content, result.citation)
          section.blocks.push(createIRBlock('quote', quote, blockOrder++))
        }
        i = result.nextIndex
        continue
      }
      
      // Lists: - or * for unordered, 1. for ordered
      if (/^[\s]*[-*+]\s/.test(line) || /^[\s]*\d+\.\s/.test(line)) {
        const result = this.parseMarkdownList(lines, i)
        const listType = result.type === 'ordered' ? 'ordered' : 'unordered'
        const list = createIRList(listType, result.items)
        section.blocks.push(createIRBlock('list', list, blockOrder++))
        i = result.nextIndex
        continue
      }
      
      // Images: ![alt](src "caption")
      const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/)
      if (imageMatch) {
        const [, alt, src, caption] = imageMatch
        const figure = createIRFigure(
          {
            id: `asset-${Date.now()}`,
            filename: src.split('/').pop() || 'image',
            mimeType: this.getMimeTypeFromExtension(src),
            url: src,
            alt: alt
          },
          caption || '',
          alt
        )
        section.blocks.push(createIRBlock('figure', figure, blockOrder++))
        i++
        continue
      }
      
      // Regular paragraph - collect consecutive non-empty lines
      const result = this.parseMarkdownParagraph(lines, i)
      if (result.content.trim()) {
        section.blocks.push(createIRBlock('paragraph', result.content, blockOrder++, {
          marks: result.marks
        }))
      }
      i = result.nextIndex
    }
  }

  /**
   * Parses plain text with structure detection
   */
  private async parsePlainTextContent(text: string, section: IRSection) {
    const lines = text.split('\n')
    let blockOrder = 1
    let i = 0
    
    while (i < lines.length) {
      const line = lines[i].trim()
      
      if (!line) {
        i++
        continue
      }
      
      // Structure detection for headings
      const headingMatch = this.detectStructuralHeading(line)
      if (headingMatch) {
        const heading = createIRHeading(headingMatch.level, headingMatch.text)
        section.blocks.push(createIRBlock('heading', heading, blockOrder++))
        i++
        continue
      }
      
      // Simple list detection
      if (/^[\s]*[-*•]\s/.test(line) || /^[\s]*\d+[\.)]\s/.test(line)) {
        const result = this.parsePlainTextList(lines, i)
        const listType = /^\d/.test(line.trim()) ? 'ordered' : 'unordered'
        const list = createIRList(listType, result.items)
        section.blocks.push(createIRBlock('list', list, blockOrder++))
        i = result.nextIndex
        continue
      }
      
      // Quote detection (lines that start with quotes)
      if (line.startsWith('"') && line.endsWith('"')) {
        const quote = createIRQuote(line.slice(1, -1))
        section.blocks.push(createIRBlock('quote', quote, blockOrder++))
        i++
        continue
      }
      
      // Paragraph - collect lines until blank line
      const result = this.parsePlainTextParagraph(lines, i)
      if (result.content.trim()) {
        section.blocks.push(createIRBlock('paragraph', result.content, blockOrder++))
      }
      i = result.nextIndex
    }
  }

  /**
   * Parses a code fence block
   */
  private parseCodeFence(lines: string[], startIndex: number): { code: any; nextIndex: number } | null {
    const startLine = lines[startIndex].trim()
    const language = startLine.substring(3).trim() || undefined
    const codeLines: string[] = []
    let i = startIndex + 1
    
    while (i < lines.length) {
      if (lines[i].trim().startsWith('```')) {
        break
      }
      codeLines.push(lines[i])
      i++
    }
    
    return {
      code: {
        language,
        content: codeLines.join('\n'),
        inline: false
      },
      nextIndex: i + 1
    }
  }

  /**
   * Checks if a line looks like a table row
   */
  private looksLikeTableRow(line: string): boolean {
    const trimmed = line.trim()
    return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.split('|').length >= 3
  }

  /**
   * Parses a Markdown table
   */
  private parseMarkdownTable(lines: string[], startIndex: number): { 
    headers: string[], 
    rows: string[][], 
    caption?: string,
    nextIndex: number 
  } | null {
    let i = startIndex
    const tableLines: string[] = []
    
    // Collect all consecutive table rows
    while (i < lines.length && this.looksLikeTableRow(lines[i])) {
      tableLines.push(lines[i].trim())
      i++
    }
    
    if (tableLines.length < 2) return null
    
    // Parse header row
    const headerRow = tableLines[0]
    const headers = this.parseTableRow(headerRow)
    
    // Skip separator row if it exists (| --- | --- |)
    let dataStartIndex = 1
    if (tableLines[1] && /^[\s]*\|[\s]*:?-+:?[\s]*\|/.test(tableLines[1])) {
      dataStartIndex = 2
    }
    
    // Parse data rows
    const rows: string[][] = []
    for (let j = dataStartIndex; j < tableLines.length; j++) {
      const row = this.parseTableRow(tableLines[j])
      if (row.length > 0) {
        rows.push(row)
      }
    }
    
    return {
      headers,
      rows,
      nextIndex: i
    }
  }

  /**
   * Parses a single table row
   */
  private parseTableRow(line: string): string[] {
    return line
      .split('|')
      .slice(1, -1) // Remove first and last empty elements
      .map(cell => cell.trim())
  }

  /**
   * Parses blockquotes and detects callouts
   */
  private parseBlockquote(lines: string[], startIndex: number): {
    content: string,
    citation?: string,
    isCallout: boolean,
    calloutType?: 'info' | 'warning' | 'error' | 'success' | 'note',
    title?: string,
    nextIndex: number
  } {
    const quoteLines: string[] = []
    let i = startIndex
    
    // Collect all consecutive quote lines
    while (i < lines.length && lines[i].trim().startsWith('>')) {
      const quoteLine = lines[i].trim().substring(1).trim()
      quoteLines.push(quoteLine)
      i++
    }
    
    const fullContent = quoteLines.join(' ').trim()
    
    // Check for callout patterns: **Note:** or **Warning:** etc.
    const calloutMatch = fullContent.match(/^\*\*(Note|Warning|Error|Success|Info|Tip|Important)\*\*:?\s*(.+)$/i)
    if (calloutMatch) {
      const matchedType = calloutMatch[1].toLowerCase()
      let actualType: 'info' | 'warning' | 'error' | 'success' | 'note'
      
      switch (matchedType) {
        case 'tip':
        case 'important':
        case 'info':
          actualType = 'info'
          break
        case 'warning':
          actualType = 'warning'
          break
        case 'error':
          actualType = 'error'
          break
        case 'success':
          actualType = 'success'
          break
        case 'note':
        default:
          actualType = 'note'
          break
      }
      
      return {
        content: calloutMatch[2].trim(),
        isCallout: true,
        calloutType: actualType,
        title: calloutMatch[1],
        nextIndex: i
      }
    }
    
    // Check for citation pattern (ending with -- Author)
    const citationMatch = fullContent.match(/^(.+?)\s*--\s*(.+)$/)
    if (citationMatch) {
      return {
        content: citationMatch[1].trim(),
        citation: citationMatch[2].trim(),
        isCallout: false,
        nextIndex: i
      }
    }
    
    return {
      content: fullContent,
      isCallout: false,
      nextIndex: i
    }
  }

  /**
   * Parses Markdown lists with nesting support
   */
  private parseMarkdownList(lines: string[], startIndex: number): {
    type: 'ordered' | 'unordered',
    items: string[],
    nextIndex: number
  } {
    const items: string[] = []
    let i = startIndex
    const firstLine = lines[i].trim()
    const isOrdered = /^\d+\./.test(firstLine)
    
    while (i < lines.length) {
      const line = lines[i].trim()
      
      if (!line) {
        i++
        continue
      }
      
      const orderedMatch = line.match(/^(\s*)\d+\.\s+(.+)$/)
      const unorderedMatch = line.match(/^(\s*)[-*+]\s+(.+)$/)
      
      if ((isOrdered && orderedMatch) || (!isOrdered && unorderedMatch)) {
        const match = orderedMatch || unorderedMatch
        const content = match![2]
        items.push(content)
        i++
      } else if (/^[\s]*[-*+]\s/.test(line) || /^[\s]*\d+\.\s/.test(line)) {
        // Different list type, stop here
        break
      } else {
        // Not a list item, stop
        break
      }
    }
    
    return {
      type: isOrdered ? 'ordered' : 'unordered',
      items,
      nextIndex: i
    }
  }

  /**
   * Parses a markdown paragraph and extracts inline formatting
   */
  private parseMarkdownParagraph(lines: string[], startIndex: number): {
    content: string,
    marks: any[],
    nextIndex: number
  } {
    const paragraphLines: string[] = []
    let i = startIndex
    
    // Collect lines until blank line or special syntax
    while (i < lines.length) {
      const line = lines[i].trim()
      
      if (!line) {
        i++
        break
      }
      
      // Stop at special syntax
      if (line.startsWith('#') || line.startsWith('>') || line.startsWith('```') || 
          line.includes('|') || /^[-*+]\s/.test(line) || /^\d+\.\s/.test(line)) {
        break
      }
      
      paragraphLines.push(line)
      i++
    }
    
    const content = paragraphLines.join(' ')
    const marks = this.extractMarkdownMarks(content)
    
    return {
      content: this.stripMarkdownSyntax(content),
      marks,
      nextIndex: i
    }
  }

  /**
   * Detects structural headings in plain text
   */
  private detectStructuralHeading(line: string): { level: number, text: string } | null {
    // Common patterns for headings
    const patterns = [
      { regex: /^(Chapter|CHAPTER)\s+(\d+|[IVX]+):?\s*(.+)$/i, level: 1 },
      { regex: /^(Section|SECTION)\s+(\d+):?\s*(.+)$/i, level: 2 },
      { regex: /^(Part|PART)\s+(\d+):?\s*(.+)$/i, level: 1 },
      { regex: /^(\d+)\.\s+(.+)$/, level: 2 },
      { regex: /^([A-Z][A-Z\s]{2,})$/, level: 2 }, // ALL CAPS
    ]
    
    for (const pattern of patterns) {
      const match = line.match(pattern.regex)
      if (match) {
        const text = pattern.level === 2 && match[3] ? match[3] : 
                     pattern.level === 2 && match[2] ? match[2] :
                     match[match.length - 1] || line
        return { level: pattern.level, text: text.trim() }
      }
    }
    
    return null
  }

  /**
   * Parses plain text lists
   */
  private parsePlainTextList(lines: string[], startIndex: number): {
    items: string[],
    nextIndex: number
  } {
    const items: string[] = []
    let i = startIndex
    
    while (i < lines.length) {
      const line = lines[i].trim()
      
      if (!line) {
        i++
        continue
      }
      
      const match = line.match(/^[\s]*(?:[-*•]|\d+[\.)])\s+(.+)$/)
      if (match) {
        items.push(match[1])
        i++
      } else {
        break
      }
    }
    
    return { items, nextIndex: i }
  }

  /**
   * Parses plain text paragraph
   */
  private parsePlainTextParagraph(lines: string[], startIndex: number): {
    content: string,
    nextIndex: number
  } {
    const paragraphLines: string[] = []
    let i = startIndex
    
    while (i < lines.length) {
      const line = lines[i].trim()
      
      if (!line) {
        i++
        break
      }
      
      // Stop at potential structure or list
      if (this.detectStructuralHeading(line) || /^[\s]*[-*•]\s/.test(line) || /^[\s]*\d+[\.)]\s/.test(line)) {
        break
      }
      
      paragraphLines.push(line)
      i++
    }
    
    return {
      content: paragraphLines.join(' '),
      nextIndex: i
    }
  }

  /**
   * Extracts markdown formatting marks
   */
  private extractMarkdownMarks(text: string): any[] {
    const marks = []
    
    if (/\*\*[^*]+\*\*/.test(text) || /__[^_]+__/.test(text)) {
      marks.push({ type: 'bold' })
    }
    
    if (/\*[^*]+\*/.test(text) || /_[^_]+_/.test(text)) {
      marks.push({ type: 'italic' })
    }
    
    if (/`[^`]+`/.test(text)) {
      marks.push({ type: 'code' })
    }
    
    const linkMatch = text.match(/\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      marks.push({ type: 'link', attrs: { href: linkMatch[2] } })
    }
    
    return marks
  }

  /**
   * Strips markdown syntax from text
   */
  private stripMarkdownSyntax(text: string): string {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '$1')  // Bold
      .replace(/__([^_]+)__/g, '$1')      // Bold alt
      .replace(/\*([^*]+)\*/g, '$1')      // Italic
      .replace(/_([^_]+)_/g, '$1')        // Italic alt
      .replace(/`([^`]+)`/g, '$1')        // Inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
  }

  /**
   * Gets MIME type from file extension
   */
  private getMimeTypeFromExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml'
    }
    return mimeTypes[ext || ''] || 'image/jpeg'
  }

  /**
   * Processes HTML files with comprehensive element mapping
   */
  private async processHtmlFile(file: File): Promise<IRDocument> {
    const html = await file.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    const title = doc.title || file.name.replace(/\.html$/, '')
    const irDoc = createIRDocument(title)
    const section = createIRSection('Content', 1)
    
    let blockOrder = 1
    let footnoteCounter = 1
    
    const processElement = (element: Element): boolean => {
      const tagName = element.tagName.toLowerCase()
      const textContent = element.textContent?.trim() || ''
      
      switch (tagName) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          if (textContent) {
            const level = parseInt(tagName[1])
            const heading = createIRHeading(level, textContent)
            section.blocks.push(createIRBlock('heading', heading, blockOrder++))
            return true
          }
          break
          
        case 'p':
          if (textContent) {
            // Extract inline formatting and links
            const { content, marks } = this.extractHtmlInlineFormatting(element)
            section.blocks.push(createIRBlock('paragraph', content, blockOrder++, { marks }))
            return true
          }
          break
          
        case 'blockquote':
          if (textContent) {
            // Check for citation pattern
            const citationMatch = textContent.match(/^(.+?)\s*—\s*(.+)$/)
            const quote = citationMatch 
              ? createIRQuote(citationMatch[1].trim(), citationMatch[2].trim())
              : createIRQuote(textContent)
            section.blocks.push(createIRBlock('quote', quote, blockOrder++))
            return true
          }
          break
          
        case 'ul':
        case 'ol':
          const listItems = this.extractHtmlListItems(element)
          if (listItems.length > 0) {
            const listType = tagName === 'ul' ? 'unordered' : 'ordered'
            const list = createIRList(listType, listItems)
            section.blocks.push(createIRBlock('list', list, blockOrder++))
            return true
          }
          break
          
        case 'table':
          const table = this.parseEnhancedHtmlTable(element)
          if (table) {
            section.blocks.push(createIRBlock('table', table, blockOrder++))
            return true
          }
          break
          
        case 'figure':
          const figure = this.parseHtmlFigure(element)
          if (figure) {
            section.blocks.push(createIRBlock('figure', figure, blockOrder++))
            return true
          }
          break
          
        case 'img':
          // Handle standalone images
          const standaloneImg = this.parseStandaloneImage(element)
          if (standaloneImg) {
            section.blocks.push(createIRBlock('figure', standaloneImg, blockOrder++))
            return true
          }
          break
          
        case 'hr':
          section.blocks.push(createIRBlock('horizontal-rule', null, blockOrder++))
          return true
          
        case 'pre':
          const preContent = element.textContent || ''
          const codeElement = element.querySelector('code')
          const language = codeElement?.getAttribute('class')?.replace(/language-/, '') || undefined
          
          section.blocks.push(createIRBlock('code', {
            content: preContent,
            inline: false,
            language
          }, blockOrder++))
          return true
          
        case 'code':
          // Only handle inline code if not inside pre
          if (element.parentElement?.tagName.toLowerCase() !== 'pre' && textContent) {
            // This would be handled as an inline mark in paragraph processing
            return false
          }
          break
          
        case 'div':
        case 'section':
        case 'article':
        case 'main':
          // Process children without creating a block
          return false
          
        default:
          return false
      }
      
      return false
    }
    
    const processNode = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element
        const handled = processElement(element)
        
        if (!handled) {
          // Process children if this element wasn't handled as a block
          Array.from(element.childNodes).forEach(processNode)
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const textContent = node.textContent?.trim()
        if (textContent && textContent.length > 0) {
          // Handle orphaned text as paragraph
          section.blocks.push(createIRBlock('paragraph', textContent, blockOrder++))
        }
      }
    }
    
    // Process footnotes first if they exist
    this.processHtmlFootnotes(doc, section, footnoteCounter)
    
    // Process main content
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
   * Processes PDF files using comprehensive PDF processor
   */
  private async processPdfFile(file: File): Promise<IRDocument> {
    try {
      const { processPDFFile } = await import('./pdf-processor')
      return await processPDFFile(file, {
        ocrLanguage: 'eng',
        confidenceThreshold: 75,
        enableOCR: true,
        detectColumns: true,
        mergeHyphenatedWords: true
      })
    } catch (error) {
      console.error('Error processing PDF:', error)
      
      // Fallback to basic processing
      const title = file.name.replace(/\.pdf$/, '')
      const irDoc = createIRDocument(title)
      const section = createIRSection('PDF Content', 1)
      
      section.blocks.push(createIRBlock('paragraph', 
        `Error processing PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or use a different file format.`, 1))
      
      irDoc.sections.push(section)
      return irDoc
    }
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
   * Parses HTML table to IR table format with enhanced header detection
   */
  private parseEnhancedHtmlTable(tableElement: Element) {
    const headers: string[] = []
    const rows: string[][] = []
    let hasHeaderRow = false
    
    // Check for thead section
    const thead = tableElement.querySelector('thead')
    if (thead) {
      const headerRow = thead.querySelector('tr')
      if (headerRow) {
        hasHeaderRow = true
        const headerCells = headerRow.querySelectorAll('th, td')
        headerCells.forEach(cell => {
          headers.push(cell.textContent?.trim() || '')
        })
      }
    }
    
    // Get tbody or all rows if no thead
    const tbody = tableElement.querySelector('tbody')
    const rowSelector = tbody ? 'tr' : (hasHeaderRow ? 'tr:not(thead tr)' : 'tr')
    const dataRows = (tbody || tableElement).querySelectorAll(rowSelector)
    
    // If no explicit header found, check if first row looks like header
    if (!hasHeaderRow && dataRows.length > 0) {
      const firstRow = dataRows[0]
      const firstRowCells = firstRow.querySelectorAll('th, td')
      
      if (this.looksLikeHtmlHeaderRow(firstRowCells)) {
        hasHeaderRow = true
        firstRowCells.forEach(cell => {
          headers.push(cell.textContent?.trim() || '')
        })
        
        // Process remaining rows as data
        Array.from(dataRows).slice(1).forEach(row => {
          const cells = row.querySelectorAll('td, th')
          const rowData: string[] = []
          cells.forEach(cell => {
            rowData.push(cell.textContent?.trim() || '')
          })
          if (rowData.length > 0) {
            rows.push(rowData)
          }
        })
      } else {
        // No header, all rows are data
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
      }
    } else if (hasHeaderRow) {
      // Process data rows
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
    }
    
    // Get table caption if exists
    const caption = tableElement.querySelector('caption')?.textContent?.trim()
    
    if (headers.length > 0 || rows.length > 0) {
      return createIRTable(headers, rows, caption)
    }
    
    return null
  }
  
  /**
   * Determines if HTML table row looks like a header
   */
  private looksLikeHtmlHeaderRow(cells: NodeListOf<Element>): boolean {
    if (cells.length === 0) return false
    
    // Check if most cells are th elements
    const thCount = Array.from(cells).filter(cell => cell.tagName.toLowerCase() === 'th').length
    if (thCount > cells.length / 2) return true
    
    // Check for bold styling
    const boldCells = Array.from(cells).filter(cell => {
      const hasStrongOrB = cell.querySelector('strong, b')
      const htmlCell = cell as HTMLElement
      const hasBoldStyle = htmlCell.style?.fontWeight === 'bold' || 
                           htmlCell.style?.fontWeight === '700' ||
                           getComputedStyle(htmlCell).fontWeight === 'bold' ||
                           getComputedStyle(htmlCell).fontWeight === '700'
      return hasStrongOrB || hasBoldStyle
    })
    
    return boldCells.length > cells.length / 2
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
  
  /**
   * Extracts inline formatting and links from HTML element
   */
  private extractHtmlInlineFormatting(element: Element): { content: string; marks: any[] } {
    const marks: any[] = []
    let content = ''
    
    const processTextNode = (node: Node, inheritedMarks: any[] = []): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || ''
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element
        const tagName = el.tagName.toLowerCase()
        const currentMarks = [...inheritedMarks]
        
        // Add formatting marks
        switch (tagName) {
          case 'strong':
          case 'b':
            currentMarks.push({ type: 'bold' })
            break
          case 'em':
          case 'i':
            currentMarks.push({ type: 'italic' })
            break
          case 'u':
            currentMarks.push({ type: 'underline' })
            break
          case 's':
          case 'strike':
          case 'del':
            currentMarks.push({ type: 'strikethrough' })
            break
          case 'code':
            currentMarks.push({ type: 'code' })
            break
          case 'a':
            const href = el.getAttribute('href')
            if (href) {
              currentMarks.push({ type: 'link', attrs: { href } })
            }
            break
          case 'sup':
            // Handle footnote markers
            const text = el.textContent?.trim() || ''
            if (/^\d+$/.test(text) || /^\[[\d,\s]+\]$/.test(text)) {
              currentMarks.push({ type: 'footnote', attrs: { number: text } })
            }
            break
        }
        
        // Process children and collect text
        let childText = ''
        Array.from(el.childNodes).forEach(child => {
          childText += processTextNode(child, currentMarks)
        })
        
        // Add marks to global marks array if we have text content
        if (childText.trim() && currentMarks.length > 0) {
          marks.push(...currentMarks)
        }
        
        return childText
      }
      
      return ''
    }
    
    // Process all child nodes
    Array.from(element.childNodes).forEach(child => {
      content += processTextNode(child)
    })
    
    return { content: content.trim(), marks }
  }
  
  /**
   * Extracts list items with proper nesting
   */
  private extractHtmlListItems(listElement: Element): string[] {
    const items: string[] = []
    
    const processListItem = (li: Element, indent = 0): void => {
      const text = li.childNodes[0]?.textContent?.trim() || ''
      if (text) {
        const prefix = '  '.repeat(indent)
        items.push(prefix + text)
      }
      
      // Handle nested lists
      const nestedLists = li.querySelectorAll('ul, ol')
      nestedLists.forEach(nestedList => {
        const nestedItems = nestedList.querySelectorAll('li')
        nestedItems.forEach(nestedLi => {
          processListItem(nestedLi, indent + 1)
        })
      })
    }
    
    const listItems = listElement.querySelectorAll(':scope > li')
    listItems.forEach(li => processListItem(li))
    
    return items
  }
  
  /**
   * Parses HTML figure element (img + figcaption)
   */
  private parseHtmlFigure(figureElement: Element) {
    const img = figureElement.querySelector('img')
    if (!img) return null
    
    const figcaption = figureElement.querySelector('figcaption')
    const caption = figcaption?.textContent?.trim() || ''
    const alt = img.getAttribute('alt') || ''
    const src = img.getAttribute('src') || ''
    
    if (!src) return null
    
    return createIRFigure(
      {
        id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        filename: src.split('/').pop() || 'image',
        mimeType: this.getMimeTypeFromExtension(src),
        url: src,
        alt,
        title: img.getAttribute('title') || ''
      },
      caption,
      alt
    )
  }
  
  /**
   * Parses standalone image element
   */
  private parseStandaloneImage(imgElement: Element) {
    const src = imgElement.getAttribute('src') || ''
    const alt = imgElement.getAttribute('alt') || ''
    const title = imgElement.getAttribute('title') || ''
    
    if (!src) return null
    
    // Check if next sibling is a caption-like element
    let caption = ''
    const nextSibling = imgElement.nextElementSibling
    if (nextSibling) {
      const tagName = nextSibling.tagName.toLowerCase()
      const text = nextSibling.textContent?.trim() || ''
      
      if ((tagName === 'p' || tagName === 'div') && 
          (text.toLowerCase().startsWith('figure') || 
           text.toLowerCase().includes('caption') ||
           nextSibling.className.includes('caption'))) {
        caption = text
      }
    }
    
    return createIRFigure(
      {
        id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        filename: src.split('/').pop() || 'image',
        mimeType: this.getMimeTypeFromExtension(src),
        url: src,
        alt,
        title
      },
      caption,
      alt
    )
  }
  
  /**
   * Processes HTML footnotes and footnote markers
   */
  private processHtmlFootnotes(doc: Document, section: IRSection, footnoteCounter: number) {
    // Look for footnote definitions (common patterns)
    const footnoteSelectors = [
      '[id^="fn"]',       // id="fn1", id="fn2", etc.
      '[id^="footnote"]', // id="footnote1", etc.
      '.footnote',        // class="footnote"
      '.fn'               // class="fn"
    ]
    
    footnoteSelectors.forEach(selector => {
      const footnotes = doc.querySelectorAll(selector)
      footnotes.forEach((footnote, index) => {
        const content = footnote.textContent?.trim() || ''
        if (content) {
          const footnoteObj = {
            id: footnote.id || `footnote-${footnoteCounter + index}`,
            number: footnoteCounter + index,
            content,
            backlinks: []
          }
          
          if (!section.notes) {
            section.notes = []
          }
          section.notes.push(footnoteObj)
        }
      })
    })
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
