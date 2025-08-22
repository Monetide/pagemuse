import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ShieldCheck, ShieldAlert, AlertTriangle, Info, Loader2 } from 'lucide-react'
import { useValidation } from '@/contexts/ValidationContext'
import { useDocumentModel } from '@/hooks/useDocumentModel'

export const ValidationButton = () => {
  const { issues, isValidating, runValidation, setValidationPanelOpen, lastValidated } = useValidation()
  const { document } = useDocumentModel()

  const errorCount = issues.filter(issue => issue.severity === 'error').length
  const warningCount = issues.filter(issue => issue.severity === 'warning').length
  const infoCount = issues.filter(issue => issue.severity === 'info').length
  const totalIssues = errorCount + warningCount + infoCount

  const handleValidate = () => {
    if (document) {
      runValidation(document)
    }
    setValidationPanelOpen(true)
  }

  const getIcon = () => {
    if (isValidating) {
      return <Loader2 className="w-4 h-4 animate-spin" />
    }
    
    if (errorCount > 0) {
      return <ShieldAlert className="w-4 h-4 text-destructive" />
    }
    
    if (warningCount > 0) {
      return <AlertTriangle className="w-4 h-4 text-warning" />
    }
    
    if (totalIssues === 0 && lastValidated) {
      return <ShieldCheck className="w-4 h-4 text-success" />
    }
    
    return <ShieldCheck className="w-4 h-4" />
  }

  const getTooltipText = () => {
    if (isValidating) {
      return 'Running validation...'
    }
    
    if (totalIssues === 0 && lastValidated) {
      return `No issues found • Last validated ${lastValidated.toLocaleTimeString()}`
    }
    
    if (totalIssues > 0) {
      const parts = []
      if (errorCount > 0) parts.push(`${errorCount} error${errorCount !== 1 ? 's' : ''}`)
      if (warningCount > 0) parts.push(`${warningCount} warning${warningCount !== 1 ? 's' : ''}`)
      if (infoCount > 0) parts.push(`${infoCount} info`)
      return parts.join(', ')
    }
    
    return 'Click to validate document'
  }

  const getBadgeText = () => {
    if (isValidating) return '...'
    if (totalIssues === 0) return '✓'
    if (errorCount > 0) return errorCount.toString()
    if (warningCount > 0) return warningCount.toString()
    return totalIssues.toString()
  }

  const getBadgeVariant = () => {
    if (errorCount > 0) return 'destructive'
    if (warningCount > 0) return 'secondary'
    if (totalIssues === 0 && lastValidated) return 'outline'
    return 'secondary'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleValidate}
            disabled={isValidating || !document}
            className="relative gap-2"
          >
            {getIcon()}
            Validate
            {(totalIssues > 0 || (totalIssues === 0 && lastValidated)) && (
              <Badge 
                variant={getBadgeVariant() as any}
                className="ml-1 min-w-[20px] h-5 text-xs"
              >
                {getBadgeText()}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}