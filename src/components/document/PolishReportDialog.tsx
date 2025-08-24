import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, AlertCircle, Undo2, ExternalLink } from 'lucide-react'
import { PolishReport, PolishAction } from '@/lib/polish-engine'
import { SemanticDocument } from '@/lib/document-model'

interface PolishReportDialogProps {
  open: boolean
  onClose: () => void
  report: PolishReport
  document: SemanticDocument | null
  onUndo: (action: PolishAction) => void
}

export const PolishReportDialog = ({ 
  open, 
  onClose, 
  report, 
  document,
  onUndo 
}: PolishReportDialogProps) => {
  const handleUndoFix = (action: PolishAction) => {
    onUndo(action)
    // Mark action as undone in the report
    action.applied = false
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Polish Complete
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{report.fixedIssues}</div>
              <div className="text-sm text-muted-foreground">Fixed</div>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="text-center">
              <div className="text-2xl font-bold">{report.manualActions.length}</div>
              <div className="text-sm text-muted-foreground">Manual</div>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="text-center">
              <div className="text-2xl font-bold">{report.totalIssues}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="flex-1">
              <Badge 
                variant={report.success ? "default" : "secondary"}
                className="text-sm"
              >
                {report.success ? 'Document Ready' : 'Needs Manual Review'}
              </Badge>
            </div>
          </div>

          <ScrollArea className="h-96">
            <div className="space-y-4">
              {/* Applied Fixes */}
              {report.appliedFixes.length > 0 && (
                <div>
                  <h4 className="font-medium text-success mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Applied Fixes ({report.appliedFixes.length})
                  </h4>
                  <div className="space-y-2">
                    {report.appliedFixes.map((fix) => (
                      <div 
                        key={fix.id} 
                        className={`flex items-center justify-between p-3 rounded border ${
                          fix.applied ? 'bg-success/5 border-success/20' : 'bg-muted/30 border-border'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{fix.description}</div>
                          <div className="text-xs text-muted-foreground">Rule: {fix.ruleId}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={fix.applied ? "default" : "secondary"} className="text-xs">
                            {fix.applied ? 'Applied' : 'Undone'}
                          </Badge>
                          {fix.applied && fix.undoData && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUndoFix(fix)}
                              className="h-6 w-6 p-0"
                            >
                              <Undo2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Actions Needed */}
              {report.manualActions.length > 0 && (
                <div>
                  <h4 className="font-medium text-warning mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Manual Actions Needed ({report.manualActions.length})
                  </h4>
                  <div className="space-y-2">
                    {report.manualActions.map((action) => (
                      <div 
                        key={action.id} 
                        className="flex items-center justify-between p-3 rounded border bg-warning/5 border-warning/20"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{action.description}</div>
                          <div className="text-xs text-muted-foreground">Rule: {action.ruleId}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Issues */}
              {report.appliedFixes.length === 0 && report.manualActions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success" />
                  <p>No issues found. Your document is already polished!</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}