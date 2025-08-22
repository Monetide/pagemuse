import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  ChevronUp, 
  ChevronDown, 
  Image as ImageIcon, 
  Table as TableIcon,
  Type,
  Split,
  Merge,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react'
import { MappingConfig } from './MappingWizard'
import { IRDocument } from '@/lib/ir-types'
import { SemanticDocument } from '@/lib/document-model'
import { mapIRToPageMuse } from '@/lib/ir-mapper'

interface MappingStep3Props {
  config: MappingConfig
  updateConfig: (updates: Partial<MappingConfig>) => void
  irDocument: IRDocument
  onPreviewUpdate: (document: SemanticDocument) => void
}

interface DiffItem {
  id: string
  type: 'block' | 'section'
  originalType?: string
  newType?: string
  content: string
  changeType: 'added' | 'modified' | 'unchanged'
  level?: number
  blockType?: string
  hasIssues?: boolean
  issues?: string[]
}

export function MappingStep3({ config, updateConfig, irDocument, onPreviewUpdate }: MappingStep3Props) {
  const [previewDocument, setPreviewDocument] = useState<SemanticDocument | null>(null)
  const [diffItems, setDiffItems] = useState<DiffItem[]>([])
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  const generatePreview = useCallback(() => {
    try {
      // Apply the mapping configuration to generate semantic document
      const mappedDocument = mapIRToPageMuse(irDocument)
      setPreviewDocument(mappedDocument)
      onPreviewUpdate(mappedDocument)
      
      // Generate diff items for visualization
      const items: DiffItem[] = []
      let itemId = 0
      
      mappedDocument.sections.forEach((section, sectionIndex) => {
        // Add section header
        items.push({
          id: `section-${sectionIndex}`,
          type: 'section',
          content: section.name,
          changeType: 'added',
          hasIssues: false
        })
        
        section.flows.forEach(flow => {
          flow.blocks.forEach((block, blockIndex) => {
            let issues: string[] = []
            
            // Detect potential issues
            if (block.type === 'heading' && block.content?.level > 4) {
              issues.push('Deep heading level may affect TOC')
            }
            if (block.type === 'figure' && !block.content?.alt) {
              issues.push('Missing alt text for accessibility')
            }
            if (block.type === 'table' && !block.content?.hasHeaderRow) {
              issues.push('Table may need header row designation')
            }
            
            items.push({
              id: `block-${sectionIndex}-${blockIndex}`,
              type: 'block',
              content: getBlockPreviewText(block),
              changeType: 'added',
              level: block.type === 'heading' ? block.content?.level : undefined,
              blockType: block.type,
              hasIssues: issues.length > 0,
              issues
            })
          })
        })
      })
      
      setDiffItems(items)
    } catch (error) {
      console.error('Failed to generate preview:', error)
    }
  }, [config, irDocument, onPreviewUpdate])

  const getBlockPreviewText = (block: any): string => {
    switch (block.type) {
      case 'heading':
        return block.content?.text || 'Untitled Heading'
      case 'paragraph':
        return block.content?.length > 100 
          ? `${block.content.substring(0, 100)}...`
          : block.content || 'Empty paragraph'
      case 'table':
        return `Table (${block.content?.headers?.length || 0} columns)`
      case 'figure':
        return `Figure: ${block.content?.caption || block.content?.alt || 'Untitled'}`
      case 'list':
        return `${block.content?.type === 'ordered' ? 'Ordered' : 'Unordered'} List (${block.content?.items?.length || 0} items)`
      case 'callout':
        return `${block.content?.type || 'Note'}: ${block.content?.content || 'Empty callout'}`
      case 'quote':
        return `"${block.content?.content || 'Empty quote'}"`
      default:
        return `${block.type} block`
    }
  }

  const promoteHeading = (blockId: string) => {
    const item = diffItems.find(item => item.id === blockId)
    if (item && item.level && item.level > 1) {
      updateConfig({
        structuralEdits: {
          ...config.structuralEdits,
          headingPromotions: {
            ...config.structuralEdits.headingPromotions,
            [blockId]: item.level - 1
          }
        }
      })
    }
  }

  const demoteHeading = (blockId: string) => {
    const item = diffItems.find(item => item.id === blockId)
    if (item && item.level && item.level < 6) {
      updateConfig({
        structuralEdits: {
          ...config.structuralEdits,
          headingDemotions: {
            ...config.structuralEdits.headingDemotions,
            [blockId]: item.level + 1
          }
        }
      })
    }
  }

  const toggleCaption = (blockId: string) => {
    const isCaption = config.structuralEdits.captionMarks.includes(blockId)
    updateConfig({
      structuralEdits: {
        ...config.structuralEdits,
        captionMarks: isCaption 
          ? config.structuralEdits.captionMarks.filter(id => id !== blockId)
          : [...config.structuralEdits.captionMarks, blockId]
      }
    })
  }

  const toggleDecorativeImage = (blockId: string) => {
    const isDecorative = config.structuralEdits.decorativeImages.includes(blockId)
    updateConfig({
      structuralEdits: {
        ...config.structuralEdits,
        decorativeImages: isDecorative 
          ? config.structuralEdits.decorativeImages.filter(id => id !== blockId)
          : [...config.structuralEdits.decorativeImages, blockId]
      }
    })
  }

  const toggleTableHeader = (blockId: string) => {
    const hasHeader = config.structuralEdits.tableHeaderRows[blockId]
    updateConfig({
      structuralEdits: {
        ...config.structuralEdits,
        tableHeaderRows: {
          ...config.structuralEdits.tableHeaderRows,
          [blockId]: !hasHeader
        }
      }
    })
  }

  useEffect(() => {
    generatePreview()
  }, [generatePreview])

  return (
    <div className="flex h-full gap-6 p-6">
      {/* Source/Result Preview */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Document Preview</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={generatePreview}
          >
            Refresh Preview
          </Button>
        </div>
        
        <Card className="flex-1 border-0 shadow-soft">
          <CardContent className="p-0 h-full">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {diffItems.map((item) => (
                  <div
                    key={item.id}
                    className={`group relative rounded-lg border transition-all duration-200 cursor-pointer ${
                      selectedItem === item.id 
                        ? 'border-primary bg-primary/5 shadow-soft' 
                        : 'border-transparent hover:border-muted hover:bg-muted/30'
                    } ${
                      item.type === 'section' 
                        ? 'border-l-4 border-l-primary bg-primary/5 font-medium' 
                        : 'ml-4'
                    }`}
                    onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                  >
                    <div className="p-3 flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {item.type === 'block' && (
                            <>
                              {item.blockType === 'heading' && (
                                <Type className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              )}
                              {item.blockType === 'figure' && (
                                <ImageIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              )}
                              {item.blockType === 'table' && (
                                <TableIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              )}
                              {item.level && (
                                <Badge variant="outline" className="text-xs">
                                  H{item.level}
                                </Badge>
                              )}
                            </>
                          )}
                          {item.hasIssues && (
                            <AlertCircle className="w-4 h-4 text-warning" />
                          )}
                        </div>
                        <p className="text-sm truncate">{item.content}</p>
                        {item.issues && item.issues.length > 0 && (
                          <div className="mt-1 text-xs text-warning">
                            {item.issues[0]}
                          </div>
                        )}
                      </div>
                      
                      <Badge 
                        variant={item.changeType === 'added' ? 'default' : 'secondary'}
                        className="text-xs ml-2"
                      >
                        {item.changeType}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Edit Tools Panel */}
      <div className="w-80 flex flex-col">
        <h3 className="text-lg font-semibold mb-4">Quick Fixups</h3>
        
        {selectedItem ? (
          <Card className="flex-1 border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Edit Selected Item</CardTitle>
              <CardDescription>
                Make quick adjustments to the selected content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const item = diffItems.find(i => i.id === selectedItem)
                if (!item) return null

                if (item.blockType === 'heading') {
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Heading Level</span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => promoteHeading(item.id)}
                            disabled={!item.level || item.level <= 1}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <span className="mx-2 text-sm font-mono">H{item.level}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => demoteHeading(item.id)}
                            disabled={!item.level || item.level >= 6}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => toggleCaption(item.id)}
                      >
                        {config.structuralEdits.captionMarks.includes(item.id) 
                          ? 'Remove Caption Mark' 
                          : 'Mark as Caption'
                        }
                      </Button>
                    </div>
                  )
                }

                if (item.blockType === 'figure') {
                  return (
                    <div className="space-y-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => toggleDecorativeImage(item.id)}
                      >
                        {config.structuralEdits.decorativeImages.includes(item.id) ? (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Mark as Content Image
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Mark as Decorative
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => toggleCaption(item.id)}
                      >
                        {config.structuralEdits.captionMarks.includes(item.id) 
                          ? 'Remove Caption Mark' 
                          : 'Mark as Caption'
                        }
                      </Button>
                    </div>
                  )
                }

                if (item.blockType === 'table') {
                  return (
                    <div className="space-y-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => toggleTableHeader(item.id)}
                      >
                        {config.structuralEdits.tableHeaderRows[item.id] 
                          ? 'Remove Header Row' 
                          : 'Mark Header Row'
                        }
                      </Button>
                    </div>
                  )
                }

                return (
                  <div className="space-y-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => toggleCaption(item.id)}
                    >
                      {config.structuralEdits.captionMarks.includes(item.id) 
                        ? 'Remove Caption Mark' 
                        : 'Mark as Caption'
                      }
                    </Button>
                  </div>
                )
              })()}
              
              {/* Section Operations */}
              <Separator />
              <div className="space-y-2">
                <Button size="sm" variant="outline" className="w-full">
                  <Split className="w-4 h-4 mr-2" />
                  Split Section Here
                </Button>
                <Button size="sm" variant="outline" className="w-full">
                  <Merge className="w-4 h-4 mr-2" />
                  Merge with Next
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex-1 border-0 shadow-soft">
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                <Type className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  Select an item from the preview to edit its properties
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Statistics */}
        <Card className="mt-4 border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Import Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center">
                <div className="font-semibold text-primary">
                  {diffItems.filter(item => item.type === 'section').length}
                </div>
                <div className="text-muted-foreground">Sections</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-primary">
                  {diffItems.filter(item => item.type === 'block').length}
                </div>
                <div className="text-muted-foreground">Blocks</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-warning">
                  {diffItems.filter(item => item.hasIssues).length}
                </div>
                <div className="text-muted-foreground">Issues</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-success">
                  {Object.keys(config.structuralEdits.headingPromotions).length + 
                   Object.keys(config.structuralEdits.headingDemotions).length +
                   config.structuralEdits.captionMarks.length +
                   config.structuralEdits.decorativeImages.length}
                </div>
                <div className="text-muted-foreground">Edits</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}