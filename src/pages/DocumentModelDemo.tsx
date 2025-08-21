import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDocumentModel } from '@/hooks/useDocumentModel'
import { DocumentHeader } from '@/components/document/DocumentHeader'
import { DocumentOutlineView } from '@/components/document/DocumentOutlineView'
import { PageMasterSettings } from '@/components/document/PageMasterSettings'
import { PagePreview } from '@/components/document/PagePreview'
import { PaginatedLayoutPreview } from '@/components/document/PaginatedLayoutPreview'
import { EditorCanvas } from '@/components/document/EditorCanvas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageMaster } from '@/lib/document-model'

export default function DocumentModelDemo() {
  const { documentId } = useParams()
  const { 
    document, 
    createNewDocument, 
    loadDocument,
    addSection, 
    addFlow, 
    addBlock, 
    setDocument, 
    updateTitle,
    updateBlockContent,
    deleteBlock,
    addBlockAfter,
    persistence 
  } = useDocumentModel()
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

  const handleAddBlock = (sectionId: string, flowId: string, type: 'heading' | 'paragraph' | 'ordered-list' | 'unordered-list' | 'quote' | 'divider' | 'spacer' | 'figure' | 'table') => {
    if (document) {
      let content: any = blockContent.trim()
      let metadata = {}
      
      // Handle special block types
      if (type === 'heading') {
        metadata = { level: 2 } // Default to H2
      } else if (type === 'ordered-list' || type === 'unordered-list') {
        content = content ? content.split('\n').filter((line: string) => line.trim()) : ['List item 1', 'List item 2', 'List item 3']
      } else if (type === 'figure') {
        content = {
          imageUrl: content || 'sample-image.jpg',
          caption: 'Sample figure caption explaining the content of the image',
          number: 1
        }
        metadata = { imageHeight: 2.5 }
      } else if (type === 'table') {
        content = {
          headers: ['Column 1', 'Column 2', 'Column 3'],
          rows: [
            ['Row 1, Cell 1', 'Row 1, Cell 2', 'Row 1, Cell 3'],
            ['Row 2, Cell 1', 'Row 2, Cell 2', 'Row 2, Cell 3'],
            ['Row 3, Cell 1', 'Row 3, Cell 2', 'Row 3, Cell 3'],
            ['Row 4, Cell 1', 'Row 4, Cell 2', 'Row 4, Cell 3'],
            ['Row 5, Cell 1', 'Row 5, Cell 2', 'Row 5, Cell 3'],
            ['Row 6, Cell 1', 'Row 6, Cell 2', 'Row 6, Cell 3'],
            ['Row 7, Cell 1', 'Row 7, Cell 2', 'Row 7, Cell 3'],
            ['Row 8, Cell 1', 'Row 8, Cell 2', 'Row 8, Cell 3']
          ],
          caption: content || 'Sample table with demonstration data',
          number: 1
        }
      } else if (type === 'divider') {
        content = '---'
      } else if (type === 'spacer') {
        content = ''
        metadata = { height: 0.5 }
      } else if (!content && !['divider', 'spacer', 'figure', 'table'].includes(type)) {
        return // Don't add empty blocks except dividers, spacers, figures, and tables
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
    const section = addSection('Advanced Layout Showcase')
    if (section) {
      setSelectedSectionId(section.id)
      const flow = addFlow(section.id, 'Main Content Flow')
      if (flow) {
        // Create content demonstrating figures and tables
        let block = addBlock(section.id, flow.id, 'heading', 'Figures and Tables Demonstration')
        if (block) block.metadata = { level: 1 }
        
        addBlock(section.id, flow.id, 'paragraph', 'This document showcases atomic blocks like figures and tables, which maintain their integrity during pagination. Figures never split, and tables repeat headers when spanning pages.')
        
        // Add a figure (atomic block)
        let figureBlock = addBlock(section.id, flow.id, 'figure', {
          imageUrl: 'document-structure-diagram.png',
          caption: 'Semantic document structure showing the hierarchy from Document to Section to Flow to Block',
          number: 1
        })
        if (figureBlock) figureBlock.metadata = { imageHeight: 3 }
        
        block = addBlock(section.id, flow.id, 'heading', 'Professional Table Layout')
        if (block) block.metadata = { level: 2 }
        
        addBlock(section.id, flow.id, 'paragraph', 'Tables automatically repeat their headers when flowing across pages. They never split within a row, ensuring data integrity and readability.')
        
        // Add a large table to demonstrate pagination
        addBlock(section.id, flow.id, 'table', {
          headers: ['Feature', 'Description', 'Status'],
          rows: [
            ['Keep-with-next', 'Headings stay with following content', 'Implemented'],
            ['Widow/Orphan Protection', 'Minimum 2 lines together', 'Implemented'],
            ['Atomic Blocks', 'Figures never split', 'Implemented'],
            ['Table Headers', 'Repeat on new pages', 'Implemented'],
            ['Break Avoidance', 'Lists prefer to stay together', 'Implemented'],
            ['Multi-column Layout', 'Content flows across columns', 'Implemented'],
            ['Page Generation', 'Automatic page creation', 'Implemented'],
            ['Professional Typography', 'Publication-quality rules', 'Implemented'],
            ['Content Splitting', 'Smart paragraph breaks', 'Implemented'],
            ['Layout Engine', 'Rule-based placement', 'Implemented']
          ],
          caption: 'Implementation status of professional typography features',
          number: 1
        })
        
        addBlock(section.id, flow.id, 'unordered-list', [
          'Figures are atomic - they move as complete units',
          'Tables can span pages but never split rows',
          'Headers repeat automatically on continuation pages',
          'Professional spacing maintained throughout'
        ])
        
        block = addBlock(section.id, flow.id, 'heading', 'Layout Behavior')
        if (block) block.metadata = { level: 2 }
        
        addBlock(section.id, flow.id, 'paragraph', 'When a figure is too tall for remaining column space, it moves entirely to the next column or page. Tables flow naturally but maintain row integrity - if a row cannot fit, the entire row moves to the next page along with a repeated header.')
        
        // Another figure to test multiple figures
        figureBlock = addBlock(section.id, flow.id, 'figure', {
          imageUrl: 'pagination-rules-diagram.png',
          caption: 'Visual representation of pagination rules including widow/orphan protection and keep-with-next behavior',
          number: 2
        })
        if (figureBlock) figureBlock.metadata = { imageHeight: 2.5 }
        
        addBlock(section.id, flow.id, 'quote', 'Professional document layout is not just about making things look good - it is about ensuring readability, maintaining data integrity, and following established typographic conventions that enhance comprehension.')
      }
    }
  }

  const selectedSection = document?.sections.find(s => s.id === selectedSectionId)

  const handleSaveAs = async (newTitle: string) => {
    if (document) {
      await persistence.saveAs(document, newTitle)
    }
  }

  // Auto-load document if documentId is in URL
  useEffect(() => {
    if (documentId && !document) {
      loadDocument(documentId)
    }
  }, [documentId, document, loadDocument])

  return (
    <div className="min-h-screen bg-background">
      {document && (
        <DocumentHeader
          title={document.title}
          saveStatus={persistence.saveStatus}
          documentMetadata={persistence.documentMetadata}
          onTitleChange={updateTitle}
          onSaveAs={handleSaveAs}
          onClose={persistence.closeDocument}
        />
      )}
      
      <div className="container mx-auto p-6 space-y-6">
        {!document && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Document Model Demo</h1>
            <p className="text-muted-foreground">
              Semantic document structure: Document → Section → Flow → Block
            </p>
          </div>
        )}

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
                                    onClick={() => handleAddBlock(section.id, flow.id, 'figure')}
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    Figure
                                  </Button>
                                  <Button
                                    onClick={() => handleAddBlock(section.id, flow.id, 'table')}
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    Table
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
                      {/* Editor Canvas - Main editing interface */}
                      <EditorCanvas
                        section={section}
                        onContentChange={updateBlockContent}
                        onNewBlock={(afterBlockId, type) => {
                          // Special handling for creating first block
                          if (afterBlockId === 'create-first') {
                            addBlockAfter('create-first', type, '')
                          } else {
                            addBlockAfter(afterBlockId, type, '')
                          }
                        }}
                        onDeleteBlock={deleteBlock}
                      />
                      
                      {/* Layout Configuration */}
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
                      
                      {/* Layout Preview */}
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
    </div>
  )
}