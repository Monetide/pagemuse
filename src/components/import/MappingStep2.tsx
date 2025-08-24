import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Section, BookOpen, MessageSquareQuote, Hash, CheckCircle, AlertTriangle, Sidebar, SplitSquareHorizontal } from 'lucide-react'
import { MappingConfig } from './MappingWizard'
import { IRDocument } from '@/lib/ir-types'

interface MappingStep2Props {
  config: MappingConfig
  updateConfig: (updates: Partial<MappingConfig>) => void
  irDocument: IRDocument
}

export function MappingStep2({ config, updateConfig, irDocument }: MappingStep2Props) {
  const headingCounts = irDocument.sections.reduce((acc, section) => {
    section.blocks.forEach(block => {
      if (block.type === 'heading' && block.content?.level) {
        acc[`h${block.content.level}`] = (acc[`h${block.content.level}`] || 0) + 1
      }
    })
    return acc
  }, {} as Record<string, number>)

  const blockquoteCount = irDocument.sections.reduce((acc, section) => 
    acc + section.blocks.filter(block => block.type === 'quote').length, 0
  )

  const calloutCount = irDocument.sections.reduce((acc, section) => 
    acc + section.blocks.filter(block => block.type === 'callout').length, 0
  )

  // Generate mini preview data based on current settings
  const generateSectionPreview = () => {
    const previewItems: Array<{
      id: string
      type: 'section-break' | 'heading' | 'content'
      level?: number
      text: string
      isNewSection?: boolean
    }> = []

    // Sample content structure for preview
    const sampleContent = [
      { type: 'heading', level: 1, text: 'Introduction' },
      { type: 'content', text: 'Lorem ipsum dolor sit amet...' },
      { type: 'heading', level: 2, text: 'Background' },
      { type: 'content', text: 'Consectetur adipiscing elit...' },
      { type: 'heading', level: 2, text: 'Methodology' },
      { type: 'content', text: 'Sed do eiusmod tempor...' },
      { type: 'heading', level: 1, text: 'Results' },
      { type: 'content', text: 'Ut labore et dolore magna...' },
      { type: 'heading', level: 2, text: 'Analysis' },
      { type: 'content', text: 'Aliqua ut enim ad minim...' }
    ]

    sampleContent.forEach((item, index) => {
      const shouldCreateSection = 
        (item.type === 'heading' && item.level === 1 && config.sectionization.newSectionAtH1) ||
        (item.type === 'heading' && item.level === 2 && config.sectionization.newSectionAtH2)

      if (shouldCreateSection) {
        previewItems.push({
          id: `section-${index}`,
          type: 'section-break',
          text: '─── Section Break ───',
          isNewSection: true
        })
      }

      previewItems.push({
        id: `item-${index}`,
        type: item.type as 'heading' | 'content',
        level: item.level,
        text: item.text
      })
    })

    return previewItems
  }

  const previewItems = generateSectionPreview()
  const estimatedSections = previewItems.filter(item => item.type === 'section-break').length + 1

  return (
    <div className="space-y-6 p-6 h-full overflow-auto">
      {/* Content Analysis */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Structure Analysis
          </CardTitle>
          <CardDescription>
            Breakdown of structural elements in your document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, i) => i + 1).map(level => (
              <div key={level} className="text-center">
                <div className="text-xl font-bold text-primary">
                  {headingCounts[`h${level}`] || 0}
                </div>
                <div className="text-sm text-muted-foreground">H{level} Headings</div>
              </div>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{blockquoteCount}</div>
              <div className="text-sm text-muted-foreground">Blockquotes</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{calloutCount}</div>
              <div className="text-sm text-muted-foreground">Callouts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sectionization Rules */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Section className="w-5 h-5" />
            Sectionization Rules
          </CardTitle>
          <CardDescription>
            Define how content should be organized into sections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Start new Section at H1 (default)</Label>
                <p className="text-xs text-muted-foreground">
                  Create a new document section for each H1 heading
                </p>
              </div>
              <Switch
                checked={config.sectionization.newSectionAtH1}
                onCheckedChange={(checked) => 
                  updateConfig({
                    sectionization: { ...config.sectionization, newSectionAtH1: checked }
                  })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Also at H2</Label>
                <p className="text-xs text-muted-foreground">
                  Additionally create sections for H2 headings
                </p>
              </div>
              <Switch
                checked={config.sectionization.newSectionAtH2}
                onCheckedChange={(checked) => 
                  updateConfig({
                    sectionization: { ...config.sectionization, newSectionAtH2: checked }
                  })
                }
              />
            </div>

            {config.sectionization.newSectionAtH2 && (
              <Alert className="border-warning/20 bg-warning/5">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-warning-foreground">
                  <strong>Warning:</strong> Creating sections at H2 level will result in shorter sections 
                  with less content. You'll have approximately {estimatedSections} sections instead of fewer, longer ones.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <Separator />

          {/* Sidebar Flow for Notes/Callouts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Sidebar className="w-4 h-4" />
                  Global Sidebar Flow
                </Label>
                <p className="text-xs text-muted-foreground">
                  Enable sidebar flow option for all sections (can be toggled per section later)
                </p>
              </div>
              <Switch
                checked={config.sidebarFlow}
                onCheckedChange={(checked) => updateConfig({ sidebarFlow: checked })}
              />
            </div>

            {config.sidebarFlow && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border-l-2 border-l-blue-400">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Sidebar flow enabled:</strong> Sections will have the option to place notes and callouts 
                  in a sidebar frame, keeping the main content clean and focused. You can toggle this per section 
                  in the next step.
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Mini Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <SplitSquareHorizontal className="w-4 h-4" />
                Section Preview
              </Label>
              <Badge variant="secondary" className="text-xs">
                ~{estimatedSections} sections
              </Badge>
            </div>
            
            <div className="border rounded-lg p-4 bg-muted/30 max-h-48 overflow-y-auto">
              <div className="space-y-2 text-sm">
                {previewItems.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2">
                    {item.type === 'section-break' ? (
                      <div className="flex-1 flex items-center gap-2 py-1">
                        <div className="h-px bg-primary flex-1"></div>
                        <Badge variant="default" className="text-xs bg-primary/10 text-primary">
                          Section Break
                        </Badge>
                        <div className="h-px bg-primary flex-1"></div>
                      </div>
                    ) : item.type === 'heading' ? (
                      <div className="flex items-center gap-2 py-1">
                        <Hash className={`w-3 h-3 ${
                          item.level === 1 ? 'text-blue-600' : 'text-green-600'
                        }`} />
                        <span className={`font-medium ${
                          item.level === 1 ? 'text-blue-600' : 'text-green-600'
                        }`}>
                          H{item.level}: {item.text}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 py-1 text-muted-foreground ml-5">
                        <span className="text-xs">📄</span>
                        <span className="truncate">{item.text}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Preview shows how content will be split into sections based on your heading settings
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Table of Contents Settings */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Table of Contents
          </CardTitle>
          <CardDescription>
            Configure default TOC generation settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">TOC Depth</Label>
            <Select
              value={config.tocSettings.depth.toString()}
              onValueChange={(value) => 
                updateConfig({
                  tocSettings: { 
                    ...config.tocSettings, 
                    depth: parseInt(value) as 1 | 2 | 3 | 4 | 5 | 6 
                  }
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">H1 only</SelectItem>
                <SelectItem value="2">H1-H2</SelectItem>
                <SelectItem value="3">H1-H3 (Recommended)</SelectItem>
                <SelectItem value="4">H1-H4</SelectItem>
                <SelectItem value="5">H1-H5</SelectItem>
                <SelectItem value="6">H1-H6 (All)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <Label className="text-sm font-medium">Include in TOC</Label>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }, (_, i) => i + 1).map(level => {
                const key = `includeH${level}` as keyof typeof config.tocSettings
                const count = headingCounts[`h${level}`] || 0
                
                return (
                  <div key={level} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">H{level}</Label>
                      {count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                      )}
                    </div>
                    <Switch
                      checked={config.tocSettings[key] as boolean}
                      onCheckedChange={(checked) => 
                        updateConfig({
                          tocSettings: { ...config.tocSettings, [key]: checked }
                        })
                      }
                      disabled={level > config.tocSettings.depth}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Callout Mapping */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareQuote className="w-5 h-5" />
              Callout Mapping
            </CardTitle>
            <CardDescription>
              How should blockquotes and similar elements be handled?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium mb-1">Found Content</div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{blockquoteCount} Blockquotes</span>
                  <span>{calloutCount} Detected Callouts</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Blockquote Handling</Label>
                <Select
                  value={config.calloutMapping.blockquoteHandling}
                  onValueChange={(value: 'quote' | 'callout' | 'auto') => 
                    updateConfig({
                      calloutMapping: { ...config.calloutMapping, blockquoteHandling: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect (Recommended)</SelectItem>
                    <SelectItem value="quote">Always Quote blocks</SelectItem>
                    <SelectItem value="callout">Always Callout blocks</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Auto-detect looks for patterns like "**Note:**" to determine callout type
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Default Callout Type</Label>
                <Select
                  value={config.calloutMapping.defaultCalloutType}
                  onValueChange={(value: 'info' | 'note' | 'warning' | 'error' | 'success') => 
                    updateConfig({
                      calloutMapping: { ...config.calloutMapping, defaultCalloutType: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note (Default)</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used when blockquotes can't be auto-detected as specific callout types
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }