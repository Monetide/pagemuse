import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDocumentModel } from '@/hooks/useDocumentModel'
import { DocumentHeader } from '@/components/document/DocumentHeader'
import { Navigator } from '@/components/document/Navigator'
import { BlockPalette } from '@/components/document/BlockPalette'
import { EditorCanvas } from '@/components/document/EditorCanvas'
import Inspector from '@/components/document/Inspector'
import { LayoutPreview } from '@/components/document/LayoutPreview'
import { StructureTree } from '@/components/document/StructureTree'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageMaster, Section } from '@/lib/document-model'

export default function DocumentModelDemo() {
  const { id } = useParams()
  const documentId = id === 'new' ? undefined : id
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
  const [selectedBlockId, setSelectedBlockId] = useState<string>('')
  const [debugMode, setDebugMode] = useState<boolean>(false)

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
  const selectedBlock = selectedSection?.flows
    .flatMap(flow => flow.blocks)
    .find(block => block.id === selectedBlockId)

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
    <div className="min-h-screen bg-background flex flex-col">
      {document && (
        <DocumentHeader
          title={document.title}
          saveStatus={persistence.saveStatus}
          documentMetadata={persistence.documentMetadata}
          onTitleChange={updateTitle}
          onSaveAs={handleSaveAs}
          onClose={persistence.closeDocument}
          debugMode={debugMode}
          onDebugToggle={setDebugMode}
        />
      )}
      
      {!document ? (
        // Document Creation Screen
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Create Document</h1>
              <p className="text-muted-foreground">
                Start with a new document or demo content
              </p>
            </div>
            
            <div className="space-y-4">
              <Input
                placeholder="Document title"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="text-center"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateDocument} 
                  disabled={!docTitle.trim()}
                  className="flex-1"
                >
                  Create Document
                </Button>
                <Button 
                  onClick={createDemoDocument} 
                  variant="outline"
                  className="flex-1"
                >
                  Create Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // 3-Pane Editor Layout
        <div className="flex-1 flex">
          {/* Left Sidebar */}
          <div className={`border-r border-border bg-muted/30 transition-all duration-200 ${
            debugMode ? 'w-60' : 'w-80'
          }`}>
            <Tabs defaultValue="navigator" className="h-full flex flex-col">
              <TabsList className={`grid w-full rounded-none border-b ${
                debugMode ? 'grid-cols-3' : 'grid-cols-2'
              }`}>
                <TabsTrigger value="navigator">Navigator</TabsTrigger>
                <TabsTrigger value="blocks">Blocks</TabsTrigger>
                {debugMode && (
                  <TabsTrigger value="structure">Structure</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="navigator" className="flex-1 mt-0">
                <Navigator
                  document={document}
                  selectedSectionId={selectedSectionId || document.sections[0]?.id}
                  onSectionSelect={setSelectedSectionId}
                  onAddSection={(name) => {
                    const section = addSection(name)
                    if (section) {
                      setSelectedSectionId(section.id)
                      // Add default flow
                      addFlow(section.id, 'Main Flow')
                    }
                  }}
                  onAddFlow={(sectionId, name) => {
                    addFlow(sectionId, name)
                  }}
                  onReorderSections={(sections) => {
                    if (!document) return
                    const updatedDoc = {
                      ...document,
                      sections,
                      updated_at: new Date().toISOString()
                    }
                    setDocument(updatedDoc)
                  }}
                  onJumpToHeading={(blockId) => {
                    // TODO: Implement jump to heading in canvas
                    console.log('Jump to heading:', blockId)
                  }}
                />
              </TabsContent>
              
              <TabsContent value="blocks" className="flex-1 mt-0">
                <BlockPalette
                  onInsertBlock={(blockType) => {
                    // Insert at the end of the primary flow of current section
                    const currentSection = document.sections.find(s => 
                      s.id === (selectedSectionId || document.sections[0]?.id)
                    )
                    if (currentSection && currentSection.flows.length > 0) {
                      const primaryFlow = currentSection.flows[0]
                      let content: any = ''
                      let metadata = {}
                      
                      // Handle different block types with default content
                      switch (blockType) {
                        case 'heading':
                          content = 'New Heading'
                          metadata = { level: 2 }
                          break
                        case 'paragraph':
                          content = 'Start typing...'
                          break
                        case 'ordered-list':
                          content = ['First item', 'Second item', 'Third item']
                          break
                        case 'unordered-list':
                          content = ['First item', 'Second item', 'Third item']
                          break
                        case 'quote':
                          content = 'Enter your quote here...'
                          break
                        case 'divider':
                          content = '---'
                          break
                        case 'spacer':
                          content = ''
                          metadata = { height: 0.5 }
                          break
                        case 'figure':
                          content = {
                            imageUrl: 'placeholder-image.jpg',
                            caption: 'Add your caption here',
                            number: 1
                          }
                          metadata = { imageHeight: 2.5 }
                          break
                        case 'table':
                          content = {
                            headers: ['Column 1', 'Column 2', 'Column 3'],
                            rows: [
                              ['Row 1, Cell 1', 'Row 1, Cell 2', 'Row 1, Cell 3'],
                              ['Row 2, Cell 1', 'Row 2, Cell 2', 'Row 2, Cell 3'],
                            ],
                            caption: 'Table caption',
                            number: 1
                          }
                          break
                        case 'callout':
                          content = 'Important information goes here...'
                          metadata = { type: 'info' }
                          break
                      }
                      
                      const block = addBlock(currentSection.id, primaryFlow.id, blockType as any, content)
                      if (block && Object.keys(metadata).length > 0) {
                        block.metadata = { ...block.metadata, ...metadata }
                      }
                    }
                  }}
                  onDragStart={(blockType) => {
                    // TODO: Implement drag preview and drop zones
                    console.log('Dragging block type:', blockType)
                  }}
                  onDragEnd={() => {
                    // TODO: Clean up drag state
                    console.log('Drag ended')
                  }}
                />
              </TabsContent>
              
              {debugMode && (
                <TabsContent value="structure" className="flex-1 mt-0">
                  <StructureTree
                    document={document}
                    selectedBlockId={selectedBlockId}
                    onBlockSelect={setSelectedBlockId}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>
          
          {/* Center Canvas */}
          <div className="flex-1 flex flex-col">
            {document.sections.length > 0 ? (
              <>
                {/* Section Tabs */}
                {document.sections.length > 1 && (
                  <div className="border-b border-border">
                    <Tabs 
                      value={selectedSectionId || document.sections[0].id} 
                      onValueChange={setSelectedSectionId}
                      className="w-full"
                    >
                      <TabsList className="h-12 w-full justify-start rounded-none bg-transparent">
                        {document.sections.map(section => (
                          <TabsTrigger 
                            key={section.id} 
                            value={section.id}
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                          >
                            {section.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>
                )}
                
                {/* Editor Canvas */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {document.sections.map(section => {
                    const isActiveSection = (selectedSectionId || document.sections[0].id) === section.id
                    if (!isActiveSection) return null
                    
                    return (
                      <EditorCanvas
                        key={section.id}
                        section={section}
                        onContentChange={updateBlockContent}
                        onNewBlock={(afterBlockId, type, content, metadata) => {
                          if (afterBlockId === 'create-first') {
                            const block = addBlockAfter('create-first', type, content || '')
                            if (block && metadata && Object.keys(metadata).length > 0) {
                              block.metadata = { ...block.metadata, ...metadata }
                            }
                          } else {
                            const block = addBlockAfter(afterBlockId, type, content || '')
                            if (block && metadata && Object.keys(metadata).length > 0) {
                              block.metadata = { ...block.metadata, ...metadata }
                            }
                          }
                        }}
                         onDeleteBlock={deleteBlock}
                         onBlockTypeChange={(blockId, type, metadata) => {
                           if (!document) return
                           
                           const updatedDoc = {
                             ...document,
                             sections: document.sections.map(section => ({
                               ...section,
                               flows: section.flows.map(flow => ({
                                 ...flow,
                                 blocks: flow.blocks.map(block => 
                                   block.id === blockId 
                                     ? { 
                                         ...block, 
                                         type, 
                                         metadata: { ...block.metadata, ...metadata } 
                                       }
                                     : block
                                 )
                               }))
                             })),
                             updated_at: new Date().toISOString()
                           }
                           setDocument(updatedDoc)
                         }}
                         selectedBlockId={selectedBlockId}
                         onBlockSelect={setSelectedBlockId}
                      />
                    )
                  })}
                  
                  {document.sections.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <p className="text-muted-foreground">No sections found</p>
                        <Button onClick={() => {
                          setSectionName('Main Section')
                          handleAddSection()
                        }}>
                          Add First Section
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">No sections found</p>
                  <Button onClick={() => {
                    setSectionName('Main Section')
                    handleAddSection()
                  }}>
                    Add First Section
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Inspector/Debug Panel */}
          <div className="flex">
            <Inspector
              selectedBlock={selectedBlock}
              currentSection={document.sections.find(s => s.id === (selectedSectionId || document.sections[0]?.id))!}
              onBlockUpdate={(blockId, updates) => {
                if (!document) return
                
                const updatedDoc = {
                  ...document,
                  sections: document.sections.map(section => ({
                    ...section,
                    flows: section.flows.map(flow => ({
                      ...flow,
                      blocks: flow.blocks.map(block => 
                        block.id === blockId 
                          ? { ...block, ...updates }
                          : block
                      )
                    }))
                  })),
                  updated_at: new Date().toISOString()
                }
                setDocument(updatedDoc)
              }}
              onSectionUpdate={(sectionId, updates) => {
                if (!document) return
                
                const updatedDoc = {
                  ...document,
                  sections: document.sections.map(section =>
                    section.id === sectionId
                      ? { ...section, ...updates }
                      : section
                  ),
                  updated_at: new Date().toISOString()
                }
                setDocument(updatedDoc)
              }}
              onDeleteBlock={deleteBlock}
              onNewBlock={addBlockAfter}
            />
            
            {/* Debug Layout Preview */}
            {debugMode && (
              <LayoutPreview 
                section={document.sections.find(s => s.id === (selectedSectionId || document.sections[0]?.id))!} 
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}