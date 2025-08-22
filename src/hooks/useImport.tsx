import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { SemanticDocument } from '@/lib/document-model'
import { ImportMode } from '@/components/import/ImportDialog'
import { ingestFile } from '@/lib/ingest-pipeline'
import { mapIRToPageMuse } from '@/lib/ir-mapper'
import { PDFProcessingOptions, processPDFFile } from '@/lib/pdf-processor'
import { PDFProcessingDialog } from '@/components/import/PDFProcessingDialog'
import { IRDocument } from '@/lib/ir-types'

export const useImport = () => {
  const [isImporting, setIsImporting] = useState(false)
  const [showPDFDialog, setShowPDFDialog] = useState(false)
  const [pendingPDFFile, setPendingPDFFile] = useState<File | null>(null)
  const [pendingHandlers, setPendingHandlers] = useState<{
    mode: ImportMode,
    currentDocument?: SemanticDocument,
    onCreateDocument?: (title: string, document: SemanticDocument) => void,
    onUpdateDocument?: (updatedDocument: SemanticDocument) => void
  } | null>(null)
  const { toast } = useToast()

  const importFiles = useCallback(async (
    files: File[], 
    mode: ImportMode,
    currentDocument?: SemanticDocument,
    onCreateDocument?: (title: string, document: SemanticDocument) => void,
    onUpdateDocument?: (updatedDocument: SemanticDocument) => void
  ) => {
    // Check for PDF files
    const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
    
    if (pdfFiles.length === 1 && files.length === 1) {
      setPendingPDFFile(pdfFiles[0])
      setPendingHandlers({ mode, currentDocument, onCreateDocument, onUpdateDocument })
      setShowPDFDialog(true)
      return
    }

    await processFiles(files, mode, currentDocument, onCreateDocument, onUpdateDocument)
  }, [])

  const processPDFWithOptions = useCallback(async (options: PDFProcessingOptions) => {
    if (!pendingPDFFile || !pendingHandlers) return
    
    setIsImporting(true)
    try {
      const irDoc = await processPDFFile(pendingPDFFile, options)
      const pageMuseDoc = mapIRToPageMuse(irDoc)
      
      // Apply import mode
      const { mode, currentDocument, onCreateDocument, onUpdateDocument } = pendingHandlers
      
      switch (mode) {
        case 'new-document':
          onCreateDocument?.(pageMuseDoc.title, pageMuseDoc)
          break
        case 'append-section':
          if (currentDocument && onUpdateDocument) {
            onUpdateDocument({
              ...currentDocument,
              sections: [...currentDocument.sections, ...pageMuseDoc.sections]
            })
          }
          break
      }
      
      toast({
        title: "PDF Import Successful",
        description: `Successfully imported ${pendingPDFFile.name}`
      })
      
    } catch (error) {
      toast({
        title: "PDF Import Failed",
        description: error instanceof Error ? error.message : "Failed to process PDF",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
      setPendingPDFFile(null)
      setPendingHandlers(null)
      setShowPDFDialog(false)
    }
  }, [pendingPDFFile, pendingHandlers, toast])

  const processFiles = useCallback(async (
    files: File[], 
    mode: ImportMode,
    currentDocument?: SemanticDocument,
    onCreateDocument?: (title: string, document: SemanticDocument) => void,
    onUpdateDocument?: (updatedDocument: SemanticDocument) => void
  ) => {
    setIsImporting(true)

    try {
      let combinedDocument: SemanticDocument | null = null
      
      for (const file of files) {
        const irDoc = await ingestFile(file)
        const pageMuseDoc = mapIRToPageMuse(irDoc)
        
        if (!combinedDocument) {
          combinedDocument = pageMuseDoc
        } else {
          combinedDocument = {
            ...combinedDocument,
            sections: [...combinedDocument.sections, ...pageMuseDoc.sections]
          }
        }
      }

      if (!combinedDocument) throw new Error('No documents processed')

      switch (mode) {
        case 'new-document':
          onCreateDocument?.(combinedDocument.title, combinedDocument)
          break
        case 'append-section':
          if (currentDocument && onUpdateDocument) {
            onUpdateDocument({
              ...currentDocument,
              sections: [...currentDocument.sections, ...combinedDocument.sections]
            })
          }
          break
      }

      toast({
        title: "Import Successful",
        description: `Successfully imported ${files.length} file${files.length !== 1 ? 's' : ''}`
      })

    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Import failed",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
    }
  }, [toast])

  return {
    importFiles,
    isImporting,
    PDFDialog: () => (
      <PDFProcessingDialog
        open={showPDFDialog}
        onOpenChange={setShowPDFDialog}
        fileName={pendingPDFFile?.name}
        onConfirm={processPDFWithOptions}
      />
    )
  }
}