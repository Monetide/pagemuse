import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { MappingStep1 } from './MappingStep1'
import { MappingStep2 } from './MappingStep2'
import { MappingStep3 } from './MappingStep3'
import { CleanupResultsPanel } from './CleanupResultsPanel'
import { PostImportCleaner, getDefaultCleanupOptions, CleanupOptions, CleanupResult } from '@/lib/post-import-cleaner'
import { IRMapper } from '@/lib/ir-mapper'
import { IRDocument } from '@/lib/ir-types'
import { SemanticDocument } from '@/lib/document-model'
import { Template } from '@/hooks/useSupabaseData'

export interface MappingConfig {
  // Step 1: Scope & Intent
  mode: 'new-document' | 'append-section' | 'insert-at-cursor' | 'replace-selection'
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
  cleanupOptions: CleanupOptions
  
  // Step 3: Preview Fixups
  structuralEdits: {
    headingPromotions: Record<string, number> // blockId -> new level
    headingDemotions: Record<string, number>
    captionMarks: string[] // blockIds marked as captions
    decorativeImages: string[] // blockIds marked as decorative
    tableHeaderRows: Record<string, boolean> // tableId -> hasHeaderRow
    sectionMerges: Array<{ from: string; to: string }>
    sectionSplits: Array<{ blockId: string; newSectionName: string }>
  }
}

interface MappingWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  irDocument: IRDocument
  onConfirm: (config: MappingConfig, mappedDocument: SemanticDocument, cleanupResult?: CleanupResult) => void
  currentDocument?: SemanticDocument
  fileName?: string
}

export function MappingWizard({
  open,
  onOpenChange,
  irDocument,
  onConfirm,
  currentDocument,
  fileName
}: MappingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [config, setConfig] = useState<MappingConfig>({
    mode: 'new-document',
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
    cleanupOptions: getDefaultCleanupOptions('text'), // Will be updated based on file type
    structuralEdits: {
      headingPromotions: {},
      headingDemotions: {},
      captionMarks: [],
      decorativeImages: [],
      tableHeaderRows: {},
      sectionMerges: [],
      sectionSplits: []
    }
  })
  
  const [previewDocument, setPreviewDocument] = useState<SemanticDocument | null>(null)
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null)

  const updateConfig = useCallback((updates: Partial<MappingConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }, [])

  const handleNext = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep])

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleConfirm = useCallback(async () => {
    if (!previewDocument) return
    
    try {
      // Apply post-import cleanups
      const cleaner = new PostImportCleaner(config.cleanupOptions)
      const cleanupResult = cleaner.cleanDocument(previewDocument)
      
      setCleanupResult(cleanupResult)
      onConfirm(config, cleanupResult.document, cleanupResult)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to apply cleanups:', error)
      // Fallback to original document if cleanup fails
      onConfirm(config, previewDocument)
      onOpenChange(false)
    }
  }, [config, previewDocument, onConfirm, onOpenChange])

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Scope & Intent'
      case 2: return 'Structure Rules'
      case 3: return 'Preview & Fixups'
      default: return ''
    }
  }

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1: return true // Always complete once visited
      case 2: return true // Always complete once visited  
      case 3: return previewDocument !== null
      default: return false
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <span>Import Mapping Wizard</span>
            {fileName && (
              <span className="text-sm font-normal text-muted-foreground">
                • {fileName}
              </span>
            )}
          </DialogTitle>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-4 mt-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep === step 
                    ? 'border-primary bg-primary text-primary-foreground' 
                    : isStepComplete(step)
                    ? 'border-success bg-success text-success-foreground'
                    : 'border-muted-foreground bg-background text-muted-foreground'
                }`}>
                  {isStepComplete(step) && currentStep !== step ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-semibold">{step}</span>
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  currentStep === step ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {getStepTitle(step)}
                </span>
                {step < 3 && (
                  <div className="w-8 h-px bg-border ml-2" />
                )}
              </div>
            ))}
          </div>
          
          {/* Progress Bar */}
          <Progress value={(currentStep / 3) * 100} className="mt-4" />
        </DialogHeader>

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
                onPreviewUpdate={setPreviewDocument}
              />
            )}
          </div>
          
          {/* Right sidebar for cleanup results */}
          {cleanupResult && (
            <div className="w-80 border-l border-border">
              <CleanupResultsPanel cleanupResult={cleanupResult} />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of 3
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < 3 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleConfirm}
                disabled={!previewDocument}
                className="bg-gradient-primary hover:shadow-glow transition-all duration-200"
              >
                Import Document
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}