import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { SemanticDocument } from '@/lib/document-model'
import { ImportMode } from '@/components/import/ImportDialog'
import { ingestFile } from '@/lib/ingest-pipeline'
import { mapIRToPageMuse } from '@/lib/ir-mapper'

export const useImport = () => {
  const [isImporting, setIsImporting] = useState(false)
  const { toast } = useToast()

  const importFiles = useCallback(async (
    files: File[], 
    mode: ImportMode,
    currentDocument?: SemanticDocument,
    onCreateDocument?: (title: string, document: SemanticDocument) => void,
    onUpdateDocument?: (updatedDocument: SemanticDocument) => void
  ) => {
    setIsImporting(true)

    try {
      let combinedDocument: SemanticDocument | null = null
      
      // Process all files through the ingest pipeline
      for (const file of files) {
        const irDoc = await ingestFile(file, {
          preserveFormatting: true,
          extractAssets: false,
          generateAnchors: true,
          mergeShortParagraphs: true
        })
        
        const pageMuseDoc = mapIRToPageMuse(irDoc)
        
        if (!combinedDocument) {
          combinedDocument = pageMuseDoc
        } else {
          // Merge multiple documents
          combinedDocument = {
            ...combinedDocument,
            title: `Combined Import (${files.length} files)`,
            sections: [
              ...combinedDocument.sections,
              ...pageMuseDoc.sections.map(section => ({
                ...section,
                id: `${section.id}-${Date.now()}`,
                order: combinedDocument!.sections.length + section.order
              }))
            ]
          }
        }
      }

      if (!combinedDocument) {
        throw new Error('No documents were successfully processed')
      }

      // Apply import mode
      switch (mode) {
        case 'new-document':
          onCreateDocument?.(combinedDocument.title, combinedDocument)
          break

        case 'append-section':
        case 'insert-section':
          if (!currentDocument || !onUpdateDocument) {
            throw new Error('Current document is required for this import mode')
          }

          const updatedDocument = {
            ...currentDocument,
            sections: [...currentDocument.sections, ...combinedDocument.sections]
          }
          
          onUpdateDocument(updatedDocument)
          break

        case 'replace-document':
          if (!currentDocument || !onUpdateDocument) {
            throw new Error('Current document is required for this import mode')
          }

          const replacedDocument = {
            ...currentDocument,
            title: combinedDocument.title,
            sections: combinedDocument.sections
          }
          
          onUpdateDocument(replacedDocument)
          break
      }

      toast({
        title: "Import Successful",
        description: `Successfully imported ${files.length} file${files.length !== 1 ? 's' : ''} using IR pipeline`
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
  }, [toast])

  return {
    importFiles,
    isImporting
  }
}