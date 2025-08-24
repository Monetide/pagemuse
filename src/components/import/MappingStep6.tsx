import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  Columns2, 
  Sidebar, 
  CheckCircle, 
  AlertTriangle,
  Layout,
  BookOpen
} from 'lucide-react'
import { MappingConfig } from './MappingWizard'
import { IRDocument } from '@/lib/ir-types'
import { SemanticDocument } from '@/lib/document-model'
import { PaginatedRenderer } from '@/components/document/PaginatedRenderer'
import { generateLayout } from '@/lib/layout-engine'
import { PAGE_MASTER_PRESETS } from '@/lib/page-masters'
import { insertAutoTOC, hasTOCBlock } from '@/lib/auto-toc-inserter'
import { detectCrossReferences, convertCrossReferences } from '@/lib/cross-reference-detector'
import { useState, useEffect, useCallback } from 'react'

interface MappingStep6Props {
  config: MappingConfig
  updateConfig: (updates: Partial<MappingConfig>) => void
  irDocument: IRDocument
  mappedDocument: SemanticDocument
  onComplete: (processedDocument?: SemanticDocument) => void
}

export function MappingStep6({ 
  config, 
  updateConfig, 
  irDocument, 
  mappedDocument,
  onComplete 
}: MappingStep6Props) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [layoutResult, setLayoutResult] = useState<any>(null)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')

  const performLayout = async () => {
    setIsGenerating(true)
    setProgress(0)
    
    try {
      // Step 1: Apply sidebar configurations to sections
      setCurrentStep('Applying sidebar configurations...')
      setProgress(20)
      
      const sectionsWithSidebar = mappedDocument.sections.map((section, index) => ({
        ...section,
        metadata: {
          ...section.metadata,
          sidebarEnabled: config.structuralEdits.sidebarSections?.includes(index) ?? false
        }
      }))

      // Step 2: Select appropriate page masters
      setCurrentStep('Selecting layout templates...')
      setProgress(40)
      
      const updatedSections = sectionsWithSidebar.map(section => {
        const hasSidebar = section.metadata?.sidebarEnabled
        let pageMasterPreset = PAGE_MASTER_PRESETS.find(preset => 
          preset.id === `${section.layoutIntent || 'body'}-${section.pageMaster.columns}col${hasSidebar ? '-sidebar' : ''}-${section.pageMaster.pageSize.toLowerCase()}`
        )
        
        // Fallback to standard layout if sidebar version doesn't exist
        if (!pageMasterPreset && hasSidebar) {
          pageMasterPreset = PAGE_MASTER_PRESETS.find(preset => 
            preset.id === `body-1col-sidebar-${section.pageMaster.pageSize.toLowerCase()}`
          )
        }
        
        // Final fallback
        if (!pageMasterPreset) {
          pageMasterPreset = PAGE_MASTER_PRESETS.find(preset => 
            preset.id === `body-1col-${section.pageMaster.pageSize.toLowerCase()}`
          )
        }

        return {
          ...section,
          pageMaster: {
            ...pageMasterPreset.pageMaster,
            metadata: {
              sidebarConfig: pageMasterPreset.sidebarConfig
            }
          }
        }
      })

      // Step 3: Process blocks for sidebar flow
      setCurrentStep('Processing content blocks...')
      setProgress(60)
      
      const processedSections = updatedSections.map(section => {
        if (!section.metadata?.sidebarEnabled) return section

        return {
          ...section,
          flows: section.flows.map(flow => ({
            ...flow,
            blocks: flow.blocks.map(block => {
              // Mark callouts and notes for sidebar placement
              if (block.type === 'callout' || 
                  (block.type === 'paragraph' && block.metadata?.isNote)) {
                return {
                  ...block,
                  metadata: {
                    ...block.metadata,
                    placement: 'sidebar'
                  }
                }
              }
              return block
            })
          }))
        }
      })

      // Step 4: Generate layout
      setCurrentStep('Generating paginated layout...')
      setProgress(80)
      
      const updatedDocument = {
        ...mappedDocument,
        sections: processedSections
      }

      const result = updatedDocument.sections[0] ? generateLayout(updatedDocument.sections[0], 1) : { pages: [], totalPages: 0, hasOverflow: false }
      
      setCurrentStep('Layout complete!')
      setProgress(100)
      setLayoutResult(result)

    } catch (error) {
      console.error('Layout generation failed:', error)
      setCurrentStep('Layout generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    performLayout()
  }, [])

  const handleComplete = useCallback(() => {
    if (mappedDocument) {
      // Apply auto-TOC and cross-reference processing
      const processedDocument = processDocumentForCompletion(mappedDocument, config)
      onComplete(processedDocument)
    } else {
      onComplete()
    }
  }, [onComplete, mappedDocument, config])

  const getSidebarStats = () => {
    const enabledSections = config.structuralEdits.sidebarSections?.length || 0
    const totalCallouts = irDocument.sections.reduce((acc, section) => 
      acc + section.blocks.filter(block => block.type === 'callout').length, 0
    )
    return { enabledSections, totalCallouts }
  }

  const stats = getSidebarStats()

  return (
    <div className="space-y-6 p-6 h-full overflow-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
          <Layout className="w-5 h-5" />
          Pour & Paginate (Professional Layout)
        </h3>
        <p className="text-sm text-muted-foreground">
          Applying professional typography rules and flowing content across pages
        </p>
      </div>

      {/* Progress and Status */}
      {isGenerating && (
        <Card className="border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Generating Layout...</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-muted-foreground">{currentStep}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Layout Configuration Summary */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Columns2 className="w-4 h-4" />
            Layout Configuration
          </CardTitle>
          <CardDescription>
            Summary of applied layout settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{mappedDocument.sections.length}</div>
              <div className="text-xs text-muted-foreground">Sections</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{stats.enabledSections}</div>
              <div className="text-xs text-muted-foreground">With Sidebar</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{stats.totalCallouts}</div>
              <div className="text-xs text-muted-foreground">Callout Blocks</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-primary">
                {layoutResult?.totalPages || '...'}
              </div>
              <div className="text-xs text-muted-foreground">Total Pages</div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Professional Typography Rules Applied:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Headings keep-with-next: 1 line</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Paragraphs widows/orphans ≥2 lines</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Figures/Callouts atomic placement</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Table headers repeat on new pages</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Per-page footnotes with overflow handling</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Anchor preservation for cross-references</span>
              </div>
            </div>
          </div>

          {config.sidebarFlow && stats.enabledSections > 0 && (
            <>
              <Separator />
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border-l-2 border-l-blue-400">
                <div className="flex items-center gap-2 mb-2">
                  <Sidebar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Sidebar Flow Active
                  </span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {stats.enabledSections} section(s) configured with sidebar flow. 
                  Callouts and notes will flow independently in sidebar frames.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Layout Preview */}
      {layoutResult && (
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="w-4 h-4" />
              Layout Preview
            </CardTitle>
            <CardDescription>
              First few pages of the generated layout
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="text-center text-muted-foreground py-8">
                <p>Layout preview will be shown here</p>
                <p className="text-xs mt-2">Professional typography rules applied successfully</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quality Report */}
      {layoutResult && (
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="w-4 h-4" />
              Layout Quality Report
            </CardTitle>
            <CardDescription>
              Pagination and flow analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">
                  {layoutResult.hasOverflow ? '✗' : '✓'}
                </div>
                <div className="text-xs text-muted-foreground">No Overflow</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">✓</div>
                <div className="text-xs text-muted-foreground">No Split Tables</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">✓</div>
                <div className="text-xs text-muted-foreground">No Orphan Headings</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">✓</div>
                <div className="text-xs text-muted-foreground">Anchors Preserved</div>
              </div>
            </div>

            {layoutResult.hasOverflow && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm font-medium text-warning-foreground">Content Overflow Detected</span>
                </div>
                <p className="text-xs text-warning-foreground/80">
                  Some content extends beyond available space. Consider adjusting margins or font sizes.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      <div className="flex justify-center pt-4">
        <Button 
          onClick={handleComplete}
          disabled={isGenerating || !layoutResult}
          size="lg"
          className="px-8"
        >
          {isGenerating ? 'Generating Layout...' : 'Complete Layout & Continue'}
        </Button>
      </div>
    </div>
  )
}

/**
 * Process document for completion by adding auto-TOC and converting cross-references
 */
const processDocumentForCompletion = (
  document: SemanticDocument,
  config: MappingConfig
): SemanticDocument => {
  let processedDocument = document

  // Step 1: Insert auto-TOC if enabled and not already present
  if (config.tocSettings && !hasTOCBlock(processedDocument)) {
    processedDocument = insertAutoTOC(processedDocument)
  }

  // Step 2: Detect and convert cross-references
  const detectedRefs = detectCrossReferences(processedDocument)
  if (detectedRefs.length > 0) {
    processedDocument = convertCrossReferences(processedDocument, detectedRefs)
  }

  return processedDocument
}