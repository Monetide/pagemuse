import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ArrowLeft,
  ArrowRight,
  Palette,
  Layout,
  FileText,
  CheckCircle,
  AlertTriangle,
  Info,
  Eye,
  Undo,
  Save
} from 'lucide-react'
import { Template } from '@/hooks/useSupabaseData'
import { SemanticDocument } from '@/lib/document-model'
import { TemplateApplicationPreview } from './TemplateApplicationPreview'
import { useTemplateApplicationSafe } from '@/hooks/useTemplateApplicationSafe'

export type TemplateApplicationMode = 'styles-only' | 'styles-and-masters' | 'full-layout'

interface ApplyTemplateWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: Template
  document: SemanticDocument
  onApply: (mode: TemplateApplicationMode) => Promise<void>
}

export function ApplyTemplateWizard({
  open,
  onOpenChange,
  template,
  document,
  onApply
}: ApplyTemplateWizardProps) {
  const [step, setStep] = useState<'select' | 'preview'>('select')
  const [selectedMode, setSelectedMode] = useState<TemplateApplicationMode>('styles-only')
  const [isApplying, setIsApplying] = useState(false)
  
  const { generatePreview, previewData, loading } = useTemplateApplicationSafe()

  const applicationModes = [
    {
      id: 'styles-only' as TemplateApplicationMode,
      title: 'Styles Only',
      description: 'Apply colors, fonts, and visual styling while keeping your current layout',
      icon: <Palette className="w-5 h-5" />,
      changes: [
        'Color themes and palettes',
        'Typography and font styles',
        'Component styling (callouts, tables)',
        'Visual effects and spacing'
      ],
      preserves: [
        'Document structure and sections',
        'Page layouts and column settings',
        'All content and blocks',
        'Current layout intents'
      ],
      risk: 'low'
    },
    {
      id: 'styles-and-masters' as TemplateApplicationMode,
      title: 'Styles + Page Masters',
      description: 'Update styling and page layouts (margins, columns) but keep content structure',
      icon: <Layout className="w-5 h-5" />,
      changes: [
        'All styling changes above',
        'Page margins and dimensions',
        'Column layouts and spacing',
        'Header and footer settings'
      ],
      preserves: [
        'Document sections and flows',
        'All content blocks',
        'Block order and hierarchy',
        'Cross-references and links'
      ],
      risk: 'medium'
    },
    {
      id: 'full-layout' as TemplateApplicationMode,
      title: 'Full Layout Migration',
      description: 'Complete template application with smart content migration to new structure',
      icon: <FileText className="w-5 h-5" />,
      changes: [
        'All changes above',
        'Section layout intents',
        'Document structure optimization',
        'Block organization improvements'
      ],
      preserves: [
        'All content (no data loss)',
        'Semantic meaning of blocks',
        'Cross-references (updated)',
        'Media and figures'
      ],
      risk: 'high'
    }
  ]

  const selectedModeData = applicationModes.find(m => m.id === selectedMode)!

  const handleNext = async () => {
    if (step === 'select') {
      // Generate preview for the selected mode
      await generatePreview(template, document, selectedMode)
      setStep('preview')
    }
  }

  const handleBack = () => {
    setStep('select')
  }

  const handleApply = async () => {
    setIsApplying(true)
    try {
      await onApply(selectedMode)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to apply template:', error)
    } finally {
      setIsApplying(false)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-muted-foreground bg-muted border-border'
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <CheckCircle className="w-4 h-4" />
      case 'medium': return <AlertTriangle className="w-4 h-4" />
      case 'high': return <Info className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Apply Template</DialogTitle>
              <DialogDescription>
                Apply "{template.name}" to your document with safe content migration
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Step {step === 'select' ? '1' : '2'} of 2
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {step === 'select' && (
            <div className="space-y-6 h-full">
              <div>
                <h3 className="text-lg font-semibold mb-2">Choose Application Mode</h3>
                <p className="text-muted-foreground">
                  Select how extensively you want to apply the template to your document
                </p>
              </div>

              <ScrollArea className="flex-1 pr-4">
                <RadioGroup
                  value={selectedMode}
                  onValueChange={(value) => setSelectedMode(value as TemplateApplicationMode)}
                  className="space-y-4"
                >
                  {applicationModes.map((mode) => (
                    <div key={mode.id} className="relative">
                      <Label
                        htmlFor={mode.id}
                        className="cursor-pointer block"
                      >
                        <Card className={`transition-all duration-200 hover:shadow-md ${
                          selectedMode === mode.id ? 'ring-2 ring-primary shadow-md' : ''
                        }`}>
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <RadioGroupItem
                                value={mode.id}
                                id={mode.id}
                                className="mt-1"
                              />
                              <div className="flex-1 space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                      {mode.icon}
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-lg">{mode.title}</h4>
                                      <p className="text-muted-foreground">{mode.description}</p>
                                    </div>
                                  </div>
                                  <Badge 
                                    variant="outline" 
                                    className={`${getRiskColor(mode.risk)} flex items-center gap-1`}
                                  >
                                    {getRiskIcon(mode.risk)}
                                    {mode.risk} risk
                                  </Badge>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <h5 className="font-medium text-sm text-green-700 mb-2">
                                      ✓ Will Change
                                    </h5>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                      {mode.changes.map((change, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                          <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                          {change}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-sm text-blue-700 mb-2">
                                      ✓ Will Preserve
                                    </h5>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                      {mode.preserves.map((preserve, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                          <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                          {preserve}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </ScrollArea>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Preview Changes</h3>
                  <p className="text-muted-foreground">
                    Review the changes before applying them to your document
                  </p>
                </div>
                <Badge variant="outline" className="flex items-center gap-2">
                  {selectedModeData.icon}
                  {selectedModeData.title}
                </Badge>
              </div>

              <div className="flex-1 min-h-0">
                <TemplateApplicationPreview
                  template={template}
                  document={document}
                  mode={selectedMode}
                  previewData={previewData}
                  loading={loading}
                />
              </div>
            </div>
          )}
        </div>

        <Separator className="flex-shrink-0" />

        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            {step === 'preview' && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            
            {step === 'select' ? (
              <Button
                onClick={handleNext}
                className="flex items-center gap-2"
              >
                Preview Changes
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleApply}
                disabled={isApplying}
                className="flex items-center gap-2"
              >
                {isApplying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Apply Template
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}