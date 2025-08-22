import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, Info, ShieldAlert, MapPin, Wrench, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { useValidation } from '@/contexts/ValidationContext'
import { useDocumentModel } from '@/hooks/useDocumentModel'
import { ValidationIssue } from '@/lib/validation-engine'

export const ValidationPanel = () => {
  const {
    issues,
    isValidating,
    lastValidated,
    isValidationPanelOpen,
    setValidationPanelOpen,
    selectedIssue,
    setSelectedIssue,
    filterSeverity,
    setFilterSeverity,
    runValidation,
    fixIssue,
    ignoreIssue,
    ignoreRule
  } = useValidation()
  
  const { document } = useDocumentModel()
  const [searchQuery, setSearchQuery] = useState('')

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <ShieldAlert className="w-4 h-4 text-destructive" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />
      case 'info': return <Info className="w-4 h-4 text-info" />
      default: return <Info className="w-4 h-4" />
    }
  }

  const filteredIssues = issues.filter(issue => {
    const matchesSeverity = filterSeverity === 'all' || issue.severity === filterSeverity
    const matchesSearch = !searchQuery || 
      issue.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.snippet?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSeverity && matchesSearch
  })

  const groupedIssues = filteredIssues.reduce((groups, issue) => {
    const key = issue.ruleId
    if (!groups[key]) {
      groups[key] = {
        rule: issue.ruleId,
        name: issue.ruleId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        issues: []
      }
    }
    groups[key].issues.push(issue)
    return groups
  }, {} as Record<string, { rule: string; name: string; issues: ValidationIssue[] }>)

  const handleFix = (issue: ValidationIssue) => {
    if (!document) return
    const updatedDocument = fixIssue(document, issue)
    if (updatedDocument) {
      // Document would be updated through the document model hook
      console.log('Fixed issue:', issue.id)
    }
  }

  const handleGoTo = (issue: ValidationIssue) => {
    // This would scroll to and highlight the block
    console.log('Go to issue:', issue)
    setSelectedIssue(issue)
  }

  const errorCount = issues.filter(i => i.severity === 'error').length
  const warningCount = issues.filter(i => i.severity === 'warning').length
  const infoCount = issues.filter(i => i.severity === 'info').length

  return (
    <Sheet open={isValidationPanelOpen} onOpenChange={setValidationPanelOpen}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Document Validation
            <Button
              variant="outline"
              size="sm"
              onClick={() => document && runValidation(document)}
              disabled={isValidating}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
              Re-run
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          <div className="space-y-4 pb-4">
            <Input
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <Tabs value={filterSeverity} onValueChange={(value: any) => setFilterSeverity(value)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({issues.length})</TabsTrigger>
                <TabsTrigger value="error">Errors ({errorCount})</TabsTrigger>
                <TabsTrigger value="warning">Warnings ({warningCount})</TabsTrigger>
                <TabsTrigger value="info">Info ({infoCount})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-6">
              {Object.values(groupedIssues).map(group => (
                <div key={group.rule} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{group.name}</h3>
                    <Badge variant="outline">{group.issues.length}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {group.issues.map(issue => (
                      <div
                        key={issue.id}
                        className={`border rounded-lg p-3 space-y-2 ${
                          selectedIssue?.id === issue.id ? 'ring-2 ring-primary' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2 flex-1">
                            {getSeverityIcon(issue.severity)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{issue.message}</p>
                              {issue.snippet && (
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                  {issue.snippet}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGoTo(issue)}
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            Go to
                          </Button>
                          
                          {issue.canFix && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleFix(issue)}
                            >
                              <Wrench className="w-3 h-3 mr-1" />
                              {issue.fixLabel || 'Fix'}
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => ignoreIssue(issue.id)}
                          >
                            <EyeOff className="w-3 h-3 mr-1" />
                            Ignore
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {filteredIssues.length === 0 && !isValidating && (
                <div className="text-center py-8 text-muted-foreground">
                  {issues.length === 0 ? 'No issues found' : 'No issues match your filters'}
                </div>
              )}
            </div>
          </ScrollArea>

          <Separator className="my-4" />
          
          <div className="text-xs text-muted-foreground">
            {lastValidated && `Last validated: ${lastValidated.toLocaleTimeString()}`}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}