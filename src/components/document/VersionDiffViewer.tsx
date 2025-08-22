import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { DocumentVersion } from '@/hooks/useDocumentVersions'
import { Block, SemanticDocument } from '@/lib/document-model'
import { ArrowLeft, ArrowRight, Plus, Minus, Edit } from 'lucide-react'

interface VersionDiffViewerProps {
  version1: DocumentVersion
  version2: DocumentVersion
}

type DiffType = 'added' | 'removed' | 'modified' | 'unchanged'

interface BlockDiff {
  type: DiffType
  block?: Block
  oldBlock?: Block
  newBlock?: Block
  sectionId?: string
  flowId?: string
}

const getBlocksFromDocument = (doc: SemanticDocument): { block: Block; sectionId: string; flowId: string }[] => {
  const blocks: { block: Block; sectionId: string; flowId: string }[] = []
  
  doc.sections.forEach(section => {
    section.flows.forEach(flow => {
      flow.blocks.forEach(block => {
        blocks.push({ block, sectionId: section.id, flowId: flow.id })
      })
    })
  })
  
  return blocks
}

const computeBlockDiffs = (doc1: SemanticDocument, doc2: SemanticDocument): BlockDiff[] => {
  const blocks1 = getBlocksFromDocument(doc1)
  const blocks2 = getBlocksFromDocument(doc2)
  
  const diffs: BlockDiff[] = []
  const processed = new Set<string>()
  
  // Find matching, modified, and removed blocks
  blocks1.forEach(({ block: block1, sectionId, flowId }) => {
    const matching = blocks2.find(({ block: block2 }) => block2.id === block1.id)
    
    if (matching) {
      processed.add(block1.id)
      const block2 = matching.block
      
      // Check if content is different
      const isModified = JSON.stringify(block1.content) !== JSON.stringify(block2.content) ||
                        block1.type !== block2.type ||
                        JSON.stringify(block1.styles) !== JSON.stringify(block2.styles)
      
      diffs.push({
        type: isModified ? 'modified' : 'unchanged',
        oldBlock: block1,
        newBlock: block2,
        sectionId,
        flowId
      })
    } else {
      diffs.push({
        type: 'removed',
        block: block1,
        sectionId,
        flowId
      })
    }
  })
  
  // Find added blocks
  blocks2.forEach(({ block: block2, sectionId, flowId }) => {
    if (!processed.has(block2.id)) {
      diffs.push({
        type: 'added',
        block: block2,
        sectionId,
        flowId
      })
    }
  })
  
  return diffs
}

const getDiffIcon = (type: DiffType) => {
  switch (type) {
    case 'added': return <Plus className="h-4 w-4 text-green-600" />
    case 'removed': return <Minus className="h-4 w-4 text-red-600" />
    case 'modified': return <Edit className="h-4 w-4 text-orange-600" />
    default: return null
  }
}

const getDiffBadgeVariant = (type: DiffType) => {
  switch (type) {
    case 'added': return 'default'
    case 'removed': return 'destructive'
    case 'modified': return 'outline'
    default: return 'secondary'
  }
}

const renderBlockContent = (block: Block) => {
  switch (block.type) {
    case 'heading':
    case 'paragraph':
    case 'quote':
      return block.content?.text || ''
    case 'ordered-list':
    case 'unordered-list':
      return block.content?.items?.join(', ') || ''
    case 'figure':
      return `Image: ${block.content?.alt || 'Untitled'}`
    case 'table':
      return `Table: ${block.content?.rows?.length || 0} rows`
    case 'cross-reference':
      return `Reference: ${block.content?.text || 'Untitled'}`
    case 'divider':
      return 'Divider'
    case 'spacer':
      return `Spacer: ${block.content?.height || 'auto'}`
    default:
      return 'Unknown block type'
  }
}

export const VersionDiffViewer = ({ version1, version2 }: VersionDiffViewerProps) => {
  const diffs = useMemo(() => {
    return computeBlockDiffs(version1.content, version2.content)
  }, [version1, version2])

  const stats = useMemo(() => {
    const added = diffs.filter(d => d.type === 'added').length
    const removed = diffs.filter(d => d.type === 'removed').length
    const modified = diffs.filter(d => d.type === 'modified').length
    
    return { added, removed, modified }
  }, [diffs])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Version Comparison</span>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">v{version1.version_number}</Badge>
            <ArrowRight className="h-4 w-4" />
            <Badge variant="outline">v{version2.version_number}</Badge>
          </div>
        </CardTitle>
        
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Plus className="h-4 w-4 text-green-600" />
            <span>{stats.added} added</span>
          </div>
          <div className="flex items-center gap-1">
            <Minus className="h-4 w-4 text-red-600" />
            <span>{stats.removed} removed</span>
          </div>
          <div className="flex items-center gap-1">
            <Edit className="h-4 w-4 text-orange-600" />
            <span>{stats.modified} modified</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="space-y-2 p-4">
            {diffs.filter(d => d.type !== 'unchanged').map((diff, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getDiffIcon(diff.type)}
                  <Badge variant={getDiffBadgeVariant(diff.type)}>
                    {diff.type}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {diff.block?.type || diff.oldBlock?.type || diff.newBlock?.type}
                  </span>
                </div>
                
                {diff.type === 'modified' && diff.oldBlock && diff.newBlock && (
                  <div className="space-y-2">
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <Minus className="h-3 w-3 text-red-600" />
                        <span className="text-xs font-medium text-red-700 dark:text-red-300">Before</span>
                      </div>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        {renderBlockContent(diff.oldBlock)}
                      </p>
                    </div>
                    
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <Plus className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-300">After</span>
                      </div>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        {renderBlockContent(diff.newBlock)}
                      </p>
                    </div>
                  </div>
                )}
                
                {diff.type === 'added' && diff.block && (
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      {renderBlockContent(diff.block)}
                    </p>
                  </div>
                )}
                
                {diff.type === 'removed' && diff.block && (
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {renderBlockContent(diff.block)}
                    </p>
                  </div>
                )}
              </div>
            ))}
            
            {diffs.filter(d => d.type !== 'unchanged').length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Edit className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No differences found</p>
                <p className="text-xs">These versions contain identical content</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}