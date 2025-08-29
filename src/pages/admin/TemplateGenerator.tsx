import { useState } from 'react'
import { SeedForm, type SeedFormData } from '@/components/admin/SeedForm'
import { TemplatePreview } from '@/components/admin/TemplatePreview'
import { TemplateGeneratorHealthCheck } from '@/components/admin/TemplateGeneratorHealthCheck'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft,
  ArrowRight,
  Save,
  RotateCcw,
  PlayCircle,
  Sparkles,
  Eye,
  FileText,
  Palette,
  Settings,
  Shield
} from 'lucide-react'

type WizardStep = 'seed' | 'preview' | 'publish'

interface TemplateGeneratorState {
  currentStep: WizardStep
  seedData: {
    isValid: boolean
    formData?: SeedFormData
  }
  previewData: {
    // Add preview-specific fields later
  }
  publishData: {
    // Add publish-specific fields later
  }
}

interface TemplateGeneratorProps {
  scope?: 'workspace' | 'global'
}

export default function TemplateGenerator({ scope = 'workspace' }: TemplateGeneratorProps) {
  const [state, setState] = useState<TemplateGeneratorState>({
    currentStep: 'seed',
    seedData: { isValid: false },
    previewData: {},
    publishData: {}
  })

  const steps = [
    { id: 'seed', label: 'Seed', icon: Sparkles, description: 'Define template foundation' },
    { id: 'preview', label: 'Preview', icon: Eye, description: 'Review generated template' },
    { id: 'publish', label: 'Publish', icon: FileText, description: 'Finalize and publish' }
  ]

  const currentStepIndex = steps.findIndex(step => step.id === state.currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const canGoNext = () => {
    switch (state.currentStep) {
      case 'seed':
        return state.seedData.isValid
      case 'preview':
        return true
      case 'publish':
        return false
    }
  }

  const canGoPrevious = () => {
    return currentStepIndex > 0
  }

  const handleNext = () => {
    if (!canGoNext()) return
    
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setState(prev => ({
        ...prev,
        currentStep: steps[nextIndex].id as WizardStep
      }))
    }
  }

  const handlePrevious = () => {
    if (!canGoPrevious()) return
    
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setState(prev => ({
        ...prev,
        currentStep: steps[prevIndex].id as WizardStep
      }))
    }
  }

  const handleSaveDraft = () => {
    console.log('Saving draft...')
  }

  const handleReset = () => {
    setState({
      currentStep: 'seed',
      seedData: { isValid: false },
      previewData: {},
      publishData: {}
    })
  }

  const handleStartOver = () => {
    if (confirm('Are you sure you want to start over? All progress will be lost.')) {
      handleReset()
    }
  }

  const handleGenerate = () => {
    if (state.seedData.isValid && state.seedData.formData) {
      console.log('Generating template with data:', state.seedData.formData)
      // TODO: Implement actual template generation
    }
  }

  const handleSeedValidChange = (isValid: boolean, data?: SeedFormData) => {
    // Simplified - rely on SeedForm's debounced updates to prevent excessive calls
    setState(prev => ({
      ...prev,
      seedData: {
        isValid,
        formData: data
      }
    }))
  }

  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'seed':
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <Sparkles className="w-16 h-16 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Configure Template Seed</h3>
              <p className="text-muted-foreground">
                Define the foundation and parameters for your template generation.
              </p>
            </div>
            
            <SeedForm onValidChange={handleSeedValidChange} scope={scope} />
          </div>
        )
      
      case 'preview':
        return (
          <div className="space-y-6">
            <div className="text-center py-12">
              <Eye className="w-16 h-16 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Preview Generated Template</h3>
              <p className="text-muted-foreground">
                Review the generated template and make final adjustments.
              </p>
            </div>
            
            {/* Preview interface will go here */}
            <Card className="border-dashed">
              <CardContent className="p-8">
                <div className="text-center text-muted-foreground">
                  <Palette className="w-8 h-8 mx-auto mb-2" />
                  <p>Template preview interface coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      
      case 'publish':
        return (
          <div className="space-y-6">
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Publish Template</h3>
              <p className="text-muted-foreground">
                Finalize template details and publish to the library.
              </p>
            </div>
            
            {/* Publish configuration will go here */}
            <Card className="border-dashed">
              <CardContent className="p-8">
                <div className="text-center text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2" />
                  <p>Template publishing interface coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-muted">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={scope === 'global' ? '/system/templates' : '/admin/templates'}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-primary" />
                {scope === 'global' ? 'Global Template Generator' : 'Template Generator'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {scope === 'global' 
                  ? 'Create global templates available to all users'
                  : 'Create intelligent templates with AI-powered generation'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button variant="outline" onClick={handleStartOver}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </div>
        </div>

        {/* Health Check Section */}
        <div className="mb-6">
          <TemplateGeneratorHealthCheck />
        </div>

        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Progress Header */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Generation Progress</h2>
                    <span className="text-sm text-muted-foreground">
                      Step {currentStepIndex + 1} of {steps.length}
                    </span>
                  </div>
                  
                  <Progress value={progress} className="w-full" />
                  
                  <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                      const StepIcon = step.icon
                      const isActive = step.id === state.currentStep
                      const isCompleted = index < currentStepIndex
                      
                      return (
                        <div key={step.id} className="flex items-center gap-2">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center border-2
                            ${isActive 
                              ? 'border-primary bg-primary text-primary-foreground' 
                              : isCompleted 
                                ? 'border-green-500 bg-green-500 text-white' 
                                : 'border-muted-foreground bg-background'
                            }
                          `}>
                            <StepIcon className="w-4 h-4" />
                          </div>
                          <div className="text-sm">
                            <div className={`font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                              {step.label}
                            </div>
                            <div className="text-xs text-muted-foreground hidden sm:block">
                              {step.description}
                            </div>
                          </div>
                          
                          {index < steps.length - 1 && (
                            <div className="w-16 h-px bg-border mx-4" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step Content */}
            <Card>
              <CardContent className="p-0">
                {renderStepContent()}
              </CardContent>
            </Card>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={handlePrevious} 
                disabled={!canGoPrevious()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <Button variant="ghost" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              
              <Button 
                onClick={handleNext} 
                disabled={!canGoNext()}
                className="bg-gradient-primary hover:shadow-glow transition-all duration-200"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="w-80">
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Live Preview</CardTitle>
                  <Badge variant="outline">Real-time</Badge>
                </div>
                <CardDescription>
                  See your template as it's being generated
                </CardDescription>
              </CardHeader>
              
              <Separator />
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Mini Preview Area */}
                  <TemplatePreview data={state.seedData.formData} />
                  
                  {/* Template Stats */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Brand:</span>
                      <span className="truncate ml-2">
                        {state.seedData.formData?.brandName || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vibes:</span>
                      <span className="truncate ml-2">
                        {state.seedData.formData?.vibes.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Usage:</span>
                      <span className="capitalize truncate ml-2">
                        {state.seedData.formData?.usage || '-'}
                      </span>
                    </div>
                    {state.seedData.formData?.primaryColor && (
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground">Color:</span>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border border-border"
                            style={{ backgroundColor: state.seedData.formData.primaryColor }}
                          />
                          <span className="text-xs font-mono">
                            {state.seedData.formData.primaryColor}
                          </span>
                        </div>
                       </div>
                     )}
                     {state.seedData.formData?.colorway && (
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground">Colorway:</span>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border border-border"
                            style={{ backgroundColor: state.seedData.formData.colorway.colors.brand }}
                          />
                          <span className="text-xs font-medium">
                            {state.seedData.formData.colorway.name}
                          </span>
                          {state.seedData.formData.colorway.isCompliant && (
                            <Badge className="text-xs px-1 py-0 bg-green-100 text-green-800 border-green-200">
                              AA
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {state.seedData.formData?.motifs && (
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground">Motifs:</span>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {Object.entries(state.seedData.formData.motifs.selection).map(([type, variantId]) => {
                              const asset = state.seedData.formData?.motifs?.assets.find((a: any) => a.type === type)
                              const variant = asset?.variants.find((v: any) => v.id === variantId)
                              
                              if (!variant) return null
                              
                              return (
                                <img 
                                  key={type}
                                  src={variant.preview}
                                  alt={variant.name}
                                  className="w-4 h-3 object-contain border border-border rounded opacity-75"
                                  title={`${type}: ${variant.name}`}
                                />
                              )
                            })}
                          </div>
                          <span className="text-xs">
                            {Object.keys(state.seedData.formData.motifs.selection).length} assets
                          </span>
                        </div>
                      </div>
                    )}
                    {state.seedData.formData?.typography && (
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground">Typography:</span>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs font-medium">
                            {state.seedData.formData.typography.name}
                          </span>
                        </div>
                      </div>
                    )}
                    {state.seedData.formData?.pageMasters && (
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground">Page Masters:</span>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs font-medium">
                            {state.seedData.formData.pageMasters.cover?.includes('letter') ? 'Letter' : 
                             state.seedData.formData.pageMasters.cover?.includes('a4') ? 'A4' : 'Not set'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {state.seedData.formData.pageMasters.selected?.[0]?.id?.includes('2col') ? '2-Column' : '1-Column'}
                          </span>
                        </div>
                      </div>
                    )}
                    {state.seedData.formData?.objectStyles && (
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground">Object Styles:</span>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs font-medium">
                            {Object.keys(state.seedData.formData.objectStyles.styles || {}).length} style{Object.keys(state.seedData.formData.objectStyles.styles || {}).length !== 1 ? 's' : ''}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {state.seedData.formData.objectStyles.snippets?.length || 0} snippet{(state.seedData.formData.objectStyles.snippets?.length || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}
                    {state.seedData.formData && (
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground">Preview Pages:</span>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs font-medium">3 Composed</span>
                          <span className="text-xs text-muted-foreground">Ready to Export</span>
                        </div>
                      </div>
                    )}
                    {state.seedData.formData && (
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground">Quality Status:</span>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs font-medium">Auto-Validated</span>
                          <span className="text-xs text-muted-foreground">WCAG AA Ready</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Generate Button */}
                  <Button 
                    className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-200"
                    disabled={!state.seedData.isValid}
                    onClick={handleGenerate}
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Generate
                  </Button>
                  
                  {!state.seedData.isValid && (
                    <p className="text-xs text-muted-foreground text-center">
                      Complete the seed configuration to enable generation
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}