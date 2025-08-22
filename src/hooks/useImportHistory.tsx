import { useState, useCallback, useEffect } from 'react'
import { SemanticDocument } from '@/lib/document-model'
import { ImportCommit, ImportSummary, ImportWarning, ImportHistoryManager, importHistoryManager } from '@/lib/import-history'
import { useToast } from '@/hooks/use-toast'

export const useImportHistory = (documentId?: string) => {
  const [commits, setCommits] = useState<ImportCommit[]>([])
  const [isUndoing, setIsUndoing] = useState(false)
  const { toast } = useToast()

  // Load history when documentId changes
  useEffect(() => {
    if (documentId) {
      const history = importHistoryManager.getHistory(documentId)
      setCommits(history)
    } else {
      setCommits([])
    }
  }, [documentId])

  // Create a new import commit
  const commitImport = useCallback(async (
    docId: string,
    sourceFile: File,
    beforeDocument: SemanticDocument | null,
    afterDocument: SemanticDocument,
    mappingConfig: any,
    processingTimeMs: number,
    warnings: ImportWarning[] = [],
    ocrConfidence?: number
  ): Promise<ImportCommit> => {
    const importSummary = ImportHistoryManager.generateSummary(
      docId,
      sourceFile,
      beforeDocument,
      afterDocument,
      mappingConfig,
      processingTimeMs,
      warnings,
      ocrConfidence
    )

    const commit = importHistoryManager.createCommit(
      docId,
      beforeDocument,
      afterDocument,
      importSummary
    )

    // Update local state
    const updatedHistory = importHistoryManager.getHistory(docId)
    setCommits(updatedHistory)

    // Show success toast with summary
    toast({
      title: 'Import completed successfully',
      description: `${importSummary.sectionsCreated} sections, ${importSummary.blocksCreated} blocks created${warnings.length > 0 ? ` (${warnings.length} warnings)` : ''}`
    })

    return commit
  }, [toast])

  // Undo the latest import
  const undoLatestImport = useCallback(async (commitId: string): Promise<SemanticDocument | null> => {
    if (!documentId) return null

    setIsUndoing(true)
    
    try {
      const restoredDocument = importHistoryManager.undoLatestImport(documentId)
      
      // Update local state
      const updatedHistory = importHistoryManager.getHistory(documentId)
      setCommits(updatedHistory)

      toast({
        title: 'Import undone',
        description: 'The document has been restored to its previous state.'
      })

      return restoredDocument
    } catch (error) {
      console.error('Error undoing import:', error)
      toast({
        title: 'Undo failed',
        description: 'Could not undo the import operation.',
        variant: 'destructive'
      })
      return null
    } finally {
      setIsUndoing(false)
    }
  }, [documentId, toast])

  // Get import configuration for re-running
  const getImportConfig = useCallback((commitId: string) => {
    const commit = commits.find(c => c.id === commitId)
    return commit?.importSummary.mappingConfig || null
  }, [commits])

  // Clear history for current document
  const clearHistory = useCallback(() => {
    if (documentId) {
      importHistoryManager.clearHistory(documentId)
      setCommits([])
      toast({
        title: 'History cleared',
        description: 'Import history has been cleared for this document.'
      })
    }
  }, [documentId, toast])

  // Get the latest commit
  const getLatestCommit = useCallback((): ImportCommit | null => {
    return documentId ? importHistoryManager.getLatestCommit(documentId) : null
  }, [documentId])

  // Get undoable commits
  const getUndoableCommits = useCallback((): ImportCommit[] => {
    return documentId ? importHistoryManager.getUndoableCommits(documentId) : []
  }, [documentId])

  return {
    commits,
    isUndoing,
    commitImport,
    undoLatestImport,
    getImportConfig,
    clearHistory,
    getLatestCommit,
    getUndoableCommits
  }
}