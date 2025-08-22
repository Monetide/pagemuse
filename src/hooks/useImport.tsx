import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { SemanticDocument } from '@/lib/document-model'
import { ImportMode } from '@/components/import/ImportDialog'
import { ingestFile } from '@/lib/ingest-pipeline'
import { mapIRToPageMuse } from '@/lib/ir-mapper'
import { PDFProcessingOptions, processPDFFile } from '@/lib/pdf-processor'
import { PDFProcessingDialog } from '@/components/import/PDFProcessingDialog'
import { MappingWizard, MappingConfig } from '@/components/import/MappingWizard'
import { IRDocument } from '@/lib/ir-types'

export const useImport = () => {
  const [isImporting, setIsImporting] = useState(false)
  const [showPDFDialog, setShowPDFDialog] = useState(false)
  const [showMappingWizard, setShowMappingWizard] = useState(false)
  const [pendingPDFFile, setPendingPDFFile] = useState<File | null>(null)
  const [pendingIRDocument, setPendingIRDocument] = useState<IRDocument | null>(null)
  const [pendingFileName, setPendingFileName] = useState<string | null>(null)
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
      
      // Show mapping wizard instead of direct processing
      setPendingIRDocument(irDoc)
      setPendingFileName(pendingPDFFile.name)
      setShowPDFDialog(false)
      setShowMappingWizard(true)
      
    } catch (error) {
      toast({
        title: "PDF Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process PDF",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
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
      let combinedIRDocument: IRDocument | null = null
      
      for (const file of files) {
        const irDoc = await ingestFile(file)
        
        if (!combinedIRDocument) {
          combinedIRDocument = irDoc
        } else {
          // Combine IR documents
          combinedIRDocument = {
            ...combinedIRDocument,
            sections: [...combinedIRDocument.sections, ...irDoc.sections]
          }
        }
      }

      if (!combinedIRDocument) throw new Error('No documents processed')

      // Show mapping wizard instead of direct processing
      setPendingIRDocument(combinedIRDocument)
      setPendingFileName(files.length === 1 ? files[0].name : `${files.length} files`)
      setPendingHandlers({ mode, currentDocument, onCreateDocument, onUpdateDocument })
      setShowMappingWizard(true)

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

  const handleMappingConfirm = useCallback((config: MappingConfig, mappedDocument: SemanticDocument) => {
    if (!pendingHandlers) return
    
    const { mode, currentDocument, onCreateDocument, onUpdateDocument } = pendingHandlers
    
    try {
      switch (mode) {
        case 'new-document':
          onCreateDocument?.(mappedDocument.title, mappedDocument)
          break
        case 'append-section':
          if (currentDocument && onUpdateDocument) {
            onUpdateDocument({
              ...currentDocument,
              sections: [...currentDocument.sections, ...mappedDocument.sections]
            })
          }
          break
        case 'insert-at-cursor':
          // Handle cursor insertion
          if (currentDocument && onUpdateDocument) {
            // This would need cursor position context
            onUpdateDocument(mappedDocument)
          }
          break
        case 'replace-selection':
          // Handle selection replacement
          if (currentDocument && onUpdateDocument) {
            // This would need selection context
            onUpdateDocument(mappedDocument)
          }
          break
      }
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${pendingFileName} with custom mapping`
      })
      
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to apply mapping",
        variant: "destructive"
      })
    } finally {
      // Reset all state
      setPendingIRDocument(null)
      setPendingFileName(null)
      setPendingHandlers(null)
      setPendingPDFFile(null)
      setShowMappingWizard(false)
    }
  }, [pendingHandlers, pendingFileName, toast])

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
    ),
    MappingWizard: () => (
      <MappingWizard
        open={showMappingWizard}
        onOpenChange={setShowMappingWizard}
        irDocument={pendingIRDocument!}
        onConfirm={handleMappingConfirm}
        currentDocument={pendingHandlers?.currentDocument}
        fileName={pendingFileName || undefined}
      />
    )
  }
}