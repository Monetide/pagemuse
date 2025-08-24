import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, ArrowLeft, ArrowRight, RotateCcw, AlertTriangle } from 'lucide-react'
import { MappingStep1 } from './MappingStep1'
import { MappingStep2 } from './MappingStep2'
import { MappingStep3 } from './MappingStep3'
import { MappingStep4 } from './MappingStep4'
import { MappingStep5 } from './MappingStep5'
import { MappingStep6 } from './MappingStep6'
import { CleanupResultsPanel } from './CleanupResultsPanel'
import { CleanupAuditEntry } from '@/lib/ir-cleanup'
import { IRDocument } from '@/lib/ir-types'
import { SemanticDocument } from '@/lib/document-model'
import { Template } from '@/hooks/useSupabaseData'

export interface MappingConfig {
  // Step 1: Scope & Intent
  mode: 'new-document' | 'insert-current' | 'replace-current'
  useCase: 'ebook' | 'whitepaper' | 'case-study' | 'other'
  sidebarFlow: boolean
  template?: Template
  themeOverride?: string
  
  // Step 2: Structure Rules
  sectionization: {
    newSectionAtH1: boolean
    newSectionAtH2: boolean
    minHeadingLevel: 1 | 2 | 3
  }
  tocSettings: {
    depth: 1 | 2 | 3 | 4 | 5 | 6
    includeH1: boolean
    includeH2: boolean
    includeH3: boolean
    includeH4: boolean
    includeH5: boolean
    includeH6: boolean
  }
  calloutMapping: {
    blockquoteHandling: 'quote' | 'callout' | 'auto'
    defaultCalloutType: 'info' | 'note' | 'warning' | 'error' | 'success'
  }
  
  // Step 3: Preview Fixups
  structuralEdits: {
    headingPromotions: Record<string, number> // blockId -> new level
    headingDemotions: Record<string, number>
    captionMarks: string[] // blockIds marked as captions
    decorativeImages: string[] // blockIds marked as decorative
    tableHeaderRows: Record<string, boolean> // tableId -> hasHeaderRow
    sectionMerges: Array<{ from: string; to: string }>
    sectionSplits: Array<{ blockId: string; newSectionName: string }>
    sidebarSections?: number[] // section indices with sidebar enabled
  }
}

interface MappingWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  irDocument: IRDocument
  onConfirm: (config: MappingConfig, mappedDocument: SemanticDocument, cleanupAudit?: CleanupAuditEntry[]) => void
  currentDocument?: SemanticDocument
  fileName?: string
  cleanupAudit?: CleanupAuditEntry[]
}

export function MappingWizard({
  open,
  onOpenChange,
  irDocument,
  onConfirm,
  currentDocument,
  fileName,
  cleanupAudit
}: MappingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [stepValidation, setStepValidation] = useState({
    step1: true,  // Always valid once visited
    step2: true,  // Always valid once visited
    step3: false, // Valid when preview is generated
    step4: false, // Valid when template + brand selected
    step5: false, // Valid when metadata is complete
    step6: false  // Valid when layout is complete
  })
  const [config, setConfig] = useState<MappingConfig>({
    mode: 'new-document',
    useCase: 'other',
    sidebarFlow: true,
    sectionization: {
      newSectionAtH1: true,
      newSectionAtH2: false,
      minHeadingLevel: 1
    },
    tocSettings: {
      depth: 3,
      includeH1: true,
      includeH2: true,
      includeH3: true,
      includeH4: false,
      includeH5: false,
      includeH6: false
    },
    calloutMapping: {
      blockquoteHandling: 'auto',
      defaultCalloutType: 'note'
    },
    structuralEdits: {
      headingPromotions: {},
      headingDemotions: {},
      captionMarks: [],
      decorativeImages: [],
      tableHeaderRows: {},
      sectionMerges: [],
      sectionSplits: [],
      sidebarSections: []
    }
  })
  
  const [previewDocument, setPreviewDocument] = useState<SemanticDocument | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const updateConfig = useCallback((updates: Partial<MappingConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
    setHasUnsavedChanges(true)
  }, [])

  const handleNext = useCallback(() => {
    if (currentStep < 6 && canProceedToStep(currentStep + 1)) {
      setCurrentStep(prev => prev + 1)
      
      // Mark current step as visited/valid
      setStepValidation(prev => ({
        ...prev,
        [`step${currentStep}`]: true
      }))
    }
  }, [currentStep])

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleStepClick = useCallback((step: number) => {
    if (canProceedToStep(step)) {
      setCurrentStep(step)
    }
  }, [])

  const handleStartOver = useCallback(() => {
    setCurrentStep(1)
    setStepValidation({ step1: true, step2: true, step3: false, step4: false, step5: false, step6: false })
    setPreviewDocument(null)
    setHasUnsavedChanges(false)
    // Reset config to defaults
    setConfig({
      mode: 'new-document',
      useCase: 'other',
      sidebarFlow: true, // Default to on
      sectionization: {
        newSectionAtH1: true,
        newSectionAtH2: false,
        minHeadingLevel: 1
      },
      tocSettings: {
        depth: 3,
        includeH1: true,
        includeH2: true,
        includeH3: true,
        includeH4: false,
        includeH5: false,
        includeH6: false
      },
      calloutMapping: {
        blockquoteHandling: 'auto',
        defaultCalloutType: 'note'
      },
      structuralEdits: {
        headingPromotions: {},
        headingDemotions: {},
        captionMarks: [],
        decorativeImages: [],
        tableHeaderRows: {},
        sectionMerges: [],
        sectionSplits: [],
        sidebarSections: []
      }
    })
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!previewDocument) return
    
    try {
      onConfirm(config, previewDocument, cleanupAudit)
      onOpenChange(false)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Failed to confirm mapping:', error)
    }
  }, [config, previewDocument, cleanupAudit, onConfirm, onOpenChange])

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 1: return true
      case 2: return stepValidation.step1
      case 3: return stepValidation.step1 && stepValidation.step2
      case 4: return stepValidation.step1 && stepValidation.step2 && stepValidation.step3
      case 5: return stepValidation.step1 && stepValidation.step2 && stepValidation.step3 && stepValidation.step4
      case 6: return stepValidation.step1 && stepValidation.step2 && stepValidation.step3 && stepValidation.step4 && stepValidation.step5
      default: return false
    }
  }

  const handlePreviewUpdate = useCallback((document: SemanticDocument) => {
    setPreviewDocument(document)
    setStepValidation(prev => ({ ...prev, step3: true }))
  }, [])

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Scope & Intent'
      case 2: return 'Sectionization'
      case 3: return 'Preview & Fixups'
      case 4: return 'Template & Brand'
      case 5: return 'Cover & Metadata'
      case 6: return 'Pour & Paginate'
      default: return ''
    }
  }

  const getStepDescription = (step: number) => {
    switch (step) {
      case 1: return 'Choose import mode and template'
      case 2: return 'Configure document structure'
      case 3: return 'Review and make final adjustments'
      case 4: return 'Select template and brand kit'
      case 5: return 'Generate cover and set metadata'
      case 6: return 'Apply professional layout rules'
      default: return ''
    }
  }

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1: return stepValidation.step1
      case 2: return stepValidation.step2
      case 3: return stepValidation.step3
      case 4: return stepValidation.step4
      case 5: return stepValidation.step5
      case 6: return stepValidation.step6
      default: return false
    }
  }

  const isStepAccessible = (step: number) => canProceedToStep(step)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-3">
                <span>Import Mapping Wizard</span>
                {fileName && (
                  <Badge variant="outline" className="text-sm font-normal">
                    {fileName}
                  </Badge>
                )}
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-sm font-normal border-warning text-warning">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Unsaved
                  </Badge>
                )}
              </DialogTitle>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartOver}
              className="text-muted-foreground hover:text-destructive"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-6 mt-6">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex items-center gap-3">
                <div 
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 cursor-pointer transition-all duration-200 ${
                    currentStep === step 
                      ? 'border-primary bg-primary text-primary-foreground shadow-glow' 
                      : isStepComplete(step)
                      ? 'border-success bg-success text-success-foreground'
                      : isStepAccessible(step)
                      ? 'border-muted-foreground bg-background text-muted-foreground hover:border-primary hover:text-primary'
                      : 'border-muted bg-muted/30 text-muted-foreground cursor-not-allowed'
                  }`}
                  onClick={() => handleStepClick(step)}
                >
                  {isStepComplete(step) && currentStep !== step ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step}</span>
                  )}
                </div>
                <div className={`transition-colors ${
                  currentStep === step ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  <div className="text-sm font-medium">{getStepTitle(step)}</div>
                  <div className="text-xs text-muted-foreground">{getStepDescription(step)}</div>
                </div>
                {step < 6 && (
                  <div className="w-12 h-px bg-border ml-3" />
                )}
              </div>
            ))}
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={(currentStep / 6) * 100} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Step {currentStep} of 6</span>
              <span>{Math.round((currentStep / 6) * 100)}% Complete</span>
            </div>
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        {/* Step Content */}
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1">
            {currentStep === 1 && (
              <MappingStep1
                config={config}
                updateConfig={updateConfig}
                currentDocument={currentDocument}
                irDocument={irDocument}
              />
            )}
            {currentStep === 2 && (
              <MappingStep2
                config={config}
                updateConfig={updateConfig}
                irDocument={irDocument}
              />
            )}
            {currentStep === 3 && (
              <MappingStep3
                config={config}
                updateConfig={updateConfig}
                irDocument={irDocument}
                onPreviewUpdate={handlePreviewUpdate}
              />
            )}
            {currentStep === 4 && (
              <MappingStep4
                config={config}
                updateConfig={updateConfig}
                irDocument={irDocument}
                onValidationChange={(isValid) => 
                  setStepValidation(prev => ({ ...prev, step4: isValid }))
                }
              />
            )}
            {currentStep === 5 && (
              <MappingStep5
                config={config}
                updateConfig={updateConfig}
                irDocument={irDocument}
                mappedDocument={previewDocument}
                onComplete={() => {
                  setStepValidation(prev => ({ ...prev, step5: true }))
                  setCurrentStep(6)
                }}
              />
            )}

            {currentStep === 6 && previewDocument && (
              <MappingStep6
                config={config}
                updateConfig={updateConfig}
                irDocument={irDocument}
                mappedDocument={previewDocument}
                onComplete={() => {
                  if (previewDocument) {
                    onConfirm(config, previewDocument, cleanupAudit)
                  }
                }}
              />
            )}
          </div>
          
          {/* Right sidebar for cleanup results */}
          {cleanupAudit && cleanupAudit.length > 0 && (
            <div className="w-80 border-l border-border pl-4">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Cleanup Applied</h3>
                <div className="space-y-2">
                  {cleanupAudit.map((entry, index) => (
                    <div key={index} className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {entry.count} changes
                        </Badge>
                      </div>
                      <p className="text-sm">{entry.description}</p>
                      {entry.details && (
                        <p className="text-xs text-muted-foreground mt-1">{entry.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-shrink-0 flex justify-between items-center pt-6 border-t">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of 6 • {getStepTitle(currentStep)}
            </div>
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-xs border-warning text-warning">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Unsaved changes
              </Badge>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>
            
            {currentStep < 6 ? (
              <Button 
                onClick={handleNext}
                disabled={!canProceedToStep(currentStep + 1)}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleConfirm}
                disabled={!stepValidation.step6 || !previewDocument}
                className="bg-gradient-primary hover:shadow-glow transition-all duration-200 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Import Document
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}