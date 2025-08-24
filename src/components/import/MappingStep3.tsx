import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  AlertCircle,
  Edit3,
  FileText,
  Quote,
  MessageSquare,
  List,
  Settings
} from 'lucide-react'
import { MappingConfig } from './MappingWizard'
import { IRDocument, IRBlock, IRSection } from '@/lib/ir-types'
import { SemanticDocument } from '@/lib/document-model'
import { mapIRToPageMuse } from '@/lib/ir-mapper'

interface MappingStep3Props {
  config: MappingConfig
  updateConfig: (updates: Partial<MappingConfig>) => void
  irDocument: IRDocument
  onPreviewUpdate: (document: SemanticDocument) => void
}

interface SectionCard {
  id: string
  title: string
  blocks: BlockCard[]
  canSplit: boolean
  canMerge: boolean
}

interface BlockCard {
  id: string
  type: string
  content: string
  level?: number
  hasIssues?: boolean
  issues?: string[]
  isCaption?: boolean
  isDecorative?: boolean
  hasTableHeader?: boolean
}

export function MappingStep3({ config, updateConfig, irDocument, onPreviewUpdate }: MappingStep3Props) {
  const [sections, setSections] = useState<SectionCard[]>([])
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')

  const generateSections = useCallback(() => {
    const sectionCards: SectionCard[] = []
    
    irDocument.sections.forEach((section, sectionIndex) => {
      const blocks: BlockCard[] = section.blocks.map((block, blockIndex) => {
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

        return {
          id: `${sectionIndex}-${blockIndex}`,
          type: block.type,
          content: getBlockPreviewText(block),
          level: block.type === 'heading' ? block.content?.level : undefined,
          hasIssues: issues.length > 0,
          issues,
          isCaption: config.structuralEdits.captionMarks.includes(`${sectionIndex}-${blockIndex}`),
          isDecorative: config.structuralEdits.decorativeImages.includes(`${sectionIndex}-${blockIndex}`),
          hasTableHeader: config.structuralEdits.tableHeaderRows[`${sectionIndex}-${blockIndex}`] ?? false
        }
      })

      sectionCards.push({
        id: `section-${sectionIndex}`,
        title: section.title || `Section ${sectionIndex + 1}`,
        blocks,
        canSplit: blocks.length > 2,
        canMerge: sectionIndex < irDocument.sections.length - 1
      })
    })

    setSections(sectionCards)
  }, [irDocument, config.structuralEdits])

  const getBlockPreviewText = (block: IRBlock): string => {
    switch (block.type) {
      case 'heading':
        return block.content?.text || 'Untitled Heading'
      case 'paragraph':
        const content = typeof block.content === 'string' ? block.content : block.content?.text || ''
        return content.length > 80 ? `${content.substring(0, 80)}...` : content
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

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'heading': return Type
      case 'paragraph': return FileText
      case 'figure': return ImageIcon
      case 'table': return TableIcon
      case 'list': return List
      case 'callout': return MessageSquare
      case 'quote': return Quote
      default: return FileText
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

  const splitSection = (sectionId: string, atBlockIndex: number) => {
    // Logic to split section - this would modify the IR staging
    console.log(`Split section ${sectionId} at block ${atBlockIndex}`)
    // For now, just trigger a re-render
    generateSections()
  }

  const mergeSections = (sectionId: string) => {
    // Logic to merge with next section - this would modify the IR staging
    console.log(`Merge section ${sectionId} with next`)
    // For now, just trigger a re-render
    generateSections()
  }

  const updateSectionTitle = (sectionId: string, title: string) => {
    // Logic to update section title in IR staging
    console.log(`Update section ${sectionId} title to: ${title}`)
    setEditingTitle(null)
    setNewTitle('')
    generateSections()
  }

  const startEditingTitle = (sectionId: string, currentTitle: string) => {
    setEditingTitle(sectionId)
    setNewTitle(currentTitle)
  }

  useEffect(() => {
    generateSections()
  }, [generateSections])

  useEffect(() => {
    // Generate preview document and notify parent
    try {
      const mappedDocument = mapIRToPageMuse(irDocument)
      onPreviewUpdate(mappedDocument)
    } catch (error) {
      console.error('Failed to generate preview:', error)
    }
  }, [irDocument, onPreviewUpdate])

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Source Panel */}
      <div className="w-1/3 flex flex-col">
        <Card className="flex-1 border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Source Structure
            </CardTitle>
            <CardDescription>
              Original imported content structure
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="p-4 space-y-2">
                {irDocument.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="space-y-1">
                    <div className="p-2 rounded bg-muted/50 border-l-2 border-l-blue-400">
                      <p className="text-sm font-medium text-blue-700">
                        {section.title || `Section ${sectionIndex + 1}`}
                      </p>
                    </div>
                    {section.blocks.map((block, blockIndex) => {
                      const Icon = getBlockIcon(block.type)
                      return (
                        <div key={blockIndex} className="ml-4 p-2 rounded text-xs text-muted-foreground bg-muted/20">
                          <div className="flex items-center gap-2">
                            <Icon className="w-3 h-3" />
                            <span className="truncate">{getBlockPreviewText(block)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Result Panel with Section Cards */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Result Preview</h3>
            <p className="text-sm text-muted-foreground">
              Structured sections with micro-action controls
            </p>
          </div>
          <Badge variant="secondary">
            {sections.length} sections
          </Badge>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-4">
            {sections.map((section, sectionIndex) => (
              <Card 
                key={section.id}
                className={`border-0 shadow-soft transition-all duration-200 ${
                  selectedSection === section.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedSection(selectedSection === section.id ? null : section.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {editingTitle === section.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                            onBlur={() => updateSectionTitle(section.id, newTitle)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateSectionTitle(section.id, newTitle)
                              }
                              if (e.key === 'Escape') {
                                setEditingTitle(null)
                                setNewTitle('')
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <>
                          <CardTitle className="text-base">{section.title}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              startEditingTitle(section.id, section.title)
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {section.blocks.length} blocks
                      </Badge>
                      
                      {section.canSplit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            splitSection(section.id, Math.floor(section.blocks.length / 2))
                          }}
                          className="h-6 w-6 p-0"
                          title="Split section"
                        >
                          <Split className="w-3 h-3" />
                        </Button>
                      )}
                      
                      {section.canMerge && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            mergeSections(section.id)
                          }}
                          className="h-6 w-6 p-0"
                          title="Merge with next section"
                        >
                          <Merge className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    {section.blocks.map((block, blockIndex) => {
                      const Icon = getBlockIcon(block.type)
                      const isSelected = selectedBlock === block.id
                      
                      return (
                        <div
                          key={block.id}
                          className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                            isSelected 
                              ? 'border-primary bg-primary/5' 
                              : 'border-muted hover:border-accent hover:bg-muted/30'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedBlock(isSelected ? null : block.id)
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                isSelected ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {block.level && (
                                    <Badge variant="outline" className="text-xs">
                                      H{block.level}
                                    </Badge>
                                  )}
                                  {block.isCaption && (
                                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                                      Caption
                                    </Badge>
                                  )}
                                  {block.isDecorative && (
                                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                                      Decorative
                                    </Badge>
                                  )}
                                  {block.hasTableHeader && (
                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                      Header Row
                                    </Badge>
                                  )}
                                  {block.hasIssues && (
                                    <AlertCircle className="w-3 h-3 text-warning" />
                                  )}
                                </div>
                                <p className="text-sm truncate">{block.content}</p>
                                {block.issues && block.issues.length > 0 && (
                                  <p className="text-xs text-warning mt-1">
                                    {block.issues[0]}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {isSelected && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleCaption(block.id)
                                  }}
                                  className="h-6 px-2 text-xs"
                                  title={block.isCaption ? "Remove caption mark" : "Mark as caption"}
                                >
                                  {block.isCaption ? "Remove Caption" : "Caption"}
                                </Button>
                                
                                {block.type === 'figure' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleDecorativeImage(block.id)
                                    }}
                                    className="h-6 px-2 text-xs"
                                    title={block.isDecorative ? "Mark as content" : "Mark as decorative"}
                                  >
                                    {block.isDecorative ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                  </Button>
                                )}
                                
                                {block.type === 'table' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleTableHeader(block.id)
                                    }}
                                    className="h-6 px-2 text-xs"
                                    title={block.hasTableHeader ? "Remove header row" : "Mark header row"}
                                  >
                                    {block.hasTableHeader ? "No Header" : "Header"}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Action Panel (if needed) */}
      {(selectedBlock || selectedSection) && (
        <div className="w-80 flex flex-col">
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Modify the selected {selectedBlock ? 'block' : 'section'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedBlock && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Block Actions</p>
                  <div className="space-y-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => toggleCaption(selectedBlock)}
                    >
                      {config.structuralEdits.captionMarks.includes(selectedBlock) 
                        ? "Remove Caption Mark" 
                        : "Mark as Caption"
                      }
                    </Button>
                    
                    {sections.find(s => s.blocks.some(b => b.id === selectedBlock))?.blocks.find(b => b.id === selectedBlock)?.type === 'figure' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => toggleDecorativeImage(selectedBlock)}
                      >
                        {config.structuralEdits.decorativeImages.includes(selectedBlock) 
                          ? "Mark as Content" 
                          : "Mark as Decorative"
                        }
                      </Button>
                    )}
                    
                    {sections.find(s => s.blocks.some(b => b.id === selectedBlock))?.blocks.find(b => b.id === selectedBlock)?.type === 'table' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => toggleTableHeader(selectedBlock)}
                      >
                        {config.structuralEdits.tableHeaderRows[selectedBlock] 
                          ? "Remove Header Row" 
                          : "Mark Header Row"
                        }
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {selectedSection && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Section Actions</p>
                  <div className="space-y-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => splitSection(selectedSection, 1)}
                    >
                      <Split className="w-3 h-3 mr-2" />
                      Split Section
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => mergeSections(selectedSection)}
                    >
                      <Merge className="w-3 h-3 mr-2" />
                      Merge with Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}