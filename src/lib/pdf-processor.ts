/**
 * PDF Processing with Text Extraction and OCR Fallback
 * Handles text-based PDFs with layout analysis and image-only PDFs with OCR
 * 
 * NOTE: PDF processing is currently disabled due to build environment constraints.
 * This module would normally use pdfjs-dist for PDF parsing and tesseract.js for OCR.
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
  // PDF processing is currently disabled due to build environment constraints
  throw new Error('PDF processing is currently disabled. Please use other import formats like Word documents or plain text.')
}

// Legacy export for backward compatibility
export const processPdf = ingestPdf
export const processPDFFile = ingestPdf