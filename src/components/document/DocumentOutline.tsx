import React from 'react'
import { Document, Section, Flow, Block } from '@/types/document'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, List, Hash, Type, Image, Quote } from 'lucide-react'

interface DocumentOutlineProps {
  document: Document
}

const getBlockIcon = (type: Block['type']) => {
  switch (type) {
    case 'heading':
      return <Hash className="h-3 w-3" />
    case 'paragraph':
      return <Type className="h-3 w-3" />
    case 'image':
      return <Image className="h-3 w-3" />
    case 'list':
      return <List className="h-3 w-3" />
    case 'quote':
      return <Quote className="h-3 w-3" />
    default:
      return <FileText className="h-3 w-3" />
  }
}

const BlockItem: React.FC<{ block: Block }> = ({ block }) => (
  <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded text-sm">
    {getBlockIcon(block.type)}
    <span className="font-medium capitalize">{block.type}</span>
    <span className="text-muted-foreground truncate flex-1">
      {block.content.substring(0, 50)}{block.content.length > 50 ? '...' : ''}
    </span>
  </div>
)

const FlowItem: React.FC<{ flow: Flow }> = ({ flow }) => (
  <div className="ml-4 border-l-2 border-muted pl-4 space-y-2">
    <div className="flex items-center space-x-2">
      <FileText className="h-4 w-4 text-primary" />
      <span className="font-medium">{flow.name}</span>
      <Badge variant="outline" className="text-xs">
        {flow.blocks.length} blocks
      </Badge>
    </div>
    <div className="space-y-1">
      {flow.blocks.map((block) => (
        <BlockItem key={block.id} block={block} />
      ))}
    </div>
  </div>
)

const SectionItem: React.FC<{ section: Section }> = ({ section }) => (
  <div className="space-y-3">
    <div className="flex items-center space-x-2">
      <div className="h-6 w-6 bg-primary rounded flex items-center justify-center">
        <span className="text-primary-foreground text-xs font-bold">S</span>
      </div>
      <span className="font-semibold">{section.name}</span>
      <Badge variant="secondary" className="text-xs">
        {section.flows.length} flows
      </Badge>
    </div>
    <div className="space-y-3">
      {section.flows.map((flow) => (
        <FlowItem key={flow.id} flow={flow} />
      ))}
    </div>
  </div>
)

export const DocumentOutline: React.FC<DocumentOutlineProps> = ({ document }) => {
  const stats = {
    sections: document.sections.length,
    flows: document.sections.reduce((acc, section) => acc + section.flows.length, 0),
    blocks: document.sections.reduce((acc, section) => 
      acc + section.flows.reduce((flowAcc, flow) => flowAcc + flow.blocks.length, 0), 0
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Document Structure</span>
          <div className="flex space-x-2">
            <Badge variant="outline">{stats.sections} sections</Badge>
            <Badge variant="outline">{stats.flows} flows</Badge>
            <Badge variant="outline">{stats.blocks} blocks</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="mb-4">
          <h3 className="font-bold text-lg mb-2">{document.title}</h3>
          <p className="text-sm text-muted-foreground">ID: {document.id}</p>
          <p className="text-sm text-muted-foreground">
            Created: {new Date(document.createdAt).toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">
            Updated: {new Date(document.updatedAt).toLocaleString()}
          </p>
        </div>
        
        {document.sections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No sections added yet
          </div>
        ) : (
          <div className="space-y-6">
            {document.sections.map((section) => (
              <SectionItem key={section.id} section={section} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}