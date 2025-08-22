import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ImportHistoryPanel } from './ImportHistoryPanel'
import { ImportCommit } from '@/lib/import-history'

interface ImportHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  commits: ImportCommit[]
  onUndo: (commitId: string) => void
  onRerunImport: (commit: ImportCommit) => void
  isUndoing?: boolean
}

export const ImportHistoryDialog: React.FC<ImportHistoryDialogProps> = ({
  open,
  onOpenChange,
  documentId,
  commits,
  onUndo,
  onRerunImport,
  isUndoing = false
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Import History</DialogTitle>
          <DialogDescription>
            View and manage import operations for this document. You can undo imports or re-run them with different settings.
          </DialogDescription>
        </DialogHeader>
        
        <ImportHistoryPanel
          documentId={documentId}
          commits={commits}
          onUndo={onUndo}
          onRerunImport={onRerunImport}
          isUndoing={isUndoing}
        />
      </DialogContent>
    </Dialog>
  )
}