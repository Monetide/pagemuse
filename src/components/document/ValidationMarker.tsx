import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AlertTriangle, Info, ShieldAlert, Wrench } from 'lucide-react'
import { ValidationIssue } from '@/lib/validation-engine'
import { useValidation } from '@/contexts/ValidationContext'
import { useDocumentModel } from '@/hooks/useDocumentModel'

interface ValidationMarkerProps {
  issue: ValidationIssue
  className?: string
}

export const ValidationMarker = ({ issue, className }: ValidationMarkerProps) => {
  const { setValidationPanelOpen, setSelectedIssue, fixIssue } = useValidation()
  const { document } = useDocumentModel()

  const getSeverityIcon = () => {
    switch (issue.severity) {
      case 'error': return <ShieldAlert className="w-3 h-3 text-destructive" />
      case 'warning': return <AlertTriangle className="w-3 h-3 text-warning" />
      case 'info': return <Info className="w-3 h-3 text-info" />
      default: return <Info className="w-3 h-3" />
    }
  }

  const getSeverityColor = () => {
    switch (issue.severity) {
      case 'error': return 'border-destructive bg-destructive/10'
      case 'warning': return 'border-warning bg-warning/10'
      case 'info': return 'border-info bg-info/10'
      default: return 'border-muted bg-muted/10'
    }
  }

  const handleClick = () => {
    setSelectedIssue(issue)
    setValidationPanelOpen(true)
  }

  const handleQuickFix = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!document || !issue.canFix) return
    
    const updatedDocument = fixIssue(document, issue)
    if (updatedDocument) {
      console.log('Quick fixed issue:', issue.id)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            className={`absolute z-10 border-2 rounded-md p-1 hover:scale-110 transition-transform ${getSeverityColor()} ${className}`}
            style={{ 
              left: '-12px', 
              top: '50%', 
              transform: 'translateY(-50%)'
            }}
          >
            {getSeverityIcon()}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-sm">
          <div className="space-y-2">
            <div className="font-medium text-sm">{issue.message}</div>
            {issue.description && (
              <div className="text-xs text-muted-foreground">{issue.description}</div>
            )}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClick}
                className="h-6 px-2 text-xs"
              >
                View details
              </Button>
              {issue.canFix && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuickFix}
                  className="h-6 px-2 text-xs"
                >
                  <Wrench className="w-3 h-3 mr-1" />
                  {issue.fixLabel || 'Fix'}
                </Button>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}