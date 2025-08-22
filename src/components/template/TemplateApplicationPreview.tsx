import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowRight,
  Palette,
  Layout,
  FileText,
  Columns,
  Type,
  AlertCircle
} from 'lucide-react'
import { Template } from '@/hooks/useSupabaseData'
import { SemanticDocument } from '@/lib/document-model'
import { TemplateApplicationMode } from './ApplyTemplateWizard'
import { TemplatePreviewData } from '@/hooks/useTemplateApplicationSafe'

interface TemplateApplicationPreviewProps {
  template: Template
  document: SemanticDocument
  mode: TemplateApplicationMode
  previewData: TemplatePreviewData | null
  loading: boolean
}

export function TemplateApplicationPreview({
  template,
  document,
  mode,
  previewData,
  loading
}: TemplateApplicationPreviewProps) {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <h3 className="font-medium">Generating Preview</h3>
            <p className="text-sm text-muted-foreground">
              Analyzing your document and template compatibility...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!previewData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-medium">Preview Not Available</h3>
            <p className="text-sm text-muted-foreground">
              Unable to generate preview for this template application
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { changes, warnings, sectionMappings, colorChanges, layoutChanges } = previewData

  return (
    <div className="h-full">
      <Tabs defaultValue="overview" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="styles">Style Changes</TabsTrigger>
          <TabsTrigger value="layout">Layout Changes</TabsTrigger>
          <TabsTrigger value="sections">Section Mapping</TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0 mt-4">
          <TabsContent value="overview" className="h-full mt-0">
            <ScrollArea className="h-full">
              <div className="space-y-6">
                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Change Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{changes.preserved}</div>
                        <div className="text-sm text-muted-foreground">Elements Preserved</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{changes.modified}</div>
                        <div className="text-sm text-muted-foreground">Elements Modified</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-amber-600">{warnings.length}</div>
                        <div className="text-sm text-muted-foreground">Warnings</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Warnings */}
                {warnings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-amber-600">
                        <AlertCircle className="w-5 h-5" />
                        Warnings ({warnings.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {warnings.map((warning, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <h5 className="font-medium text-amber-800">{warning.title}</h5>
                              <p className="text-sm text-amber-700">{warning.description}</p>
                              {warning.suggestion && (
                                <p className="text-sm text-amber-600 mt-1 italic">
                                  Suggestion: {warning.suggestion}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Before/After Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>Document Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-400 rounded-full" />
                          Before (Current)
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Sections:</span>
                            <span>{document.sections.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Blocks:</span>
                            <span>{document.sections.reduce((acc, s) => 
                              acc + s.flows.reduce((facc, f) => facc + f.blocks.length, 0), 0
                            )}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Layout Intents:</span>
                            <span>{new Set(document.sections.map(s => s.layoutIntent || 'default')).size}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full" />
                          After (Preview)
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Sections:</span>
                            <span>{sectionMappings.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Blocks:</span>
                            <span className="text-green-600 font-medium">
                              {document.sections.reduce((acc, s) => 
                                acc + s.flows.reduce((facc, f) => facc + f.blocks.length, 0), 0
                              )} (preserved)
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Layout Intents:</span>
                            <span>{new Set(sectionMappings.map(m => m.newLayoutIntent)).size}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="styles" className="h-full mt-0">
            <ScrollArea className="h-full">
              <div className="space-y-6">
                {/* Color Changes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Color Palette Changes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {colorChanges.map((change, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded border-2 border-white shadow-sm"
                              style={{ backgroundColor: change.oldColor }}
                            />
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            <div 
                              className="w-6 h-6 rounded border-2 border-white shadow-sm"
                              style={{ backgroundColor: change.newColor }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{change.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {change.oldColor} → {change.newColor}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Typography Changes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Type className="w-5 h-5" />
                      Typography Updates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid gap-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">Heading Font</div>
                            <div className="text-sm text-muted-foreground">Inter → Inter</div>
                          </div>
                          <Badge variant="outline">No Change</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">Body Font</div>
                            <div className="text-sm text-muted-foreground">Inter → Inter</div>
                          </div>
                          <Badge variant="outline">No Change</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="layout" className="h-full mt-0">
            <ScrollArea className="h-full">
              <div className="space-y-6">
                {mode === 'styles-only' ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Layout className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Layout Changes</h3>
                      <p className="text-muted-foreground">
                        Styles-only mode preserves all current layouts and page settings
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Page Master Changes */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Columns className="w-5 h-5" />
                          Page Layout Changes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {layoutChanges.map((change, index) => (
                            <div key={index} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium">{change.sectionName}</h5>
                                <Badge variant="outline">{change.layoutIntent}</Badge>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <h6 className="font-medium text-muted-foreground mb-2">Before</h6>
                                  <ul className="space-y-1">
                                    <li>Margins: {change.oldMargins}</li>
                                    <li>Columns: {change.oldColumns}</li>
                                    <li>Orientation: {change.oldOrientation}</li>
                                  </ul>
                                </div>
                                <div>
                                  <h6 className="font-medium text-muted-foreground mb-2">After</h6>
                                  <ul className="space-y-1">
                                    <li>Margins: {change.newMargins}</li>
                                    <li>Columns: {change.newColumns}</li>
                                    <li>Orientation: {change.newOrientation}</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sections" className="h-full mt-0">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Section Mapping</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      How your current sections will be mapped to template layout intents
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {sectionMappings.map((mapping, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{mapping.sectionName}</div>
                            <div className="text-sm text-muted-foreground">
                              {mapping.blockCount} blocks, {mapping.flowCount} flows
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1">
                            <Badge variant="secondary">{mapping.newLayoutIntent}</Badge>
                            <div className="text-sm text-muted-foreground mt-1">
                              {mapping.confidence}% match confidence
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}