import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  Plus, 
  RefreshCw, 
  Replace, 
  BookOpen,
  FileCheck,
  Briefcase,
  Sidebar,
  Building2,
  AlertCircle
} from 'lucide-react'
import { MappingConfig } from './MappingWizard'
import { IRDocument } from '@/lib/ir-types'
import { SemanticDocument } from '@/lib/document-model'
import { useTemplates } from '@/hooks/useSupabaseData'
import { Template } from '@/hooks/useSupabaseData'
import { useWorkspaces } from '@/hooks/useWorkspaces'

interface MappingStep1Props {
  config: MappingConfig
  updateConfig: (updates: Partial<MappingConfig>) => void
  currentDocument?: SemanticDocument
  irDocument: IRDocument
}

export function MappingStep1({ config, updateConfig, currentDocument, irDocument }: MappingStep1Props) {
  const { templates, loading } = useTemplates()
  const { workspaces } = useWorkspaces()
  
  // Get current workspace from URL params or use first available
  const currentWorkspace = workspaces[0] // This should be improved to get actual current workspace

  const modeOptions = [
    {
      value: 'new-document' as const,
      label: 'Create New Document',
      description: 'Start fresh with a new document in the current workspace',
      icon: FileText,
      available: true,
      showDocTitle: false
    },
    {
      value: 'insert-current' as const,
      label: 'Insert into Current',
      description: 'Add content to the currently open document',
      icon: Plus,
      available: !!currentDocument,
      showDocTitle: true
    },
    {
      value: 'replace-current' as const,
      label: 'Replace Current',
      description: 'Replace all content in the currently open document',
      icon: Replace,
      available: !!currentDocument,
      showDocTitle: true
    }
  ]

  const useCaseOptions = [
    {
      value: 'ebook' as const,
      label: 'eBook',
      description: 'Long-form content with chapters and sections',
      icon: BookOpen,
      color: 'text-blue-600'
    },
    {
      value: 'whitepaper' as const,
      label: 'White Paper',
      description: 'Research document or technical report',
      icon: FileCheck,
      color: 'text-green-600'
    },
    {
      value: 'case-study' as const,
      label: 'Case Study',
      description: 'Business analysis or success story',
      icon: Briefcase,
      color: 'text-purple-600'
    },
    {
      value: 'other' as const,
      label: 'Other',
      description: 'General document type',
      icon: FileText,
      color: 'text-gray-600'
    }
  ]

  const availableModes = modeOptions.filter(mode => mode.available)

  return (
    <div className="space-y-6 p-6 h-full overflow-auto">
      {/* Workspace Context */}
      <Card className="border-0 shadow-soft border-l-4 border-l-primary bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-5 h-5" />
            Target Workspace
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-primary">{currentWorkspace?.name || 'Current Workspace'}</p>
              <p className="text-sm text-muted-foreground">Content will be imported here</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                        <div className="flex items-center gap-2 mb-1">
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
                        <p className="text-sm text-muted-foreground">
                          {mode.description}
                        </p>
                        {mode.showDocTitle && currentDocument && (
                          <div className="mt-2 p-2 rounded bg-muted/50 border-l-2 border-l-orange-400">
                            <div className="flex items-center gap-2 text-sm">
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                              <span className="font-medium">Current Document:</span>
                              <span className="text-muted-foreground">{currentDocument.title}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Use Case Selection */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Document Use Case</CardTitle>
          <CardDescription>
            Select the type of document you're importing to optimize structure and formatting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {useCaseOptions.map((useCase) => {
              const Icon = useCase.icon
              const isSelected = config.useCase === useCase.value
              
              return (
                <Card 
                  key={useCase.value}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'border-primary shadow-glow bg-primary/5' 
                      : 'border-muted hover:border-accent hover:shadow-soft'
                  }`}
                  onClick={() => updateConfig({ useCase: useCase.value })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${
                        isSelected ? 'text-primary' : useCase.color
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label className={`font-medium ${
                            isSelected ? 'text-primary' : 'text-foreground'
                          }`}>
                            {useCase.label}
                          </Label>
                          {isSelected && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                              Selected
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {useCase.description}
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

      {/* Flow Settings */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Flow Settings</CardTitle>
          <CardDescription>
            Configure how content flows and is displayed in the document
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Sidebar className="w-4 h-4" />
                Sidebar Flow
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable sidebar navigation and content flow management
              </p>
            </div>
            <Switch
              checked={config.sidebarFlow}
              onCheckedChange={(checked) => updateConfig({ sidebarFlow: checked })}
            />
          </div>
          
          {config.sidebarFlow && (
            <div className="p-3 rounded-lg bg-muted/30 border-l-2 border-l-blue-400">
              <p className="text-sm text-muted-foreground">
                <strong>Sidebar flow enabled:</strong> Content will be optimized for navigation with 
                table of contents, cross-references, and section jumping.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-6" />

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