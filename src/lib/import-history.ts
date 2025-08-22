// Import History and Commit System
import { SemanticDocument } from './document-model'

export interface ImportSummary {
  id: string
  documentId: string
  sourceFileName: string
  sourceFileSize: number
  timestamp: string
  pagesProcessed: number
  sectionsCreated: number
  blocksCreated: number
  assetsImported: number
  warnings: ImportWarning[]
  mappingConfig: any
  ocrConfidence?: number
  processingTimeMs: number
}

export interface ImportWarning {
  type: 'low-ocr-confidence' | 'missing-assets' | 'structure-unclear' | 'formatting-loss'
  message: string
  severity: 'low' | 'medium' | 'high'
  blockId?: string
}

export interface ImportCommit {
  id: string
  documentId: string
  importSummary: ImportSummary
  beforeSnapshot: SemanticDocument | null
  afterSnapshot: SemanticDocument
  canUndo: boolean
  undoCompleted?: boolean
  undoTimestamp?: string
}

export interface ImportHistoryState {
  commits: ImportCommit[]
  isUndoing: boolean
}

export class ImportHistoryManager {
  private commits: Map<string, ImportCommit[]> = new Map()

  // Create an import commit
  createCommit(
    documentId: string,
    beforeDocument: SemanticDocument | null,
    afterDocument: SemanticDocument,
    importSummary: ImportSummary
  ): ImportCommit {
    const commit: ImportCommit = {
      id: crypto.randomUUID(),
      documentId,
      importSummary,
      beforeSnapshot: beforeDocument,
      afterSnapshot: afterDocument,
      canUndo: true
    }

    const documentCommits = this.commits.get(documentId) || []
    documentCommits.push(commit)
    this.commits.set(documentId, documentCommits)

    return commit
  }

  // Get import history for a document
  getHistory(documentId: string): ImportCommit[] {
    return this.commits.get(documentId) || []
  }

  // Get the latest commit for a document
  getLatestCommit(documentId: string): ImportCommit | null {
    const commits = this.commits.get(documentId) || []
    return commits.length > 0 ? commits[commits.length - 1] : null
  }

  // Undo the latest import
  undoLatestImport(documentId: string): SemanticDocument | null {
    const commits = this.commits.get(documentId) || []
    const latestCommit = commits[commits.length - 1]

    if (!latestCommit || !latestCommit.canUndo || latestCommit.undoCompleted) {
      return null
    }

    // Mark as undone
    latestCommit.undoCompleted = true
    latestCommit.undoTimestamp = new Date().toISOString()

    // Return the before snapshot (could be null for fresh documents)
    return latestCommit.beforeSnapshot
  }

  // Generate import summary from processing results
  static generateSummary(
    documentId: string,
    sourceFile: File,
    beforeDocument: SemanticDocument | null,
    afterDocument: SemanticDocument,
    mappingConfig: any,
    processingTimeMs: number,
    warnings: ImportWarning[] = [],
    ocrConfidence?: number
  ): ImportSummary {
    const countBlocks = (doc: SemanticDocument): number => {
      return doc.sections.reduce((total, section) => {
        return total + section.flows.reduce((flowTotal, flow) => {
          return flowTotal + flow.blocks.length
        }, 0)
      }, 0)
    }

    const blocksAfter = countBlocks(afterDocument)
    const blocksBefore = beforeDocument ? countBlocks(beforeDocument) : 0
    const newBlocksCreated = blocksAfter - blocksBefore

    return {
      id: crypto.randomUUID(),
      documentId,
      sourceFileName: sourceFile.name,
      sourceFileSize: sourceFile.size,
      timestamp: new Date().toISOString(),
      pagesProcessed: 1, // TODO: Get actual page count from processing
      sectionsCreated: afterDocument.sections.length - (beforeDocument?.sections.length || 0),
      blocksCreated: newBlocksCreated,
      assetsImported: 0, // TODO: Count imported assets
      warnings,
      mappingConfig,
      ocrConfidence,
      processingTimeMs
    }
  }

  // Clear history for a document
  clearHistory(documentId: string): void {
    this.commits.delete(documentId)
  }

  // Get undo-able commits
  getUndoableCommits(documentId: string): ImportCommit[] {
    const commits = this.commits.get(documentId) || []
    return commits.filter(commit => commit.canUndo && !commit.undoCompleted)
  }
}

// Global instance
export const importHistoryManager = new ImportHistoryManager()