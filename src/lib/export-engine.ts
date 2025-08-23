import { SemanticDocument, Section, Block } from './document-model'
import { generateLayout, LayoutResult } from './layout-engine'
import { generateTOC, TOCEntry, defaultTOCConfig } from './toc-generator'

export type ExportFormat = 'pdf' | 'docx' | 'google-docs'

export type ExportScope = 'entire-doc' | 'page-range' | 'sections'

export interface ExportOptions {
  format: ExportFormat
  filename: string
  scope: ExportScope
  pageRange?: { start: number; end: number }
  selectedSections?: string[]
  includeTOC: boolean
  includeFrontMatter: boolean
  includeAppendix: boolean
  generateTOC: boolean // If no TOC block exists
  watermark?: string
  
  // PDF specific
  embedFonts?: boolean
  imageQuality?: 'none' | '300dpi' | '150dpi'
  taggedPDF?: boolean
  pdfSecurity?: {
    disableCopy: boolean
    disablePrint: boolean
  }
  
  // DOCX specific
  docxOptions?: {
    trackChanges: boolean
    comments: boolean
  }
  
  // Google Docs specific
  googleDocsOptions?: {
    folderId?: string
    shareWithUsers?: string[]
  }
}

export interface ExportJob {
  id: string
  documentId: string
  documentTitle: string
  format: ExportFormat
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  startTime: string
  endTime?: string
  options: ExportOptions
  result?: {
    downloadUrl?: string
    googleDocsUrl?: string
    fileSize?: number
  }
  error?: string
  warnings: ExportWarning[]
}

export interface ExportWarning {
  type: 'missing-alt-text' | 'missing-caption' | 'no-table-header' | 'low-resolution' | 'large-table'
  blockId: string
  blockType: string
  message: string
  severity: 'error' | 'warning' | 'info'
}

export interface PreflightResult {
  pageCount: number
  figureCount: number
  tableCount: number
  footnoteCount: number
  warnings: ExportWarning[]
  canExport: boolean
}

export class ExportEngine {
  private jobs: Map<string, ExportJob> = new Map()
  private progressCallbacks: Map<string, (progress: number) => void> = new Map()

  async startExport(
    document: SemanticDocument,
    options: ExportOptions,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const jobId = crypto.randomUUID()
    
    const job: ExportJob = {
      id: jobId,
      documentId: document.id,
      documentTitle: document.title,
      format: options.format,
      status: 'pending',
      progress: 0,
      startTime: new Date().toISOString(),
      options,
      warnings: []
    }

    this.jobs.set(jobId, job)
    
    if (onProgress) {
      this.progressCallbacks.set(jobId, onProgress)
    }

    // Start background processing
    this.processExport(jobId, document, options)

    return jobId
  }

  private async processExport(
    jobId: string,
    document: SemanticDocument,
    options: ExportOptions
  ) {
    const job = this.jobs.get(jobId)!
    
    try {
      job.status = 'processing'
      this.updateProgress(jobId, 10)

      // Step 1: Generate layouts for all sections (always use print view)
      const layoutResults = new Map<string, LayoutResult>()
      let currentPageNumber = 1
      for (const section of document.sections) {
        const layout = generateLayout(section, currentPageNumber)
        layoutResults.set(section.id, layout)
        currentPageNumber += layout.totalPages
      }
      this.updateProgress(jobId, 30)

      // Step 2: Run preflight checks
      const preflight = this.runPreflightChecks(document, layoutResults)
      job.warnings = preflight.warnings
      this.updateProgress(jobId, 40)

      // Step 3: Prepare export data
      const exportData = this.prepareExportData(document, layoutResults, options)
      this.updateProgress(jobId, 60)

      // Step 4: Format-specific export
      let result
      switch (options.format) {
        case 'pdf':
          result = await this.exportToPDF(exportData, options)
          break
        case 'docx':
          result = await this.exportToDOCX(exportData, options)
          break
        case 'google-docs':
          result = await this.exportToGoogleDocs(exportData, options)
          break
      }
      this.updateProgress(jobId, 90)

      // Step 5: Finalize
      job.status = 'completed'
      job.endTime = new Date().toISOString()
      job.result = result
      this.updateProgress(jobId, 100)

    } catch (error) {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      job.endTime = new Date().toISOString()
      console.error('Export failed:', error)
    }
  }

  private updateProgress(jobId: string, progress: number) {
    const job = this.jobs.get(jobId)
    if (job) {
      job.progress = progress
      const callback = this.progressCallbacks.get(jobId)
      callback?.(progress)
    }
  }

  runPreflightChecks(
    document: SemanticDocument,
    layoutResults: Map<string, LayoutResult>
  ): PreflightResult {
    const warnings: ExportWarning[] = []
    let pageCount = 0
    let figureCount = 0
    let tableCount = 0  
    let footnoteCount = 0

    // Count pages from all sections
    layoutResults.forEach(layout => {
      pageCount += layout.totalPages
    })

    // Analyze all blocks for issues
    document.sections.forEach(section => {
      section.flows.forEach(flow => {
        flow.blocks.forEach(block => {
          switch (block.type) {
            case 'figure':
              figureCount++
              if (!block.content?.altText) {
                warnings.push({
                  type: 'missing-alt-text',
                  blockId: block.id,
                  blockType: block.type,
                  message: 'Figure is missing alt text',
                  severity: 'warning'
                })
              }
              if (!block.content?.caption) {
                warnings.push({
                  type: 'missing-caption',
                  blockId: block.id,
                  blockType: block.type,
                  message: 'Figure is missing caption',
                  severity: 'info'
                })
              }
              break

            case 'table':
              tableCount++
              if (!block.content?.headers?.length) {
                warnings.push({
                  type: 'no-table-header',
                  blockId: block.id,
                  blockType: block.type,
                  message: 'Table has no header row',
                  severity: 'warning'
                })
              }
              if (block.content?.rows?.length > 50) {
                warnings.push({
                  type: 'large-table',
                  blockId: block.id,
                  blockType: block.type,
                  message: 'Large table may not export well',
                  severity: 'info'
                })
              }
              break

            case 'footnote':
              footnoteCount++
              break
          }
        })
      })
    })

    return {
      pageCount,
      figureCount,
      tableCount,
      footnoteCount,
      warnings,
      canExport: !warnings.some(w => w.severity === 'error')
    }
  }

  private prepareExportData(
    document: SemanticDocument,
    layoutResults: Map<string, LayoutResult>,
    options: ExportOptions
  ) {
    // Filter sections based on scope
    let sectionsToExport = document.sections

    if (options.scope === 'sections' && options.selectedSections) {
      sectionsToExport = document.sections.filter(s => 
        options.selectedSections!.includes(s.id)
      )
    }

    // Generate TOC if needed
    let tocEntries: TOCEntry[] = []
    const hasTOCBlock = document.sections.some(section =>
      section.flows.some(flow =>
        flow.blocks.some(block => block.type === 'table-of-contents')
      )
    )

    if ((options.includeTOC && hasTOCBlock) || options.generateTOC) {
      tocEntries = generateTOC(document, layoutResults, {
        ...defaultTOCConfig,
        showPageNumbers: true // Always show page numbers in exports
      })
    }

    return {
      document,
      sections: sectionsToExport,
      layoutResults,
      tocEntries,
      pageCount: Array.from(layoutResults.values()).reduce((sum, layout) => sum + layout.totalPages, 0)
    }
  }

  private async exportToPDF(exportData: any, options: ExportOptions) {
    const { pdfExporter } = await import('./export-formats/pdf-exporter')
    return await pdfExporter.export(exportData, options)
  }

  private async exportToDOCX(exportData: any, options: ExportOptions) {
    const { docxExporter } = await import('./export-formats/docx-exporter')  
    return await docxExporter.export(exportData, options)
  }

  private async exportToGoogleDocs(exportData: any, options: ExportOptions) {
    const { googleDocsExporter } = await import('./export-formats/google-docs-exporter')
    return await googleDocsExporter.export(exportData, options)
  }

  getJob(jobId: string): ExportJob | undefined {
    return this.jobs.get(jobId)
  }

  getJobsByDocument(documentId: string): ExportJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.documentId === documentId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 5) // Last 5 jobs
  }

  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId)
    if (job && job.status === 'processing') {
      job.status = 'failed'
      job.error = 'Cancelled by user'
      job.endTime = new Date().toISOString()
      return true
    }
    return false
  }
}

// Global export engine instance
export const exportEngine = new ExportEngine()