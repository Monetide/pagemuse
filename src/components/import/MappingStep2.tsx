import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Section, BookOpen, MessageSquareQuote, Hash } from 'lucide-react'
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
                <Label className="text-sm font-medium">Start new section at H1</Label>
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
                <Label className="text-sm font-medium">Start new section at H2</Label>
                <p className="text-xs text-muted-foreground">
                  Also create sections for H2 headings (creates more sections)
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
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Minimum Heading Level</Label>
            <Select
              value={config.sectionization.minHeadingLevel.toString()}
              onValueChange={(value) => 
                updateConfig({
                  sectionization: { 
                    ...config.sectionization, 
                    minHeadingLevel: parseInt(value) as 1 | 2 | 3 
                  }
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">H1 (Most Sections)</SelectItem>
                <SelectItem value="2">H2 (Balanced)</SelectItem>
                <SelectItem value="3">H3 (Fewer Sections)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Headings below this level won't trigger new sections
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