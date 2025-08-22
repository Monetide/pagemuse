import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ValidationPresetSelector } from '@/components/template/ValidationPresetSelector'
import { useValidationIntegration } from '@/hooks/useValidationIntegration'
import { 
  Shield, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  Zap,
  X,
  Eye,
  Settings,
  RefreshCw
} from 'lucide-react'

interface ValidationIntegratedPanelProps {
  documentId: string
  isOpen: boolean
  onClose: () => void
}

export function ValidationIntegratedPanel({ 
  documentId, 
  isOpen, 
  onClose 
}: ValidationIntegratedPanelProps) {
  const [activeTab, setActiveTab] = useState('issues')
  const { 
    validationReport, 
    activePreset, 
    loading,
    applyValidationPreset,
    runValidation,
    autoFixIssues,
    dismissIssue
  } = useValidationIntegration(documentId)

  const getSeverityColor = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error': return <Shield className="w-4 h-4" />
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      case 'info': return <Info className="w-4 h-4" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-lg z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <h2 className="font-semibold">Document Validation</h2>
          {validationReport && (
            <Badge variant={validationReport.errorCount > 0 ? "destructive" : "secondary"}>
              {validationReport.totalIssues} issues
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0">
            <TabsContent value="issues" className="h-full m-0 p-4">
              <div className="space-y-4 h-full flex flex-col">
                {validationReport ? (
                  <>
                    {/* Summary */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Validation Summary</CardTitle>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => activePreset && runValidation(activePreset)}
                              disabled={loading}
                            >
                              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                            {validationReport.totalIssues > 0 && (
                              <Button
                                size="sm"
                                onClick={() => autoFixIssues()}
                                disabled={loading}
                              >
                                <Zap className="w-4 h-4 mr-1" />
                                Auto-Fix
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 border rounded">
                            <div className="text-lg font-bold text-red-600">
                              {validationReport.errorCount}
                            </div>
                            <div className="text-xs text-muted-foreground">Errors</div>
                          </div>
                          <div className="p-2 border rounded">
                            <div className="text-lg font-bold text-amber-600">
                              {validationReport.warningCount}
                            </div>
                            <div className="text-xs text-muted-foreground">Warnings</div>
                          </div>
                          <div className="p-2 border rounded">
                            <div className="text-lg font-bold text-blue-600">
                              {validationReport.infoCount}
                            </div>
                            <div className="text-xs text-muted-foreground">Info</div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          Last updated: {validationReport.lastUpdated.toLocaleTimeString()}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Issues List */}
                    <div className="flex-1 min-h-0">
                      {validationReport.issues.length === 0 ? (
                        <Card className="h-full flex items-center justify-center">
                          <CardContent className="text-center py-8">
                            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                            <h3 className="font-semibold text-green-700 mb-1">All Clear!</h3>
                            <p className="text-sm text-muted-foreground">
                              No validation issues found
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <ScrollArea className="h-full">
                          <div className="space-y-3">
                            {validationReport.issues.map((issue) => (
                              <Card key={issue.id}>
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-start gap-2">
                                        <Badge 
                                          variant="outline" 
                                          className={`${getSeverityColor(issue.severity)} text-xs`}
                                        >
                                          {getSeverityIcon(issue.severity)}
                                          {issue.severity}
                                        </Badge>
                                        <div className="flex-1">
                                          <h4 className="font-medium text-sm">{issue.title}</h4>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {issue.description}
                                          </p>
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => dismissIssue(issue.id)}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>

                                    {issue.suggestion && (
                                      <Alert>
                                        <Info className="w-4 h-4" />
                                        <AlertDescription className="text-xs">
                                          {issue.suggestion}
                                        </AlertDescription>
                                      </Alert>
                                    )}

                                    <div className="flex justify-between items-center">
                                      <Badge variant="secondary" className="text-xs capitalize">
                                        {issue.category}
                                      </Badge>
                                      {issue.autoFixAvailable && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => autoFixIssues([issue.id])}
                                          disabled={loading}
                                        >
                                          <Zap className="w-3 h-3 mr-1" />
                                          Fix
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  </>
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <CardContent className="text-center py-8">
                      <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-semibold mb-1">No Active Validation</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Configure validation settings to start checking your document
                      </p>
                      <Button onClick={() => setActiveTab('settings')}>
                        <Settings className="w-4 h-4 mr-2" />
                        Configure Validation
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="h-full m-0 p-4">
              <ScrollArea className="h-full">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Validation Configuration</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose validation rules for this document
                    </p>
                  </div>

                  <ValidationPresetSelector
                    selectedPreset={activePreset?.id || 'default'}
                    onPresetChange={async (presetId) => {
                      const presets = await import('@/lib/template-model').then(m => m.createValidationPresets())
                      const preset = presets.find(p => p.id === presetId)
                      if (preset) {
                        await applyValidationPreset(preset)
                      }
                    }}
                    showDetails={false}
                  />

                  {activePreset && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Current Preset</CardTitle>
                        <CardDescription>
                          {activePreset.name} - {activePreset.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => runValidation(activePreset)}
                          disabled={loading}
                          className="w-full"
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                          Run Validation
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}