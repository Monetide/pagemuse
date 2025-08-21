import { useState } from 'react'
import { useDocumentModel } from '@/hooks/useDocumentModel'
import { DocumentOutlineView } from '@/components/document/DocumentOutlineView'
import { PageMasterSettings } from '@/components/document/PageMasterSettings'
import { PagePreview } from '@/components/document/PagePreview'
import { PaginatedLayoutPreview } from '@/components/document/PaginatedLayoutPreview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageMaster } from '@/lib/document-model'

export default function DocumentModelDemo() {
  const { document, createNewDocument, addSection, addFlow, addBlock, setDocument } = useDocumentModel()
  const [docTitle, setDocTitle] = useState('')
  const [sectionName, setSectionName] = useState('')
  const [flowName, setFlowName] = useState('')
  const [blockContent, setBlockContent] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')

  const handleCreateDocument = () => {
    if (docTitle.trim()) {
      createNewDocument(docTitle.trim())
      setDocTitle('')
    }
  }

  const handleAddSection = () => {
    if (sectionName.trim() && document) {
      addSection(sectionName.trim())
      setSectionName('')
    }
  }

  const handleAddFlow = (sectionId: string) => {
    if (flowName.trim() && document) {
      addFlow(sectionId, flowName.trim())
      setFlowName('')
    }
  }

  const handleAddBlock = (sectionId: string, flowId: string, type: 'heading' | 'paragraph' | 'ordered-list' | 'unordered-list' | 'quote' | 'divider' | 'spacer') => {
    if (document) {
      let content: any = blockContent.trim()
      let metadata = {}
      
      // Handle special block types
      if (type === 'heading') {
        metadata = { level: 2 } // Default to H2
      } else if (type === 'ordered-list' || type === 'unordered-list') {
        content = content ? content.split('\n').filter((line: string) => line.trim()) : ['List item 1', 'List item 2', 'List item 3']
      } else if (type === 'divider') {
        content = '---'
      } else if (type === 'spacer') {
        content = ''
        metadata = { height: 0.5 }
      } else if (!content && !['divider', 'spacer'].includes(type)) {
        return // Don't add empty blocks except dividers and spacers
      }
      
      const block = addBlock(sectionId, flowId, type, content)
      if (block && Object.keys(metadata).length > 0) {
        block.metadata = { ...block.metadata, ...metadata }
      }
      
      setBlockContent('')
    }
  }

  const updateSectionPageMaster = (sectionId: string, pageMaster: PageMaster) => {
    if (!document) return
    
    const updatedDoc = {
      ...document,
      sections: document.sections.map(section => 
        section.id === sectionId 
          ? { ...section, pageMaster }
          : section
      ),
      updated_at: new Date().toISOString()
    }
    setDocument(updatedDoc)
  }

  const createDemoDocument = () => {
    const doc = createNewDocument('Demo Document')
    const section = addSection('Introduction Section')
    if (section) {
      setSelectedSectionId(section.id)
      const flow = addFlow(section.id, 'Main Content Flow')
      if (flow) {
        // Create a comprehensive demo with all block types
        let block = addBlock(section.id, flow.id, 'heading', 'Welcome to Our Document System')
        if (block) block.metadata = { level: 1 }
        
        addBlock(section.id, flow.id, 'paragraph', 'This is a comprehensive demonstration of how our semantic document model works with various content types. The system automatically flows content from one column to the next, and from one page to the next, without requiring manual page breaks.')
        
        addBlock(section.id, flow.id, 'unordered-list', [
          'Automatic content flow across columns and pages',
          'Support for multiple block types',
          'Intelligent text splitting for long paragraphs',
          'Configurable page masters and layouts'
        ])
        
        addBlock(section.id, flow.id, 'divider', '---')
        
        block = addBlock(section.id, flow.id, 'heading', 'Content Types')
        if (block) block.metadata = { level: 2 }
        
        addBlock(section.id, flow.id, 'paragraph', 'Our system supports various content block types, each with its own rendering and layout characteristics:')
        
        addBlock(section.id, flow.id, 'ordered-list', [
          'Headings (H1, H2, H3) with proper hierarchy',
          'Paragraphs with intelligent text wrapping',
          'Ordered and unordered lists',
          'Quotes with distinctive styling',
          'Visual dividers for content separation',
          'Configurable spacers for layout control'
        ])
        
        addBlock(section.id, flow.id, 'quote', 'The best way to predict the future is to create it. Our document system creates the future of content layout and management.')
        
        addBlock(section.id, flow.id, 'spacer', '')
        
        block = addBlock(section.id, flow.id, 'heading', 'Advanced Features')
        if (block) block.metadata = { level: 2 }
        
        addBlock(section.id, flow.id, 'paragraph', 'The layout engine supports multiple page sizes, flexible column layouts, configurable margins, headers, footers, and baseline grid alignment. All features work together to ensure consistent, professional typography throughout your documents.')
      }
    }
  }

  const selectedSection = document?.sections.find(s => s.id === selectedSectionId)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Document Model Demo</h1>
        <p className="text-muted-foreground">
          Semantic document structure: Document → Section → Flow → Block
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!document ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Document title"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleCreateDocument} disabled={!docTitle.trim()}>
                      Create Document
                    </Button>
                    <Button onClick={createDemoDocument} variant="outline">
                      Create Demo
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Badge variant="default" className="mb-2">
                    Document: {document.title}
                  </Badge>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder="Section name"
                      value={sectionName}
                      onChange={(e) => setSectionName(e.target.value)}
                    />
                    <Button 
                      onClick={handleAddSection} 
                      disabled={!sectionName.trim()}
                      size="sm"
                    >
                      Add Section
                    </Button>
                  </div>

                  {document.sections.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <Input
                        placeholder="Flow name"
                        value={flowName}
                        onChange={(e) => setFlowName(e.target.value)}
                      />
                      <div className="flex flex-wrap gap-2">
                        {document.sections.map(section => (
                          <Button
                            key={section.id}
                            onClick={() => handleAddFlow(section.id)}
                            disabled={!flowName.trim()}
                            size="sm"
                            variant="outline"
                          >
                            Add Flow to "{section.name}"
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {document.sections.some(s => s.flows.length > 0) && (
                    <div className="space-y-2 pt-2 border-t">
                      <Input
                        placeholder="Block content"
                        value={blockContent}
                        onChange={(e) => setBlockContent(e.target.value)}
                      />
                      <div className="space-y-3">
                        {document.sections.map(section =>
                          section.flows.map(flow => (
                            <div key={flow.id} className="space-y-2">
                              <div className="text-xs font-medium text-muted-foreground">
                                Add to "{flow.name}" in "{section.name}":
                              </div>
                              <div className="grid grid-cols-2 gap-1">
                                <Button
                                  onClick={() => handleAddBlock(section.id, flow.id, 'heading')}
                                  disabled={!blockContent.trim()}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                >
                                  Heading
                                </Button>
                                <Button
                                  onClick={() => handleAddBlock(section.id, flow.id, 'paragraph')}
                                  disabled={!blockContent.trim()}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                >
                                  Paragraph
                                </Button>
                                <Button
                                  onClick={() => handleAddBlock(section.id, flow.id, 'ordered-list')}
                                  disabled={!blockContent.trim()}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                >
                                  Ordered List
                                </Button>
                                <Button
                                  onClick={() => handleAddBlock(section.id, flow.id, 'unordered-list')}
                                  disabled={!blockContent.trim()}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                >
                                  Bullet List
                                </Button>
                                <Button
                                  onClick={() => handleAddBlock(section.id, flow.id, 'quote')}
                                  disabled={!blockContent.trim()}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                >
                                  Quote
                                </Button>
                                <Button
                                  onClick={() => handleAddBlock(section.id, flow.id, 'divider')}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                >
                                  Divider
                                </Button>
                              </div>
                              <Button
                                onClick={() => handleAddBlock(section.id, flow.id, 'spacer')}
                                size="sm"
                                variant="outline"
                                className="text-xs w-full"
                              >
                                Add Spacer
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Page Master & Preview */}
        <div className="xl:col-span-2 space-y-6">
          {document && document.sections.length > 0 ? (
            <Tabs value={selectedSectionId || document.sections[0].id} onValueChange={setSelectedSectionId}>
              <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {document.sections.map(section => (
                  <TabsTrigger key={section.id} value={section.id} className="text-xs">
                    {section.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {document.sections.map(section => (
                <TabsContent key={section.id} value={section.id} className="space-y-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <PageMasterSettings
                        pageMaster={section.pageMaster}
                        onUpdate={(pageMaster) => updateSectionPageMaster(section.id, pageMaster)}
                      />
                      <PagePreview
                        pageMaster={section.pageMaster}
                        sectionName={section.name}
                      />
                    </div>
                    <PaginatedLayoutPreview section={section} />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Create a section to configure page settings</p>
              </CardContent>
            </Card>
          )}

          {/* Document Outline */}
          {document && (
            <DocumentOutlineView document={document} />
          )}
        </div>
      </div>
    </div>
  )
}