import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Block, Section, PageMaster } from '@/lib/document-model'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FigureInspector } from './FigureInspector'

interface InspectorProps {
  selectedBlock?: Block
  currentSection: Section
  onBlockUpdate?: (blockId: string, updates: Partial<Block>) => void
  onSectionUpdate?: (sectionId: string, updates: Partial<Section>) => void
  onDeleteBlock?: (blockId: string) => void
  onNewBlock?: (afterBlockId: string, type: Block['type'], content?: any, metadata?: any) => void
}

const PAGE_SIZES = [
  { name: 'Letter', width: 8.5, height: 11 },
  { name: 'A4', width: 8.27, height: 11.69 },
  { name: 'Legal', width: 8.5, height: 14 },
  { name: 'Tabloid', width: 11, height: 17 }
] as const

export const Inspector = ({ 
  selectedBlock, 
  currentSection, 
  onBlockUpdate, 
  onSectionUpdate,
  onDeleteBlock,
  onNewBlock
}: InspectorProps) => {
  const [activeTab, setActiveTab] = useState('block')

  const handleBlockMetadataUpdate = (key: string, value: any) => {
    if (!selectedBlock || !onBlockUpdate) return
    
    const updatedBlock = {
      ...selectedBlock,
      metadata: {
        ...selectedBlock.metadata,
        [key]: value
      }
    }
    onBlockUpdate(selectedBlock.id, updatedBlock)
  }

  const handleBlockContentUpdate = (content: any) => {
    if (!selectedBlock || !onBlockUpdate) return
    
    onBlockUpdate(selectedBlock.id, { content })
  }

  const handlePaginationRulesUpdate = (key: string, value: any) => {
    if (!selectedBlock || !onBlockUpdate) return
    
    const updatedBlock = {
      ...selectedBlock,
      paginationRules: {
        ...selectedBlock.paginationRules,
        [key]: value
      }
    }
    onBlockUpdate(selectedBlock.id, updatedBlock)
  }

  const handlePageMasterUpdate = (updates: Partial<PageMaster>) => {
    if (!onSectionUpdate) return
    
    const updatedSection = {
      ...currentSection,
      pageMaster: {
        ...currentSection.pageMaster,
        ...updates
      }
    }
    onSectionUpdate(currentSection.id, updatedSection)
  }

  const handleMarginUpdate = (side: string, value: number) => {
    const updatedMargins = {
      ...currentSection.pageMaster.margins,
      [side]: value
    }
    handlePageMasterUpdate({ margins: updatedMargins })
  }

  // Handle figure blocks with dedicated inspector
  if (selectedBlock?.type === 'figure') {
    return (
      <div className="w-80 border-l border-border bg-background p-4 overflow-y-auto">
        <FigureInspector
          block={selectedBlock}
          onUpdate={(updates) => onBlockUpdate?.(selectedBlock.id, updates)}
          onDelete={() => onDeleteBlock?.(selectedBlock.id)}
          onDuplicate={() => {
            if (onNewBlock) {
              onNewBlock(selectedBlock.id, selectedBlock.type, selectedBlock.content, selectedBlock.metadata)
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="w-80 border-l border-border bg-muted/30 flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm">Inspector</h3>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
          <TabsTrigger value="block">Block</TabsTrigger>
          <TabsTrigger value="section">Section</TabsTrigger>
        </TabsList>
        
        <TabsContent value="block" className="flex-1 mt-0 p-4 space-y-4">
          {selectedBlock ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Block Type</h4>
                  <Badge variant="outline" className="text-xs">
                    {selectedBlock.type}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Spacing Controls */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Spacing</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Margin Top</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={selectedBlock.metadata?.marginTop || 0}
                      onChange={(e) => handleBlockMetadataUpdate('marginTop', parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Margin Bottom</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={selectedBlock.metadata?.marginBottom || 0}
                      onChange={(e) => handleBlockMetadataUpdate('marginBottom', parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Width Controls */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Width</h4>
                <Select
                  value={selectedBlock.metadata?.width || 'column'}
                  onValueChange={(value) => handleBlockMetadataUpdate('width', value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="column">Column Width</SelectItem>
                    <SelectItem value="full">Full Width</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Pagination Rules */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Page Breaking</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Keep with Next</Label>
                    <Switch
                      checked={selectedBlock.paginationRules?.keepWithNext || false}
                      onCheckedChange={(checked) => handlePaginationRulesUpdate('keepWithNext', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Break Before</Label>
                    <Switch
                      checked={selectedBlock.paginationRules?.breakBefore || false}
                      onCheckedChange={(checked) => handlePaginationRulesUpdate('breakBefore', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Break After</Label>
                    <Switch
                      checked={selectedBlock.paginationRules?.breakAfter || false}
                      onCheckedChange={(checked) => handlePaginationRulesUpdate('breakAfter', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Avoid Break</Label>
                    <Switch
                      checked={selectedBlock.paginationRules?.breakAvoid || false}
                      onCheckedChange={(checked) => handlePaginationRulesUpdate('breakAvoid', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Type-specific Controls */}
              {selectedBlock.type === 'heading' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Heading Level</h4>
                  <Select
                    value={String(selectedBlock.metadata?.level || 1)}
                    onValueChange={(value) => handleBlockMetadataUpdate('level', parseInt(value))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">H1</SelectItem>
                      <SelectItem value="2">H2</SelectItem>
                      <SelectItem value="3">H3</SelectItem>
                      <SelectItem value="4">H4</SelectItem>
                      <SelectItem value="5">H5</SelectItem>
                      <SelectItem value="6">H6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Remove the old figure block handling since it's now handled above */}

              {selectedBlock.type === 'table' && typeof selectedBlock.content === 'object' && selectedBlock.content && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Table Properties</h4>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Striped Rows</Label>
                    <Switch
                      checked={selectedBlock.metadata?.stripedRows || false}
                      onCheckedChange={(checked) => handleBlockMetadataUpdate('stripedRows', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Compact Layout</Label>
                    <Switch
                      checked={selectedBlock.metadata?.compact || false}
                      onCheckedChange={(checked) => handleBlockMetadataUpdate('compact', checked)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Caption</Label>
                    <Textarea
                      value={selectedBlock.content.caption || ''}
                      onChange={(e) => handleBlockContentUpdate({
                        ...selectedBlock.content,
                        caption: e.target.value
                      })}
                      className="text-xs min-h-[60px]"
                      placeholder="Add a table caption..."
                    />
                  </div>
                </div>
              )}

              {selectedBlock.type === 'quote' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Quote Style</h4>
                  <Select
                    value={selectedBlock.metadata?.style || 'default'}
                    onValueChange={(value) => handleBlockMetadataUpdate('style', value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="pullquote">Pull Quote</SelectItem>
                      <SelectItem value="blockquote">Block Quote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedBlock.type === 'spacer' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Spacer Height</h4>
                  <div>
                    <Label className="text-xs">Height (inches)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={selectedBlock.metadata?.height || 0.5}
                      onChange={(e) => handleBlockMetadataUpdate('height', parseFloat(e.target.value) || 0.5)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center space-y-1">
                <p className="text-sm">No block selected</p>
                <p className="text-xs">Click on a block to edit its properties</p>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="section" className="flex-1 mt-0 p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Section</h4>
              <Badge variant="outline" className="text-xs">
                {currentSection.name}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Page Size */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Page Size</h4>
            <Select
              value={currentSection.pageMaster.pageSize}
              onValueChange={(value) => handlePageMasterUpdate({ 
                pageSize: value as 'Letter' | 'A4' | 'Legal' | 'Tabloid' 
              })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map(size => (
                  <SelectItem key={size.name} value={size.name}>
                    {size.name} ({size.width}" × {size.height}")
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Margins */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Margins (inches)</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Top</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={currentSection.pageMaster.margins.top}
                  onChange={(e) => handleMarginUpdate('top', parseFloat(e.target.value) || 0.1)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Right</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={currentSection.pageMaster.margins.right}
                  onChange={(e) => handleMarginUpdate('right', parseFloat(e.target.value) || 0.1)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Bottom</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={currentSection.pageMaster.margins.bottom}
                  onChange={(e) => handleMarginUpdate('bottom', parseFloat(e.target.value) || 0.1)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Left</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={currentSection.pageMaster.margins.left}
                  onChange={(e) => handleMarginUpdate('left', parseFloat(e.target.value) || 0.1)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Columns */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Columns</h4>
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Column Count</Label>
                <Select
                  value={String(currentSection.pageMaster.columns)}
                  onValueChange={(value) => handlePageMasterUpdate({ 
                    columns: parseInt(value) as 1 | 2 | 3
                  })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Column</SelectItem>
                    <SelectItem value="2">2 Columns</SelectItem>
                    <SelectItem value="3">3 Columns</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Column Gap (inches)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={currentSection.pageMaster.columnGap}
                  onChange={(e) => handlePageMasterUpdate({ 
                    columnGap: parseFloat(e.target.value) || 0.1 
                  })}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Header/Footer */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Header & Footer</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Show Header</Label>
                <Switch
                  checked={currentSection.pageMaster.hasHeader}
                  onCheckedChange={(checked) => handlePageMasterUpdate({ hasHeader: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Show Footer</Label>
                <Switch
                  checked={currentSection.pageMaster.hasFooter}
                  onCheckedChange={(checked) => handlePageMasterUpdate({ hasFooter: checked })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Baseline Grid */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Typography</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Baseline Grid</Label>
                <Switch
                  checked={currentSection.pageMaster.baselineGrid}
                  onCheckedChange={(checked) => handlePageMasterUpdate({ baselineGrid: checked })}
                />
              </div>
              <div>
                <Label className="text-xs">Grid Spacing (px)</Label>
                <Select
                  value={String(currentSection.pageMaster.gridSpacing || 24)}
                  onValueChange={(value) => handlePageMasterUpdate({ 
                    gridSpacing: parseInt(value) 
                  })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16">16px</SelectItem>
                    <SelectItem value="20">20px</SelectItem>
                    <SelectItem value="24">24px</SelectItem>
                    <SelectItem value="28">28px</SelectItem>
                    <SelectItem value="32">32px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Inspector