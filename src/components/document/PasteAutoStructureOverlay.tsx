import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { IngestPipeline } from '@/lib/ingest-pipeline'
import { IRMapper } from '@/lib/ir-mapper'
import { Block } from '@/lib/document-model'
import { Card } from '@/components/ui/card'
import { CheckCircle, FileText, Sparkles } from 'lucide-react'

interface PasteAutoStructureOverlayProps {
  isOpen: boolean
  onClose: () => void
  pastedContent: string
  onConfirm: (blocks: Block[]) => void
}

type ProcessingMode = 'auto-structure' | 'keep-formatting' | 'plain-text'
type SectionizationMode = 'h1' | 'h1-h2' | 'none'
type CalloutMapping = 'quote' | 'callout'

interface StructureOptions {
  processingMode: ProcessingMode
  sectionization: SectionizationMode
  calloutMapping: CalloutMapping
}

export const PasteAutoStructureOverlay: React.FC<PasteAutoStructureOverlayProps> = ({
  isOpen,
  onClose,
  pastedContent,
  onConfirm
}) => {
  const [options, setOptions] = useState<StructureOptions>({
    processingMode: 'auto-structure',
    sectionization: 'h1',
    calloutMapping: 'callout'
  })
  const [previewBlocks, setPreviewBlocks] = useState<Block[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (isOpen && pastedContent) {
      generatePreview()
    }
  }, [isOpen, pastedContent, options])

  const generatePreview = async () => {
    if (!pastedContent.trim()) return
    
    setIsProcessing(true)
    try {
      // Create a temporary file blob to use with the ingest pipeline
      const blob = new Blob([pastedContent], { type: 'text/plain' })
      const file = new File([blob], 'paste.txt', { type: 'text/plain' })
      
      // Configure ingest pipeline based on options
      const ingestOptions = {
        preserveFormatting: options.processingMode === 'keep-formatting',
        extractAssets: false,
        generateAnchors: true,
        mergeShortParagraphs: options.processingMode === 'plain-text'
      }
      
      const pipeline = new IngestPipeline(ingestOptions)
      const irDocument = await pipeline.processFile(file)
      
      // Apply structure options
      if (options.sectionization === 'none') {
        // Flatten all sections into one
        const allBlocks = irDocument.sections.flatMap(section => section.blocks)
        irDocument.sections = [{
          id: 'main',
          title: 'Content',
          order: 1,
          blocks: allBlocks,
          notes: []
        }]
      } else if (options.sectionization === 'h1-h2') {
        // Split on H1 and H2 headings
        // This would require more complex logic, for now just use default
      }
      
      // Apply callout mapping
      irDocument.sections.forEach(section => {
        section.blocks.forEach(block => {
          if (block.type === 'quote' && options.calloutMapping === 'callout') {
            block.type = 'callout'
            if (!block.content.type) {
              block.content = {
                type: 'note',
                title: 'Note',
                content: block.content.content || block.content
              }
            }
          } else if (block.type === 'callout' && options.calloutMapping === 'quote') {
            block.type = 'quote'
            block.content = {
              content: block.content.content || block.content,
              citation: undefined
            }
          }
        })
      })
      
      // Map to PageMuse blocks
      const mapper = new IRMapper()
      const document = mapper.mapDocument(irDocument)
      const blocks = document.sections.flatMap(section => 
        section.flows.flatMap(flow => flow.blocks)
      )
      
      setPreviewBlocks(blocks)
    } catch (error) {
      console.error('Error processing paste:', error)
      setPreviewBlocks([])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirm = () => {
    onConfirm(previewBlocks)
    onClose()
  }

  const getBlockIcon = (type: Block['type']) => {
    switch (type) {
      case 'heading': return <FileText className="h-4 w-4" />
      case 'callout': return <Sparkles className="h-4 w-4" />
      default: return <CheckCircle className="h-4 w-4" />
    }
  }

  const getBlockTypeLabel = (type: Block['type']) => {
    switch (type) {
      case 'heading': return 'Heading'
      case 'paragraph': return 'Paragraph'
      case 'ordered-list': return 'Ordered List'
      case 'unordered-list': return 'Unordered List'
      case 'table': return 'Table'
      case 'figure': return 'Figure'
      case 'callout': return 'Callout'
      case 'quote': return 'Quote'
      default: return type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')
    }
  }

  const renderBlockPreview = (block: Block) => {
    switch (block.type) {
      case 'heading':
        const level = block.content?.level || 1
        return (
          <div className={`font-semibold text-${Math.min(level + 1, 6)}xl`}>
            {block.content?.text || 'Untitled Heading'}
          </div>
        )
      case 'paragraph':
        return (
          <p className="text-foreground/80 line-clamp-3">
            {typeof block.content === 'string' ? block.content : block.content?.text || ''}
          </p>
        )
      case 'callout':
        return (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 rounded">
            <div className="font-medium text-blue-900 dark:text-blue-100">
              {block.content?.title || 'Note'}
            </div>
            <div className="text-blue-800 dark:text-blue-200 text-sm line-clamp-2">
              {block.content?.content || ''}
            </div>
          </div>
        )
      case 'ordered-list':
      case 'unordered-list':
        const items = block.content?.items || []
        return (
          <ul className="list-disc list-inside space-y-1 text-foreground/80">
            {items.slice(0, 3).map((item: string, i: number) => (
              <li key={i} className="line-clamp-1">{item}</li>
            ))}
            {items.length > 3 && <li className="text-muted-foreground">... {items.length - 3} more items</li>}
          </ul>
        )
      default:
        return (
          <div className="text-muted-foreground text-sm">
            {getBlockTypeLabel(block.type)} content
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Paste & Auto-structure
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-6 min-h-0">
          {/* Left Panel: Options */}
          <div className="w-80 space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Processing Mode</Label>
              <Select
                value={options.processingMode}
                onValueChange={(value: ProcessingMode) => 
                  setOptions(prev => ({ ...prev, processingMode: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto-structure">Auto-structure (default)</SelectItem>
                  <SelectItem value="keep-formatting">Keep formatting</SelectItem>
                  <SelectItem value="plain-text">Treat as plain text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">Structure Rules</Label>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Sectionization</Label>
                <Select
                  value={options.sectionization}
                  onValueChange={(value: SectionizationMode) => 
                    setOptions(prev => ({ ...prev, sectionization: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="h1">Start new section at H1</SelectItem>
                    <SelectItem value="h1-h2">Split on H1 & H2</SelectItem>
                    <SelectItem value="none">Single section</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Quote Mapping</Label>
                <Select
                  value={options.calloutMapping}
                  onValueChange={(value: CalloutMapping) => 
                    setOptions(prev => ({ ...prev, calloutMapping: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="callout">Blockquote → Callout</SelectItem>
                    <SelectItem value="quote">Blockquote → Quote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="flex gap-2 pt-4">
              <Button onClick={handleConfirm} disabled={isProcessing || previewBlocks.length === 0}>
                Import {previewBlocks.length} blocks
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>

          {/* Right Panel: Preview */}
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Source */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">Source</h3>
                <Badge variant="outline">{pastedContent.length} chars</Badge>
              </div>
              <Card className="flex-1 min-h-0">
                <ScrollArea className="h-full p-4">
                  <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-mono">
                    {pastedContent}
                  </pre>
                </ScrollArea>
              </Card>
            </div>

            {/* Result */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">Structured Result</h3>
                <Badge variant="outline">{previewBlocks.length} blocks</Badge>
              </div>
              <Card className="flex-1 min-h-0">
                <ScrollArea className="h-full p-4">
                  {isProcessing ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-sm text-muted-foreground">Processing...</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {previewBlocks.map((block, index) => (
                        <div key={block.id || index} className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getBlockIcon(block.type)}
                            <Badge variant="secondary" className="text-xs">
                              {getBlockTypeLabel(block.type)}
                            </Badge>
                          </div>
                          <div className="pl-6">
                            {renderBlockPreview(block)}
                          </div>
                          {index < previewBlocks.length - 1 && (
                            <Separator className="my-3" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}