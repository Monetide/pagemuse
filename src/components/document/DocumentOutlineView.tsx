import { SemanticDocument, Section, Flow, Block } from '@/lib/document-model'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DocumentOutlineViewProps {
  document: SemanticDocument
}

const BlockItem = ({ block }: { block: Block }) => (
  <div className="ml-8 p-2 border-l-2 border-muted">
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="text-xs">
        {block.type}
      </Badge>
      <span className="text-sm text-muted-foreground">#{block.order}</span>
    </div>
    <div className="text-sm mt-1 text-foreground">
      {typeof block.content === 'string' 
        ? block.content.slice(0, 50) + (block.content.length > 50 ? '...' : '')
        : JSON.stringify(block.content).slice(0, 50) + '...'
      }
    </div>
  </div>
)

const FlowItem = ({ flow }: { flow: Flow }) => (
  <div className="ml-6 p-3 border-l-2 border-primary/20 bg-muted/30 rounded-r">
    <div className="flex items-center gap-2 mb-2">
      <Badge variant="outline" className="text-xs">
        Flow: {flow.type}
      </Badge>
      <span className="font-medium">{flow.name}</span>
      <span className="text-xs text-muted-foreground">#{flow.order}</span>
    </div>
    {flow.blocks.map(block => (
      <BlockItem key={block.id} block={block} />
    ))}
    {flow.blocks.length === 0 && (
      <div className="ml-8 text-xs text-muted-foreground italic">No blocks yet</div>
    )}
  </div>
)

const SectionItem = ({ section }: { section: Section }) => (
  <div className="ml-4 p-4 border-l-4 border-primary bg-background rounded-r">
    <div className="flex items-center gap-2 mb-3">
      <Badge className="text-xs">Section</Badge>
      <span className="font-semibold text-lg">{section.name}</span>
      <span className="text-sm text-muted-foreground">#{section.order}</span>
    </div>
    {section.flows.map(flow => (
      <FlowItem key={flow.id} flow={flow} />
    ))}
    {section.flows.length === 0 && (
      <div className="ml-6 text-sm text-muted-foreground italic">No flows yet</div>
    )}
  </div>
)

export const DocumentOutlineView = ({ document }: DocumentOutlineViewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge variant="default">Document</Badge>
          <span>{document.title}</span>
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          ID: {document.id}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {document.sections.map(section => (
          <SectionItem key={section.id} section={section} />
        ))}
        {document.sections.length === 0 && (
          <div className="text-muted-foreground italic">No sections yet</div>
        )}
        
        <div className="mt-6 p-3 bg-muted/50 rounded text-xs">
          <strong>Structure:</strong> Document → {document.sections.length} Sections → {' '}
          {document.sections.reduce((acc, s) => acc + s.flows.length, 0)} Flows → {' '}
          {document.sections.reduce((acc, s) => 
            acc + s.flows.reduce((facc, f) => facc + f.blocks.length, 0), 0
          )} Blocks
        </div>
      </CardContent>
    </Card>
  )
}