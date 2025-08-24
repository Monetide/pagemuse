import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { testDocxIngestion, validateDocxResult } from '@/lib/__tests__/docx-simple';
import { 
  ingestToIR, 
  testMarkdownParser, 
  MARKDOWN_WITH_TABLE_AND_IMAGE,
  IngestOptions,
  DEFAULT_INGEST_OPTIONS
} from '@/lib/ingest-pipeline';
import { DocumentIR, BlockIR, validateDocumentIR, validateBlockIR } from '@/lib/ir-schema';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Code2, 
  TestTube,
  Play,
  Type,
  List,
  Table,
  Image,
  Quote,
  Minus,
  Hash,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';

export const IngestTestPanel = () => {
  const [inputContent, setInputContent] = useState(MARKDOWN_WITH_TABLE_AND_IMAGE);
  const [inputFormat, setInputFormat] = useState<'paste' | 'txt' | 'markdown' | 'html'>('markdown');
  const [result, setResult] = useState<DocumentIR | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const handleTest = async () => {
    if (!inputContent.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const ir = ingestToIR(inputContent, inputFormat, DEFAULT_INGEST_OPTIONS);
      setResult(ir);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse content');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunPredefinedTest = () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const ir = testMarkdownParser();
      setResult(ir);
      setInputContent(MARKDOWN_WITH_TABLE_AND_IMAGE);
      setInputFormat('markdown');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run test');
    } finally {
      setIsProcessing(false);
    }
  };

  const runDocxTest = async () => {
    setIsProcessing(true);
    setTestResults([]);
    
    try {
      const result = await testDocxIngestion();
      
      // Validate the result
      const isValid = validateDocumentIR(result);
      const blockValidations = result.sections.flatMap(section => 
        section.blocks.map(block => validateBlockIR(block))
      );
      const allBlocksValid = blockValidations.every(Boolean);
      
      // Additional DOCX validation
      const docxValid = validateDocxResult(result);
      
      setTestResults([
        `✅ DOCX Parser Test completed successfully`,
        `📄 Document Title: ${result.title}`,
        `📝 Sections: ${result.sections.length}`,
        `🧱 Total Blocks: ${result.sections.reduce((acc, section) => acc + section.blocks.length, 0)}`,
        `✅ Document Structure Valid: ${isValid}`,
        `✅ All Blocks Valid: ${allBlocksValid}`,
        `✅ DOCX-specific Validation: ${docxValid}`,
        `📊 Word Count: ${result.metadata?.wordCount || 'Unknown'}`,
        '',
        '📋 Block Types Found:',
        ...getBlockTypeCounts(result)
      ]);
      
      setResult(result);
      
    } catch (error) {
      setTestResults([
        `❌ DOCX test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        '',
        '🔍 This might indicate an issue with the DOCX ingest pipeline.',
        'Check the console for more details.'
      ]);
      console.error('DOCX test error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getBlockTypeCounts = (doc: DocumentIR): string[] => {
    const counts = doc.sections.flatMap(s => s.blocks).reduce((acc, block) => {
      acc[block.type] = (acc[block.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).map(([type, count]) => `   ${type}: ${count}`);
  };

  const getBlockIcon = (blockType: string) => {
    switch (blockType) {
      case 'heading': return <Type className="w-4 h-4" />;
      case 'paragraph': return <FileText className="w-4 h-4" />;
      case 'list': return <List className="w-4 h-4" />;
      case 'table': return <Table className="w-4 h-4" />;
      case 'figure': return <Image className="w-4 h-4" />;
      case 'quote': return <Quote className="w-4 h-4" />;
      case 'divider': return <Minus className="w-4 h-4" />;
      case 'footnote': return <Hash className="w-4 h-4" />;
      case 'callout': return <AlertTriangle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getBlockTypeColor = (blockType: string) => {
    switch (blockType) {
      case 'heading': return 'bg-blue-100 text-blue-800';
      case 'paragraph': return 'bg-gray-100 text-gray-800';
      case 'list': return 'bg-green-100 text-green-800';
      case 'table': return 'bg-purple-100 text-purple-800';
      case 'figure': return 'bg-orange-100 text-orange-800';
      case 'quote': return 'bg-indigo-100 text-indigo-800';
      case 'divider': return 'bg-gray-100 text-gray-800';
      case 'footnote': return 'bg-yellow-100 text-yellow-800';
      case 'callout': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderBlock = (block: BlockIR, index: number) => {
    return (
      <div key={index} className="border rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2">
          {getBlockIcon(block.type)}
          <Badge className={getBlockTypeColor(block.type)}>
            {block.type}
          </Badge>
          {block.type === 'heading' && (
            <Badge variant="outline" className="text-xs">
              h{(block as any).level}
            </Badge>
          )}
          {block.type === 'list' && (
            <Badge variant="outline" className="text-xs">
              {(block as any).listType}
            </Badge>
          )}
        </div>
        
        <div className="text-sm">
          {block.type === 'heading' && (
            <p className="font-medium">{(block as any).content}</p>
          )}
          {block.type === 'paragraph' && (
            <p>{(block as any).content}</p>
          )}
          {block.type === 'list' && (
            <div>
              <p className="font-medium mb-1">Items ({(block as any).items.length}):</p>
              <ul className="list-disc list-inside space-y-1">
                {(block as any).items.map((item: any, i: number) => (
                  <li key={i} className="text-xs">{item.content}</li>
                ))}
              </ul>
            </div>
          )}
          {block.type === 'table' && (
            <div>
              <p className="font-medium mb-1">
                Table ({(block as any).header.length} columns, {(block as any).rows.length} rows)
              </p>
              <div className="text-xs">
                <p><strong>Headers:</strong> {(block as any).header.join(', ')}</p>
                <p><strong>Sample row:</strong> {(block as any).rows[0]?.join(', ') || 'No data'}</p>
              </div>
            </div>
          )}
          {block.type === 'figure' && (
            <div>
              <p className="font-medium">Image</p>
              <p className="text-xs"><strong>Source:</strong> {(block as any).src}</p>
              {(block as any).alt && (
                <p className="text-xs"><strong>Alt:</strong> {(block as any).alt}</p>
              )}
            </div>
          )}
          {block.type === 'quote' && (
            <blockquote className="border-l-4 border-muted pl-4 italic">
              {(block as any).content}
            </blockquote>
          )}
          {block.type === 'divider' && (
            <div className="border-t-2 border-dashed border-muted py-2">
              <span className="text-xs text-muted-foreground">Horizontal Rule</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <TestTube className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Ingest Pipeline Tester</h1>
          <p className="text-muted-foreground">
            Test parsing of paste/txt, Markdown, HTML, and DOCX into IR format
          </p>
        </div>
      </div>

      <Tabs defaultValue="test" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="test">Test Parser</TabsTrigger>
          <TabsTrigger value="docx">DOCX Test</TabsTrigger>
          <TabsTrigger value="result">IR Result</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="w-5 h-5" />
                  Input Content
                </CardTitle>
                <CardDescription>
                  Paste or type content to convert to IR format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Format</label>
                  <div className="flex gap-2">
                    {(['paste', 'txt', 'markdown', 'html'] as const).map((format) => (
                      <Button
                        key={format}
                        variant={inputFormat === format ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setInputFormat(format)}
                      >
                        {format}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Content</label>
                  <Textarea
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    placeholder="Enter your content here..."
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleTest}
                    disabled={!inputContent.trim() || isProcessing}
                    className="flex-1"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isProcessing ? 'Processing...' : 'Parse to IR'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleRunPredefinedTest}
                    disabled={isProcessing}
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Test MD Sample
                  </Button>
                </div>
                
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive font-medium">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Parsing Results</CardTitle>
                <CardDescription>
                  Overview of the parsed content
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{result.sections.length}</p>
                        <p className="text-sm text-muted-foreground">Sections</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">
                          {result.sections.reduce((sum, section) => sum + section.blocks.length, 0)}
                        </p>
                        <p className="text-sm text-muted-foreground">Blocks</p>
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{result.metadata?.wordCount || 0}</p>
                      <p className="text-sm text-muted-foreground">Words</p>
                    </div>

                    {/* Block type breakdown */}
                    <div>
                      <p className="font-medium mb-2">Block Types</p>
                      <div className="space-y-2">
                        {Object.entries(
                          result.sections.flatMap(s => s.blocks).reduce((acc, block) => {
                            acc[block.type] = (acc[block.type] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {getBlockIcon(type)}
                              <span className="capitalize">{type}</span>
                            </div>
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TestTube className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Parse some content to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="docx" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                DOCX Parser Test
              </CardTitle>
              <CardDescription>
                Test DOCX document parsing capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">
                  This test validates DOCX parsing by processing a simulated document with headings, paragraphs, lists, and tables.
                </p>
                <Button 
                  onClick={runDocxTest} 
                  disabled={isProcessing}
                  className="w-full"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Testing DOCX Parser...' : 'Run DOCX Test'}
                </Button>
              </div>
              
              {testResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Test Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px] w-full">
                      <pre className="text-xs font-mono whitespace-pre-wrap">
                        {testResults.join('\n')}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="result" className="space-y-4">
          {result ? (
            <div className="space-y-6">
              {/* JSON View */}
              <Card>
                <CardHeader>
                  <CardTitle>Raw JSON Output</CardTitle>
                  <CardDescription>
                    Complete IR document structure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] w-full">
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                      <code>{JSON.stringify(result, null, 2)}</code>
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Visual Block View */}
              {result.sections.map((section, sectionIndex) => (
                <Card key={sectionIndex}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Section {sectionIndex + 1}
                      {section.title && `: ${section.title}`}
                    </CardTitle>
                    <CardDescription>
                      {section.blocks.length} blocks in this section
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {section.blocks.map((block, blockIndex) => 
                        renderBlock(block, blockIndex)
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Code2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
                <p className="text-muted-foreground">
                  Go to the Test Parser tab and process some content to see the IR output
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Markdown Sample</CardTitle>
                <CardDescription>
                  Sample Markdown content with tables, images, lists, and quotes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                  <code>{MARKDOWN_WITH_TABLE_AND_IMAGE}</code>
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Supported Features</CardTitle>
                <CardDescription>
                  Complete list of parsing capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Markdown Features</h4>
                    <ul className="text-sm space-y-1">
                      <li>✅ Headings (h1-h6)</li>
                      <li>✅ Paragraphs with formatting removal</li>
                      <li>✅ Unordered & ordered lists</li>
                      <li>✅ GFM Tables</li>
                      <li>✅ Images with alt text</li>
                      <li>✅ Blockquotes</li>
                      <li>✅ Horizontal rules</li>
                      <li>✅ Link text preservation</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">HTML Features</h4>
                    <ul className="text-sm space-y-1">
                      <li>✅ Semantic headings (h1-h6)</li>
                      <li>✅ Paragraphs (p)</li>
                      <li>✅ Lists (ul, ol, li)</li>
                      <li>✅ Tables (table, thead, tbody)</li>
                      <li>✅ Images (img with src/alt)</li>
                      <li>✅ Blockquotes</li>
                      <li>✅ Horizontal rules (hr)</li>
                      <li>✅ Styling strip with link preservation</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">DOCX Features</h4>
                    <ul className="text-sm space-y-1">
                      <li>✅ Heading styles (Heading 1-6)</li>
                      <li>✅ Normal paragraphs</li>
                      <li>✅ Ordered & unordered lists</li>
                      <li>✅ Tables with headers</li>
                      <li>✅ Images and figures</li>
                      <li>✅ Footnotes and endnotes</li>
                      <li>✅ Document metadata</li>
                      <li>✅ Style preservation</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};