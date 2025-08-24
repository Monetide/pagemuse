import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sparkles, Loader2 } from 'lucide-react'
import { useValidation } from '@/contexts/ValidationContext'
import { useDocumentModel } from '@/hooks/useDocumentModel'
import { polishEngine, PolishReport } from '@/lib/polish-engine'
import { PolishReportDialog } from './PolishReportDialog'

export const PolishButton = () => {
  const { issues, isValidating } = useValidation()
  const { document, setDocument } = useDocumentModel()
  const [isPolishing, setIsPolishing] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [lastReport, setLastReport] = useState<PolishReport | null>(null)

  const autoFixableCount = issues.filter(issue => 
    issue.canFix && 
    ['table-without-header', 'stranded-heading', 'figure-without-caption', 'min-font-size', 'low-contrast-auto', 'excessive-hyphenation'].includes(issue.ruleId)
  ).length

  const handlePolish = async () => {
    if (!document || isPolishing) return

    setIsPolishing(true)
    
    try {
      const { document: polishedDocument, report } = await polishEngine.runOneClickPolish(document)
      
      if (report.appliedFixes.length > 0) {
        setDocument(polishedDocument)
      }
      
      setLastReport(report)
      setShowReport(true)
    } catch (error) {
      console.error('Polish failed:', error)
    } finally {
      setIsPolishing(false)
    }
  }

  const getTooltipText = () => {
    if (isPolishing) {
      return 'Applying automatic fixes...'
    }
    
    if (autoFixableCount === 0) {
      return 'No auto-fixable issues found'
    }
    
    return `Apply ${autoFixableCount} automatic fix${autoFixableCount !== 1 ? 'es' : ''}`
  }

  const isDisabled = isPolishing || isValidating || !document || autoFixableCount === 0

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePolish}
              disabled={isDisabled}
              className="relative gap-2"
            >
              {isPolishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Polish
              {autoFixableCount > 0 && (
                <Badge 
                  variant="secondary"
                  className="ml-1 min-w-[20px] h-5 text-xs"
                >
                  {autoFixableCount}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {lastReport && (
        <PolishReportDialog
          open={showReport}
          onClose={() => setShowReport(false)}
          report={lastReport}
          document={document}
          onUndo={(action) => {
            if (document) {
              const undoneDocument = polishEngine.undoFix(document, action)
              if (undoneDocument) {
                setDocument(undoneDocument)
              }
            }
          }}
        />
      )}
    </>
  )
}