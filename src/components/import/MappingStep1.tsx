import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Plus, RefreshCw, Replace, MousePointer } from 'lucide-react'
import { MappingConfig } from './MappingWizard'
import { IRDocument } from '@/lib/ir-types'
import { SemanticDocument } from '@/lib/document-model'
import { useTemplates } from '@/hooks/useSupabaseData'
import { Template } from '@/hooks/useSupabaseData'

interface MappingStep1Props {
  config: MappingConfig
  updateConfig: (updates: Partial<MappingConfig>) => void
  currentDocument?: SemanticDocument
  irDocument: IRDocument
}

export function MappingStep1({ config, updateConfig, currentDocument, irDocument }: MappingStep1Props) {
  const { templates, loading } = useTemplates()

  const modeOptions = [
    {
      value: 'new-document' as const,
      label: 'New Document',
      description: 'Create a new document from the imported content',
      icon: FileText,
      available: true
    },
    {
      value: 'append-section' as const,
      label: 'Append Section',
      description: 'Add imported content as new sections to the current document',
      icon: Plus,
      available: !!currentDocument
    },
    {
      value: 'insert-at-cursor' as const,
      label: 'Insert at Cursor',
      description: 'Insert content at the current cursor position',
      icon: MousePointer,
      available: !!currentDocument
    },
    {
      value: 'replace-selection' as const,
      label: 'Replace Selection',
      description: 'Replace currently selected content with imported content',
      icon: Replace,
      available: !!currentDocument
    }
  ]

  const availableModes = modeOptions.filter(mode => mode.available)

  return (
    <div className="space-y-6 p-6 h-full overflow-auto">
      {/* Content Summary */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Content Summary
          </CardTitle>
          <CardDescription>
            Overview of the content being imported
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {irDocument.sections.length}
              </div>
              <div className="text-sm text-muted-foreground">Sections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {irDocument.sections.reduce((acc, section) => acc + section.blocks.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Blocks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {irDocument.sections.reduce((acc, section) => 
                  acc + section.blocks.filter(block => block.type === 'heading').length, 0
                )}
              </div>
              <div className="text-sm text-muted-foreground">Headings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {irDocument.sections.reduce((acc, section) => 
                  acc + section.blocks.filter(block => ['table', 'figure'].includes(block.type)).length, 0
                )}
              </div>
              <div className="text-sm text-muted-foreground">Tables & Figures</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Mode Selection */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Import Mode</CardTitle>
          <CardDescription>
            Choose how the imported content should be integrated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {availableModes.map((mode) => {
              const Icon = mode.icon
              const isSelected = config.mode === mode.value
              
              return (
                <Card 
                  key={mode.value}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'border-primary shadow-glow bg-primary/5' 
                      : 'border-muted hover:border-accent hover:shadow-soft'
                  }`}
                  onClick={() => updateConfig({ mode: mode.value })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-0.5 ${
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label className={`font-medium ${
                            isSelected ? 'text-primary' : 'text-foreground'
                          }`}>
                            {mode.label}
                          </Label>
                          {isSelected && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              Selected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {mode.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Template Selection */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Template (Optional)</CardTitle>
          <CardDescription>
            Apply a template's styling and structure to the imported content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Select
              value={config.template?.id || 'none'}
              onValueChange={(value) => {
                if (value === 'none') {
                  updateConfig({ template: undefined })
                } else {
                  const template = templates.find(t => t.id === value)
                  updateConfig({ template })
                }
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Template</SelectItem>
                {loading ? (
                  <SelectItem value="loading" disabled>Loading templates...</SelectItem>
                ) : (
                  templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <span>{template.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateConfig({ template: undefined })}
              disabled={!config.template}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          
          {config.template && (
            <Card className="border-l-4 border-l-primary bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-primary mb-1">
                      {config.template.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {config.template.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{config.template.category}</Badge>
                      <span className="text-xs text-muted-foreground">
                        Used {config.template.usage_count} times
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Theme Override */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Theme Override (Optional)</CardTitle>
          <CardDescription>
            Override the template's default theme with a specific colorway
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={config.themeOverride || 'default'}
            onValueChange={(value) => {
              updateConfig({ themeOverride: value === 'default' ? undefined : value })
            }}
            disabled={!config.template}
          >
            <SelectTrigger>
              <SelectValue placeholder="Use template default theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Use Template Default</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="creative">Creative</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
            </SelectContent>
          </Select>
          
          {!config.template && (
            <p className="text-xs text-muted-foreground mt-2">
              Select a template first to enable theme overrides
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}