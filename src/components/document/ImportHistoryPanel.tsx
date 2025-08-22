import React from 'react'
import { Clock, FileText, AlertTriangle, Undo2, RotateCcw, Download, Users, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ImportCommit, ImportWarning } from '@/lib/import-history'
import { formatDistance } from 'date-fns'

interface ImportHistoryPanelProps {
  documentId: string
  commits: ImportCommit[]
  onUndo: (commitId: string) => void
  onRerunImport: (commit: ImportCommit) => void
  isUndoing?: boolean
}

export const ImportHistoryPanel: React.FC<ImportHistoryPanelProps> = ({
  documentId,
  commits,
  onUndo,
  onRerunImport,
  isUndoing = false
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getWarningIcon = (warning: ImportWarning) => {
    switch (warning.severity) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-destructive" />
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-warning" />
      default:
        return <AlertTriangle className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getWarningColor = (severity: ImportWarning['severity']) => {
    switch (severity) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (commits.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Import History
          </CardTitle>
          <CardDescription>
            No import operations have been performed on this document yet.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Import History
        </CardTitle>
        <CardDescription>
          {commits.length} import operation{commits.length !== 1 ? 's' : ''} performed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {commits.map((commit, index) => (
              <div key={commit.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{commit.importSummary.sourceFileName}</span>
                      <Badge variant="outline">
                        {formatFileSize(commit.importSummary.sourceFileSize)}
                      </Badge>
                      {commit.undoCompleted && (
                        <Badge variant="secondary">Undone</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDistance(new Date(commit.importSummary.timestamp), new Date(), { addSuffix: true })}
                      </span>
                      <span>{commit.importSummary.processingTimeMs}ms</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRerunImport(commit)}
                      className="flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Re-run
                    </Button>
                    {commit.canUndo && !commit.undoCompleted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUndo(commit.id)}
                        disabled={isUndoing}
                        className="flex items-center gap-1"
                      >
                        <Undo2 className="w-3 h-3" />
                        {isUndoing ? 'Undoing...' : 'Undo'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Import Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm font-medium">{commit.importSummary.pagesProcessed}</div>
                    <div className="text-xs text-muted-foreground">Pages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{commit.importSummary.sectionsCreated}</div>
                    <div className="text-xs text-muted-foreground">Sections</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{commit.importSummary.blocksCreated}</div>
                    <div className="text-xs text-muted-foreground">Blocks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{commit.importSummary.assetsImported}</div>
                    <div className="text-xs text-muted-foreground">Assets</div>
                  </div>
                </div>

                {/* OCR Confidence */}
                {commit.importSummary.ocrConfidence && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">OCR Confidence:</span>
                    <Badge 
                      variant={commit.importSummary.ocrConfidence > 0.8 ? 'default' : 
                               commit.importSummary.ocrConfidence > 0.6 ? 'secondary' : 'destructive'}
                    >
                      {Math.round(commit.importSummary.ocrConfidence * 100)}%
                    </Badge>
                  </div>
                )}

                {/* Warnings */}
                {commit.importSummary.warnings.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      Warnings ({commit.importSummary.warnings.length})
                    </div>
                    <div className="space-y-1">
                      {commit.importSummary.warnings.map((warning, idx) => (
                        <Alert key={idx} className="py-2">
                          <div className="flex items-start gap-2">
                            {getWarningIcon(warning)}
                            <AlertDescription className="text-sm">
                              <div className="flex items-center gap-2">
                                <span>{warning.message}</span>
                                <Badge variant={getWarningColor(warning.severity)} className="text-xs">
                                  {warning.severity}
                                </Badge>
                              </div>
                            </AlertDescription>
                          </div>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {index < commits.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}