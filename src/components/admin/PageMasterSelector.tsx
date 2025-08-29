import { useState } from 'react'
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Columns, Columns2, Palette } from 'lucide-react'
import { PAGE_MASTER_PRESETS, type PageMasterPreset } from '@/lib/page-masters'

export interface PageMasterSelection {
  cover?: string | null
  body?: string | null
  dataAppendix?: string | null
}

interface PageMasterSelectorProps {
  selection?: PageMasterSelection
  onSelectionChange: (selection: PageMasterSelection) => void
  className?: string
  usageType?: string // Add usage type to control which masters to show
}

const PageMasterSelector = React.memo(function PageMasterSelector({ 
  selection = { cover: null, body: null, dataAppendix: null }, 
  onSelectionChange, 
  className,
  usageType
}: PageMasterSelectorProps) {
  const [pageSize, setPageSize] = useState<'Letter' | 'A4'>('Letter')

  const coverPresets = PAGE_MASTER_PRESETS.filter(p => p.layoutType === 'cover-fullbleed' && p.pageSize === pageSize)
  const bodyPresets = PAGE_MASTER_PRESETS.filter(p => p.layoutType.startsWith('body-') && p.pageSize === pageSize)
  const appendixPresets = PAGE_MASTER_PRESETS.filter(p => p.layoutType === 'data-appendix' && p.pageSize === pageSize)
  
  // Show appendix section only for report and annual-report
  const showAppendix = usageType === 'report' || usageType === 'annual-report'

  const updateSelection = (type: 'cover' | 'body' | 'dataAppendix', presetId: string) => {
    const newSelection = { ...selection, [type]: presetId }
    onSelectionChange(newSelection)
  }

  const getLayoutIcon = (layoutType: string) => {
    switch (layoutType) {
      case 'cover-fullbleed':
        return <FileText className="w-4 h-4" />
      case 'body-1col':
        return <Columns className="w-4 h-4" />
      case 'body-2col':
        return <Columns2 className="w-4 h-4" />
      case 'data-appendix':
        return <Palette className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const renderPresetCard = (preset: PageMasterPreset, type: 'cover' | 'body' | 'dataAppendix', isSelected: boolean) => (
    <div
      key={preset.id}
      className={`relative border rounded-lg p-3 cursor-pointer transition-all hover:border-primary/50 ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border'
      }`}
      onClick={() => updateSelection(type, preset.id)}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-md ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          {getLayoutIcon(preset.layoutType)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{preset.name}</h4>
            <RadioGroupItem 
              value={preset.id} 
              id={preset.id}
              className="ml-2"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
          
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge variant="outline" className="text-xs">
              {preset.pageMaster.columns === 1 ? '1 Column' : `${preset.pageMaster.columns} Columns`}
            </Badge>
            {preset.pageMaster.hasHeader && (
              <Badge variant="outline" className="text-xs">Header</Badge>
            )}
            {preset.pageMaster.hasFooter && (
              <Badge variant="outline" className="text-xs">Footer</Badge>
            )}
            {preset.pageMaster.baselineGrid && (
              <Badge variant="outline" className="text-xs">Grid</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Visual preview */}
      <div className="mt-3 bg-muted/30 rounded p-2">
        <div className="bg-card border rounded h-16 relative overflow-hidden">
          {/* Margins visualization */}
          <div 
            className="absolute inset-0 border border-dashed border-muted-foreground/30"
            style={{
              margin: '4px'
            }}
          >
            {/* Header/Footer areas */}
            {preset.pageMaster.hasHeader && (
              <div className="absolute top-0 left-0 right-0 h-2 bg-primary/10" />
            )}
            {preset.pageMaster.hasFooter && (
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-primary/10" />
            )}
            
            {/* Column guides */}
            <div className="absolute inset-2 flex gap-1">
              {Array.from({ length: preset.pageMaster.columns }).map((_, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-primary/5 border border-primary/20 rounded-sm"
                />
              ))}
            </div>
            
            {/* Baseline grid */}
            {preset.pageMaster.baselineGrid && (
              <div className="absolute inset-2 opacity-20">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="border-b border-primary/30"
                    style={{ height: '6px' }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Page Masters
        </CardTitle>
        <CardDescription>
          Select layout templates for different document sections
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Page Size Selector */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Page Size</Label>
          <Tabs value={pageSize} onValueChange={(value) => setPageSize(value as 'Letter' | 'A4')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="Letter">Letter (8.5"×11")</TabsTrigger>
              <TabsTrigger value="A4">A4 (210×297mm)</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Cover Master Selection */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Cover Master</Label>
          <RadioGroup 
            value={selection.cover || ''} 
            onValueChange={(value) => updateSelection('cover', value)}
          >
            <div className="space-y-2">
              {coverPresets.map(preset => 
                renderPresetCard(preset, 'cover', selection.cover === preset.id)
              )}
            </div>
          </RadioGroup>
        </div>

        {/* Body Master Selection */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Body Master</Label>
          <RadioGroup 
            value={selection.body || ''} 
            onValueChange={(value) => updateSelection('body', value)}
          >
            <div className="space-y-2">
              {bodyPresets.map(preset => 
                renderPresetCard(preset, 'body', selection.body === preset.id)
              )}
            </div>
          </RadioGroup>
        </div>

        {/* Data Appendix Master Selection - Only show for reports */}
        {showAppendix && (
          <div>
            <Label className="text-sm font-medium mb-3 block">Data Appendix Master</Label>
            <RadioGroup 
              value={selection.dataAppendix || ''} 
              onValueChange={(value) => updateSelection('dataAppendix', value)}
            >
              <div className="space-y-2">
                {appendixPresets.map(preset => 
                  renderPresetCard(preset, 'dataAppendix', selection.dataAppendix === preset.id)
                )}
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Quick Selection Buttons */}
        <div className="pt-4 border-t">
          <Label className="text-sm font-medium mb-2 block">Quick Select</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSelectionChange({
                  cover: `cover-fullbleed-${pageSize.toLowerCase()}`,
                  body: `body-1col-${pageSize.toLowerCase()}`
                })
              }}
            >
              Single Column Set
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSelectionChange({
                  cover: `cover-fullbleed-${pageSize.toLowerCase()}`,
                  body: `body-2col-${pageSize.toLowerCase()}`
                })
              }}
            >
              Two Column Set
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

export { PageMasterSelector }

