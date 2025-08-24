import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Code2, 
  FileText, 
  Copy, 
  Check,
  Layers,
  Type,
  List,
  MessageSquare,
  AlertTriangle,
  Image,
  Table,
  Minus,
  Hash
} from 'lucide-react';
import { 
  DocumentIR, 
  SectionIR, 
  BlockIR, 
  BLOCK_TYPES,
  HEADING_LEVELS,
  LIST_TYPES,
  CALLOUT_TYPES,
  TEXT_FORMATTING_TYPES,
  EXAMPLE_DOCUMENT_IR
} from '@/lib/ir-schema';

export const IRSchemaPanel = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const getBlockIcon = (blockType: string) => {
    switch (blockType) {
      case 'heading': return <Type className="w-4 h-4" />;
      case 'paragraph': return <FileText className="w-4 h-4" />;
      case 'list': return <List className="w-4 h-4" />;
      case 'quote': return <MessageSquare className="w-4 h-4" />;
      case 'callout': return <AlertTriangle className="w-4 h-4" />;
      case 'figure': return <Image className="w-4 h-4" />;
      case 'table': return <Table className="w-4 h-4" />;
      case 'divider': return <Minus className="w-4 h-4" />;
      case 'footnote': return <Hash className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const renderTypeDefinition = (name: string, definition: string) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-sm font-medium text-primary">{name}</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(definition, name)}
          className="h-6 w-6 p-0"
        >
          {copiedSection === name ? (
            <Check className="w-3 h-3 text-green-600" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </Button>
      </div>
      <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
        <code>{definition}</code>
      </pre>
    </div>
  );

  const documentIRDefinition = `interface DocumentIR {
  sections: SectionIR[];
  metadata?: DocumentMetadata;
}`;

  const sectionIRDefinition = `interface SectionIR {
  title?: string;
  blocks: BlockIR[];
  id?: string;
}`;

  const blockIRDefinition = `type BlockIR = 
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | QuoteBlock
  | CalloutBlock
  | FigureBlock
  | TableBlock
  | DividerBlock
  | FootnoteBlock;`;

  const headingBlockDefinition = `interface HeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  content: string;
  id?: string;
}`;

  const paragraphBlockDefinition = `interface ParagraphBlock {
  type: 'paragraph';
  content: string;
  formatting?: TextFormatting[];
}`;

  const listBlockDefinition = `interface ListBlock {
  type: 'list';
  listType: 'ol' | 'ul';
  items: ListItem[];
  level?: number;
}

interface ListItem {
  content: string;
  formatting?: TextFormatting[];
  nestedList?: ListBlock;
}`;

  const otherBlocksDefinition = `interface QuoteBlock {
  type: 'quote';
  content: string;
  author?: string;
  source?: string;
}

interface CalloutBlock {
  type: 'callout';
  calloutType: 'info' | 'warning' | 'error' | 'success' | 'note' | 'tip';
  title?: string;
  content: string;
}

interface FigureBlock {
  type: 'figure';
  src: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

interface TableBlock {
  type: 'table';
  header: string[];
  rows: string[][];
  caption?: string;
}

interface DividerBlock {
  type: 'divider';
  style?: 'solid' | 'dashed' | 'dotted';
}

interface FootnoteBlock {
  type: 'footnote';
  marker: string | number;
  text: string;
  id?: string;
}`;

  const textFormattingDefinition = `interface TextFormatting {
  start: number;
  end: number;
  type: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link';
  value?: string; // For links
}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Code2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">IR Schema</h1>
          <p className="text-muted-foreground">
            Intermediate Representation - Single source of truth for document structure
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="types">Type Definitions</TabsTrigger>
          <TabsTrigger value="blocks">Block Types</TabsTrigger>
          <TabsTrigger value="example">Example</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Schema Structure
              </CardTitle>
              <CardDescription>
                The IR schema defines a hierarchical document structure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">DocumentIR</p>
                  <p className="text-sm text-muted-foreground">Root document containing sections</p>
                </div>
              </div>
              
              <div className="ml-4 flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <Layers className="w-5 h-5 text-secondary-foreground" />
                <div>
                  <p className="font-medium">SectionIR[]</p>
                  <p className="text-sm text-muted-foreground">Array of document sections with optional titles</p>
                </div>
              </div>
              
              <div className="ml-8 flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-5 h-5 border-2 border-muted-foreground rounded"></div>
                <div>
                  <p className="font-medium">BlockIR[]</p>
                  <p className="text-sm text-muted-foreground">Array of content blocks within each section</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Block Types</CardTitle>
              <CardDescription>
                {BLOCK_TYPES.length} block types supported in the IR schema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {BLOCK_TYPES.map((blockType) => (
                  <div key={blockType} className="flex items-center gap-2 p-2 border rounded-lg">
                    {getBlockIcon(blockType)}
                    <span className="font-mono text-sm">{blockType}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Constants & Enums</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium mb-2">Heading Levels</p>
                <div className="flex gap-2">
                  {HEADING_LEVELS.map(level => (
                    <Badge key={level} variant="outline">h{level}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="font-medium mb-2">List Types</p>
                <div className="flex gap-2">
                  {LIST_TYPES.map(type => (
                    <Badge key={type} variant="outline">{type}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="font-medium mb-2">Callout Types</p>
                <div className="flex flex-wrap gap-2">
                  {CALLOUT_TYPES.map(type => (
                    <Badge key={type} variant="outline">{type}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="font-medium mb-2">Text Formatting</p>
                <div className="flex flex-wrap gap-2">
                  {TEXT_FORMATTING_TYPES.map(type => (
                    <Badge key={type} variant="outline">{type}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <ScrollArea className="h-[600px] w-full">
            <div className="space-y-6 pr-4">
              {renderTypeDefinition('DocumentIR', documentIRDefinition)}
              <Separator />
              {renderTypeDefinition('SectionIR', sectionIRDefinition)}
              <Separator />
              {renderTypeDefinition('BlockIR (Union Type)', blockIRDefinition)}
              <Separator />
              {renderTypeDefinition('HeadingBlock', headingBlockDefinition)}
              <Separator />
              {renderTypeDefinition('ParagraphBlock', paragraphBlockDefinition)}
              <Separator />
              {renderTypeDefinition('ListBlock', listBlockDefinition)}
              <Separator />
              {renderTypeDefinition('Other Block Types', otherBlocksDefinition)}
              <Separator />
              {renderTypeDefinition('TextFormatting', textFormattingDefinition)}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="blocks" className="space-y-4">
          <div className="grid gap-4">
            {BLOCK_TYPES.map((blockType) => (
              <Card key={blockType}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getBlockIcon(blockType)}
                    {blockType}Block
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    {blockType === 'heading' && (
                      <div>
                        <p><strong>Purpose:</strong> Document and section headings (h1-h6)</p>
                        <p><strong>Required:</strong> type, level, content</p>
                        <p><strong>Optional:</strong> id</p>
                      </div>
                    )}
                    {blockType === 'paragraph' && (
                      <div>
                        <p><strong>Purpose:</strong> Body text with optional formatting</p>
                        <p><strong>Required:</strong> type, content</p>
                        <p><strong>Optional:</strong> formatting</p>
                      </div>
                    )}
                    {blockType === 'list' && (
                      <div>
                        <p><strong>Purpose:</strong> Ordered (ol) or unordered (ul) lists</p>
                        <p><strong>Required:</strong> type, listType, items</p>
                        <p><strong>Optional:</strong> level</p>
                      </div>
                    )}
                    {blockType === 'quote' && (
                      <div>
                        <p><strong>Purpose:</strong> Blockquotes and citations</p>
                        <p><strong>Required:</strong> type, content</p>
                        <p><strong>Optional:</strong> author, source</p>
                      </div>
                    )}
                    {blockType === 'callout' && (
                      <div>
                        <p><strong>Purpose:</strong> Highlighted information boxes</p>
                        <p><strong>Required:</strong> type, calloutType, content</p>
                        <p><strong>Optional:</strong> title</p>
                      </div>
                    )}
                    {blockType === 'figure' && (
                      <div>
                        <p><strong>Purpose:</strong> Images, diagrams, and visual content</p>
                        <p><strong>Required:</strong> type, src</p>
                        <p><strong>Optional:</strong> alt, caption, width, height</p>
                      </div>
                    )}
                    {blockType === 'table' && (
                      <div>
                        <p><strong>Purpose:</strong> Tabular data with headers and rows</p>
                        <p><strong>Required:</strong> type, header, rows</p>
                        <p><strong>Optional:</strong> caption</p>
                      </div>
                    )}
                    {blockType === 'divider' && (
                      <div>
                        <p><strong>Purpose:</strong> Visual separator between content</p>
                        <p><strong>Required:</strong> type</p>
                        <p><strong>Optional:</strong> style</p>
                      </div>
                    )}
                    {blockType === 'footnote' && (
                      <div>
                        <p><strong>Purpose:</strong> Reference notes and citations</p>
                        <p><strong>Required:</strong> type, marker, text</p>
                        <p><strong>Optional:</strong> id</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="example" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Example Document IR
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(EXAMPLE_DOCUMENT_IR, null, 2), 'example')}
                >
                  {copiedSection === 'example' ? (
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  Copy JSON
                </Button>
              </CardTitle>
              <CardDescription>
                A complete example showing the IR schema in action
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full">
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{JSON.stringify(EXAMPLE_DOCUMENT_IR, null, 2)}</code>
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};