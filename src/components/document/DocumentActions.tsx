import React, { useState } from 'react'
import { MoreHorizontal, History, Undo2, Import, Download, Share, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ImportHistoryDialog } from './ImportHistoryDialog'
import { useImportHistory } from '@/hooks/useImportHistory'
import { ImportCommit } from '@/lib/import-history'
import { SemanticDocument } from '@/lib/document-model'

interface DocumentActionsProps {
  documentId?: string
  onImport?: () => void
  onExport?: () => void
  onShare?: () => void
  onSettings?: () => void
  onUndo?: (document: SemanticDocument | null) => void
  onRerunImport?: (commit: ImportCommit) => void
}

export const DocumentActions: React.FC<DocumentActionsProps> = ({
  documentId,
  onImport,
  onExport,
  onShare,
  onSettings,
  onUndo,
  onRerunImport
}) => {
  const [showHistory, setShowHistory] = useState(false)
  const { commits, isUndoing, undoLatestImport } = useImportHistory(documentId)

  const handleUndo = async (commitId: string) => {
    const restoredDocument = await undoLatestImport(commitId)
    onUndo?.(restoredDocument)
  }

  const handleRerunImport = (commit: ImportCommit) => {
    setShowHistory(false)
    onRerunImport?.(commit)
  }

  const hasImportHistory = commits.length > 0
  const canUndo = commits.some(c => c.canUndo && !c.undoCompleted)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          {onImport && (
            <DropdownMenuItem onClick={onImport}>
              <Import className="w-4 h-4 mr-2" />
              Import Content
            </DropdownMenuItem>
          )}
          
          {hasImportHistory && (
            <>
              <DropdownMenuItem onClick={() => setShowHistory(true)}>
                <History className="w-4 h-4 mr-2" />
                Import History
              </DropdownMenuItem>
              
              {canUndo && (
                <DropdownMenuItem 
                  onClick={() => handleUndo(commits[commits.length - 1]?.id)}
                  disabled={isUndoing}
                >
                  <Undo2 className="w-4 h-4 mr-2" />
                  {isUndoing ? 'Undoing...' : 'Undo Last Import'}
                </DropdownMenuItem>
              )}
            </>
          )}

          <DropdownMenuSeparator />
          
          {onExport && (
            <DropdownMenuItem onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </DropdownMenuItem>
          )}
          
          {onShare && (
            <DropdownMenuItem onClick={onShare}>
              <Share className="w-4 h-4 mr-2" />
              Share
            </DropdownMenuItem>
          )}
          
          {onSettings && (
            <DropdownMenuItem onClick={onSettings}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {documentId && (
        <ImportHistoryDialog
          open={showHistory}
          onOpenChange={setShowHistory}
          documentId={documentId}
          commits={commits}
          onUndo={handleUndo}
          onRerunImport={handleRerunImport}
          isUndoing={isUndoing}
        />
      )}
    </>
  )
}