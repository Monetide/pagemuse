/**
 * PDF Processing with Text Extraction and OCR Fallback
 * Handles text-based PDFs with layout analysis and image-only PDFs with OCR
 */

import { 
  IRDocument, 
  IRSection, 
  IRBlock, 
  createIRDocument, 
  createIRSection, 
  createIRBlock 
} from './ir-types'

export interface PDFProcessingOptions {
  enableOCR?: boolean
  ocrLanguage?: string
  onProgress?: (pageNum: number, totalPages: number) => void
  pageLabels?: string[]
  enablePostProcessing?: boolean
  confidenceThreshold?: number
  detectColumns?: boolean
  mergeHyphenatedWords?: boolean
}

export const ingestPdf = async (
  file: File,
  options: PDFProcessingOptions = {}
): Promise<IRDocument> => {
  if (typeof window === 'undefined') {
    throw new Error('PDF processing is only available in browser environment')
  }

  try {
    // Dynamic import to avoid build issues
    const pdfjs = await import('pdfjs-dist')
    
    // Configure worker path
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`

    const {
      enableOCR = false,
      ocrLanguage = 'eng',
      onProgress,
      confidenceThreshold = 0.7,
      detectColumns = true,
      mergeHyphenatedWords = true
    } = options

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    
    // Load PDF document
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
    const totalPages = pdf.numPages

    const document = createIRDocument(file.name.replace('.pdf', ''))
    
    // Add metadata
    document.metadata = {
      ...document.metadata,
      source: 'pdf',
      filename: file.name,
      totalPages,
      processingOptions: options,
      language: 'en'
    }

    // Process each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (onProgress) {
        onProgress(pageNum, totalPages)
      }

      const page = await pdf.getPage(pageNum)
      
      // Try text extraction first
      const textContent = await page.getTextContent()
      let extractedText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim()

      // If no text found and OCR is enabled, try OCR
      if (!extractedText && enableOCR) {
        try {
          const tesseract = await import('tesseract.js')
          
          // Render page to canvas for OCR
          const viewport = page.getViewport({ scale: 2.0 })
          const canvas = (globalThis as any).document?.createElement('canvas') || new OffscreenCanvas(viewport.width, viewport.height)
          const context = canvas.getContext('2d')!
          
          canvas.height = viewport.height
          canvas.width = viewport.width

          await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas
          }).promise

          // Perform OCR
          const { data: { text, confidence } } = await tesseract.recognize(canvas, ocrLanguage)
          
          if (confidence >= confidenceThreshold) {
            extractedText = text.trim()
          }
        } catch (ocrError) {
          console.warn(`OCR failed for page ${pageNum}:`, ocrError)
        }
      }

      if (extractedText) {
        // Process text based on options
        if (mergeHyphenatedWords) {
          extractedText = extractedText.replace(/(\w+)-\s+(\w+)/g, '$1$2')
        }

        // Create sections and blocks
        const paragraphs = extractedText.split(/\n\s*\n/).filter(p => p.trim())
        
        const section = createIRSection(`Page ${pageNum}`, pageNum)
        
        // Add blocks to the section
        paragraphs.forEach((paragraph, index) => {
          const block = createIRBlock('paragraph', paragraph.trim(), index + 1)
          section.blocks.push(block)
        })

        document.sections.push(section)
      }
    }

    return document
  } catch (error) {
    console.error('PDF processing failed:', error)
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Legacy export for backward compatibility
export const processPdf = ingestPdf
export const processPDFFile = ingestPdf