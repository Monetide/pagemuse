import { SemanticDocument, Section, Flow, Block } from '@/lib/document-model'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronRight, ChevronDown, FileText, Layers, List, Hash, Type, Quote, Minus, Image, Table2, MessageSquare } from 'lucide-react'
import { useState } from 'react'

interface StructureTreeProps {
  document: SemanticDocument
  selectedBlockId?: string
  onBlockSelect?: (blockId: string) => void
}

const getBlockIcon = (type: Block['type']) => {
  switch (type) {
    case 'heading': return <Hash className="w-3 h-3" />
    case 'paragraph': return <Type className="w-3 h-3" />
    case 'quote': return <Quote className="w-3 h-3" />
    case 'ordered-list': return <List className="w-3 h-3" />
    case 'unordered-list': return <List className="w-3 h-3" />
    case 'divider': return <Minus className="w-3 h-3" />
    case 'spacer': return <Minus className="w-3 h-3" />
    case 'figure': return <Image className="w-3 h-3" />
    case 'table': return <Table2 className="w-3 h-3" />
    default: return <MessageSquare className="w-3 h-3" />
  }
}

const getBlockTitle = (block: Block) => {
  switch (block.type) {
    case 'heading':
      return `H${block.metadata?.level || 1}: ${String(block.content).substring(0, 30)}${String(block.content).length > 30 ? '...' : ''}`
    case 'paragraph':
      return `Paragraph: ${String(block.content).substring(0, 30)}${String(block.content).length > 30 ? '...' : ''}`
    case 'quote':
      return `Quote: ${String(block.content).substring(0, 30)}${String(block.content).length > 30 ? '...' : ''}`
    case 'figure':
      return `Figure: ${typeof block.content === 'object' && block.content?.caption ? block.content.caption : 'Untitled'}`
    case 'table':
      return `Table: ${typeof block.content === 'object' && block.content?.caption ? block.content.caption : 'Untitled'}`
    case 'ordered-list':
    case 'unordered-list':
      const items = Array.isArray(block.content) ? block.content : [block.content]
      return `List: ${items.length} items`
    case 'divider':
      return 'Divider'
    case 'spacer':
      return `Spacer: ${block.metadata?.height || 0.5}"`
    default:
      return `${block.type}: ${String(block.content).substring(0, 20)}`
  }
}

export const StructureTree = ({ document, selectedBlockId, onBlockSelect }: StructureTreeProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [expandedFlows, setExpandedFlows] = useState<Set<string>>(new Set())

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const toggleFlow = (flowId: string) => {
    const newExpanded = new Set(expandedFlows)
    if (newExpanded.has(flowId)) {
      newExpanded.delete(flowId)
    } else {
      newExpanded.add(flowId)
    }
    setExpandedFlows(newExpanded)
  }

  return (
    <Card className="w-80 h-full">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          🌳 Structure Tree
          <Badge variant="outline" className="text-xs">
            Debug
          </Badge>
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Read-only document structure
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Document Root */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="w-4 h-4" />
              <span>{document.title}</span>
              <Badge variant="secondary" className="text-xs">
                {document.sections.length} sections
              </Badge>
            </div>
            
            {/* Sections */}
            <div className="ml-4 space-y-1">
              {document.sections.map((section) => (
                <div key={section.id}>
                  <div 
                    className="flex items-center gap-1 text-sm hover:bg-accent/50 rounded px-1 py-0.5 cursor-pointer"
                    onClick={() => toggleSection(section.id)}
                  >
                    {expandedSections.has(section.id) ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    <Layers className="w-3 h-3" />
                    <span>{section.name}</span>
                    <Badge variant="outline" className="text-xs ml-1">
                      {section.flows.length} flows
                    </Badge>
                  </div>
                  
                  {/* Flows */}
                  {expandedSections.has(section.id) && (
                    <div className="ml-4 mt-1 space-y-1">
                      {section.flows.map((flow) => (
                        <div key={flow.id}>
                          <div 
                            className="flex items-center gap-1 text-xs hover:bg-accent/50 rounded px-1 py-0.5 cursor-pointer"
                            onClick={() => toggleFlow(flow.id)}
                          >
                            {expandedFlows.has(flow.id) ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                            <List className="w-3 h-3" />
                            <span>{flow.name}</span>
                            <Badge variant="outline" className="text-[10px] ml-1">
                              {flow.blocks.length} blocks
                            </Badge>
                          </div>
                          
                          {/* Blocks */}
                          {expandedFlows.has(flow.id) && (
                            <div className="ml-4 mt-1 space-y-0.5">
                              {flow.blocks.map((block) => (
                                <div 
                                  key={block.id}
                                  className={`flex items-start gap-1 text-xs hover:bg-accent/50 rounded px-1 py-1 cursor-pointer ${
                                    selectedBlockId === block.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                                  }`}
                                  onClick={() => onBlockSelect?.(block.id)}
                                >
                                  <div className="mt-0.5">
                                    {getBlockIcon(block.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="truncate font-mono">
                                      {getBlockTitle(block)}
                                    </div>
                                    
                                    {/* Block metadata */}
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                      <Badge variant="secondary" className="text-[8px] px-1 h-4">
                                        {block.type}
                                      </Badge>
                                      
                                      {block.metadata?.isChunk && (
                                        <Badge variant="outline" className="text-[8px] px-1 h-4">
                                          chunk {block.metadata.chunkIndex + 1}
                                        </Badge>
                                      )}
                                      
                                      {block.paginationRules?.keepWithNext && (
                                        <Badge variant="outline" className="text-[8px] px-1 h-4 bg-blue-50">
                                          keep-next
                                        </Badge>
                                      )}
                                      
                                      {block.paginationRules?.breakBefore && (
                                        <Badge variant="outline" className="text-[8px] px-1 h-4 bg-red-50">
                                          break-before
                                        </Badge>
                                      )}
                                      
                                      {block.paginationRules?.breakAfter && (
                                        <Badge variant="outline" className="text-[8px] px-1 h-4 bg-orange-50">
                                          break-after
                                        </Badge>
                                      )}
                                      
                                      {['figure', 'table'].includes(block.type) && (
                                        <Badge variant="outline" className="text-[8px] px-1 h-4 bg-purple-50">
                                          atomic
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {flow.blocks.length === 0 && (
                                <div className="text-[10px] text-muted-foreground italic ml-4 py-1">
                                  No blocks in this flow
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </Card>
  )
}