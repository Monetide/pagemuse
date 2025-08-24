import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Zap, 
  RefreshCw,
  Eye,
  Wrench
} from 'lucide-react'
import { toast } from 'sonner'
import type { SeedFormData } from '@/components/admin/SeedForm'
import { 
  checkTemplateQuality, 
  applyQualityFixes, 
  type QualityReport, 
  type QualityIssue,
  type QualityFix 
} from '@/lib/quality-checker'

interface QualityCheckerProps {
  seedData?: SeedFormData
  onFixesApplied?: (updatedData: SeedFormData) => void
  className?: string
}

export function QualityChecker({ 
  seedData, 
  onFixesApplied, 
  className = '' 
}: QualityCheckerProps) {
  const [report, setReport] = useState<QualityReport | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isApplyingFixes, setIsApplyingFixes] = useState(false)
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set())

  // Run quality check when seedData changes
  useEffect(() => {
    if (seedData) {
      setIsChecking(true)
      // Simulate async check with small delay for UX
      setTimeout(() => {
        const newReport = checkTemplateQuality(seedData)
        setReport(newReport)
        setIsChecking(false)
      }, 300)
    } else {
      setReport(null)
    }
  }, [seedData])

  const handleApplyFixes = async () => {
    if (!report || !seedData || !onFixesApplied) return

    setIsApplyingFixes(true)
    try {
      const fixableFixes = report.fixes.filter(fix => 
        report.issues.find(issue => issue.id === fix.issueId)?.fixable
      )

      if (fixableFixes.length === 0) {
        toast.info('No fixable issues found')
        return
      }

      const updatedData = applyQualityFixes(seedData, fixableFixes)
      onFixesApplied(updatedData)
      
      toast.success(`Applied ${fixableFixes.length} fix${fixableFixes.length !== 1 ? 'es' : ''}`)
    } catch (error) {
      console.error('Error applying fixes:', error)
      toast.error('Failed to apply fixes')
    } finally {
      setIsApplyingFixes(false)
    }
  }

  const handleRunCheck = () => {
    if (seedData) {
      setIsChecking(true)
      setTimeout(() => {
        const newReport = checkTemplateQuality(seedData)
        setReport(newReport)
        setIsChecking(false)
      }, 300)
    }
  }

  const toggleIssueExpanded = (issueId: string) => {
    const newExpanded = new Set(expandedIssues)
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId)
    } else {
      newExpanded.add(issueId)
    }
    setExpandedIssues(newExpanded)
  }

  const getIssueIcon = (issue: QualityIssue) => {
    switch (issue.type) {
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />
      default:
        return <AlertTriangle className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'contrast': return 'bg-red-100 text-red-800 border-red-200'
      case 'typography': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'layout': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'assets': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!seedData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Quality Checker
          </CardTitle>
          <CardDescription>
            Validates template for accessibility and best practices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Configure your template to run quality checks
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Quality Checker
          {report && (
            <Badge 
              variant={report.isPassing ? "default" : "destructive"}
              className="ml-auto"
            >
              {report.isPassing ? 'PASS' : 'NEEDS FIXES'}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Automated validation and accessibility compliance
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRunCheck}
            disabled={isChecking}
          >
            {isChecking ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Eye className="w-4 h-4 mr-2" />
            )}
            Run Check
          </Button>
          
          {report && report.fixes.length > 0 && (
            <Button 
              variant="default" 
              size="sm"
              onClick={handleApplyFixes}
              disabled={isApplyingFixes || report.isPassing}
            >
              {isApplyingFixes ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Apply Auto-Fixes ({report.fixes.filter(f => 
                report.issues.find(i => i.id === f.issueId)?.fixable
              ).length})
            </Button>
          )}
        </div>

        {isChecking && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Running quality checks...</div>
            <Progress value={66} className="h-2" />
          </div>
        )}

        {report && (
          <div className="space-y-4">
            {/* Score */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <div className="font-medium">Quality Score</div>
                <div className="text-sm text-muted-foreground">
                  {report.issues.filter(i => i.type === 'error').length} errors, {' '}
                  {report.issues.filter(i => i.type === 'warning').length} warnings
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  report.score >= 80 ? 'text-green-600' : 
                  report.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {report.score}%
                </div>
                <Progress 
                  value={report.score} 
                  className="w-20 h-2"
                />
              </div>
            </div>

            {/* Issues */}
            {report.issues.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Issues Found</h4>
                <ScrollArea className="max-h-80">
                  <div className="space-y-2 pr-4">
                    {report.issues.map((issue) => {
                      const fix = report.fixes.find(f => f.issueId === issue.id)
                      const isExpanded = expandedIssues.has(issue.id)
                      
                      return (
                        <div 
                          key={issue.id}
                          className="border rounded-lg p-3 space-y-2"
                        >
                          <div 
                            className="flex items-start gap-2 cursor-pointer"
                            onClick={() => toggleIssueExpanded(issue.id)}
                          >
                            {getIssueIcon(issue)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{issue.title}</span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getCategoryColor(issue.category)}`}
                                >
                                  {issue.category}
                                </Badge>
                                {issue.fixable && (
                                  <Badge variant="outline" className="text-xs">
                                    <Wrench className="w-3 h-3 mr-1" />
                                    Fixable
                                  </Badge>
                                )}
                              </div>
                              {!isExpanded && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                  {issue.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="pl-6 space-y-2">
                              <p className="text-sm text-muted-foreground">
                                {issue.description}
                              </p>
                              
                              {(issue.currentValue || issue.expectedValue) && (
                                <div className="flex gap-4 text-xs">
                                  {issue.currentValue && (
                                    <div>
                                      <span className="text-muted-foreground">Current: </span>
                                      <span className="font-mono">{issue.currentValue}</span>
                                    </div>
                                  )}
                                  {issue.expectedValue && (
                                    <div>
                                      <span className="text-muted-foreground">Expected: </span>
                                      <span className="font-mono">{issue.expectedValue}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {fix && (
                                <div className="text-xs p-2 bg-muted/50 rounded">
                                  <div className="font-medium">Auto-fix available:</div>
                                  <div className="text-muted-foreground">{fix.description}</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-800">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">All quality checks passed!</span>
              </div>
            )}

            {/* Summary */}
            <div className="text-xs text-muted-foreground">
              Last checked: {new Date().toLocaleTimeString()}
              {' • '}
              {report.fixes.length > 0 && (
                <>
                  {report.fixes.filter(f => report.issues.find(i => i.id === f.issueId)?.fixable).length} auto-fixes available
                  {' • '}
                </>
              )}
              WCAG AA compliance: {report.isPassing ? 'Passing' : 'Failing'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default QualityChecker