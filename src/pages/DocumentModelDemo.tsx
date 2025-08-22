import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDocumentSectionManagement } from '@/hooks/useDocumentSectionManagement'
import { DocumentHeader } from '@/components/document/DocumentHeader'
import { Navigator } from '@/components/document/Navigator'
import { BlockPalette } from '@/components/document/BlockPalette'
import { EditorCanvas } from '@/components/document/EditorCanvas'
import Inspector from '@/components/document/Inspector'
import { LayoutPreview } from '@/components/document/LayoutPreview'
import { StructureTree } from '@/components/document/StructureTree'
import { CommandPalette } from '@/components/document/CommandPalette'
import { VersionHistoryPanel } from '@/components/document/VersionHistoryPanel'
import { SectionDeleteDialog } from '@/components/document/SectionDeleteDialog'
import { CanvasSectionHeader } from '@/components/document/CanvasSectionHeader'
import { TrashPanel } from '@/components/document/TrashPanel'
import { CoachMarks } from '@/components/onboarding/CoachMarks'
import { useOnboarding } from '@/hooks/useOnboarding'

import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider'
import { DragDropProvider } from '@/contexts/DragDropContext'
import { AltTextValidator } from '@/components/accessibility/AltTextValidator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageMaster, Section, Block, createDocument, createSection, createFlow, createBlock, addBlockToFlow, addFlowToSection, addSectionToDocument } from '@/lib/document-model'
import { History, Trash2 } from 'lucide-react'

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
    revertToVersion,
    persistence,
    // Section management functions
    trashedSections,
    handleDeleteSections,
    handleRestoreSection,
    handleUndoLastDeletion,
    handleRenameSection,
    handleDuplicateSection,
    handleMoveSectionUp,
    handleMoveSectionDown,
    permanentlyDeleteSection,
    emptyTrash,
    canDeleteSections,
    getAdjacentSections
  } = useDocumentSectionManagement()
  const [docTitle, setDocTitle] = useState('')
  const [sectionName, setSectionName] = useState('')
  const [flowName, setFlowName] = useState('')
  const [blockContent, setBlockContent] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string>('')
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [debugMode] = useState(new URLSearchParams(window.location.search).get('debug') === '1')
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [focusedSection, setFocusedSection] = useState<'navigator' | 'canvas' | 'inspector'>('canvas')
  
  // Onboarding
  const {
    showCoachMarks: isCoachMarksVisible,
    triggerCoachMarks,
    completeOnboarding,
    dismissOnboarding,
    isEligibleForOnboarding
  } = useOnboarding()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [sectionsToDelete, setSectionsToDelete] = useState<string[]>([])
  const [showTrashPanel, setShowTrashPanel] = useState(false)

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

  // Section deletion handlers
  const handleDeleteSectionRequest = (sectionIds: string[]) => {
    setSectionsToDelete(sectionIds)
    setShowDeleteDialog(true)
  }

  const handleConfirmDeleteSections = (
    sectionIds: string[],
    contentAction: 'delete' | 'move',
    targetSectionId?: string,
    removeCrossRefs?: boolean
  ) => {
    handleDeleteSections(sectionIds, contentAction, targetSectionId, removeCrossRefs)
    setShowDeleteDialog(false)
    setSectionsToDelete([])
  }

  // Command palette handlers
  const handleDeleteCurrentSection = () => {
    if (selectedSectionId) {
      handleDeleteSectionRequest([selectedSectionId])
    }
  }

  const handleDeleteSelectedSections = () => {
    if (selectedSectionIds.length > 0) {
      handleDeleteSectionRequest(selectedSectionIds)
    }
  }

  const currentSection = document?.sections.find(s => s.id === selectedSectionId)
  const currentSectionName = currentSection?.name || ''

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
    // Reset persistence context and build the entire demo document immutably
    persistence.createNewDocument()
    const base = createDocument('Demo Document')

    // Section and flow
    const section = createSection('Advanced Layout Showcase', 0)
    let flow = createFlow('Main Content Flow', 'linear', 0)

    // Helper to create block with optional metadata
    let order = 0
    const makeBlock = (type: Block['type'], content: any, metadata?: Record<string, any>) => {
      const b = createBlock(type, content, order++)
      if (metadata && Object.keys(metadata).length > 0) b.metadata = { ...b.metadata, ...metadata }
      return b
    }

    // Content blocks
    flow = addBlockToFlow(flow, makeBlock('heading', 'Figures and Tables Demonstration', { level: 1 }))
    flow = addBlockToFlow(flow, makeBlock('paragraph', 'This document showcases atomic blocks like figures and tables, which maintain their integrity during pagination. Figures never split, and tables repeat headers when spanning pages.'))

    flow = addBlockToFlow(flow, makeBlock('figure', {
      imageUrl: 'document-structure-diagram.png',
      caption: 'Semantic document structure showing the hierarchy from Document to Section to Flow to Block',
      number: 1
    }, { imageHeight: 3 }))

    flow = addBlockToFlow(flow, makeBlock('heading', 'Professional Table Layout', { level: 2 }))
    flow = addBlockToFlow(flow, makeBlock('paragraph', 'Tables automatically repeat their headers when flowing across pages. They never split within a row, ensuring data integrity and readability.'))

    flow = addBlockToFlow(flow, makeBlock('table', {
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
    }))

    flow = addBlockToFlow(flow, makeBlock('unordered-list', [
      'Figures are atomic - they move as complete units',
      'Tables can span pages but never split rows',
      'Headers repeat automatically on continuation pages',
      'Professional spacing maintained throughout'
    ]))

    flow = addBlockToFlow(flow, makeBlock('heading', 'Layout Behavior', { level: 2 }))
    flow = addBlockToFlow(flow, makeBlock('paragraph', 'When a figure is too tall for remaining column space, it moves entirely to the next column or page. Tables flow naturally but maintain row integrity - if a row cannot fit, the entire row moves to the next page along with a repeated header.'))

    flow = addBlockToFlow(flow, makeBlock('figure', {
      imageUrl: 'pagination-rules-diagram.png',
      caption: 'Visual representation of pagination rules including widow/orphan protection and keep-with-next behavior',
      number: 2
    }, { imageHeight: 2.5 }))

    flow = addBlockToFlow(flow, makeBlock('quote', 'Professional document layout is not just about making things look good - it is about ensuring readability, maintaining data integrity, and following established typographic conventions that enhance comprehension.'))

    // Assemble document
    const sectionWithFlow = addFlowToSection(section, flow)
    const fullDoc = addSectionToDocument(base, sectionWithFlow)

    // Commit once and set selection
    setDocument(fullDoc)
    setSelectedSectionId(section.id)
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      
      // Delete section shortcut: Cmd+Backspace (Mac) or Ctrl+Backspace (Win)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
        e.preventDefault()
        if (selectedSectionId) {
          handleDeleteSectionRequest([selectedSectionId])
        }
      }
    }

    window.document.addEventListener('keydown', handleKeyDown)
    return () => window.document.removeEventListener('keydown', handleKeyDown)
  }, [selectedSectionId])

  // Handle command palette block insertion
  const handleCommandPaletteInsert = (blockType: Block['type'], content?: any, metadata?: any) => {
    if (!document) return
    
    // Determine insertion target based on focus
    let targetBlockId = focusedBlockId || 'create-first'
    
    // If we have a focused block, insert after it
    // If no focused block, insert at the end of the primary flow
    if (!focusedBlockId) {
      const currentSection = document.sections.find(s => 
        s.id === (selectedSectionId || document.sections[0]?.id)
      )
      if (currentSection && currentSection.flows.length > 0) {
        const primaryFlow = currentSection.flows[0]
        if (primaryFlow.blocks.length > 0) {
          // Insert after the last block
          targetBlockId = primaryFlow.blocks[primaryFlow.blocks.length - 1].id
        }
      }
    }
    
    addBlockAfter(targetBlockId, blockType, content, metadata)
  }

  return (
    <AccessibilityProvider>
      <DragDropProvider>
        <div className="min-h-screen bg-background flex flex-col">
          {document && (
          <DocumentHeader
            documentId={document.id}
            title={document.title}
            saveStatus={persistence.saveStatus}
            documentMetadata={persistence.documentMetadata}
            onTitleChange={updateTitle}
            onSaveAs={handleSaveAs}
            onClose={persistence.closeDocument}
            debugMode={debugMode}
            onDebugToggle={() => {}} // Debug mode is read-only from URL param
            onToggleVersionHistory={() => setShowVersionHistory(!showVersionHistory)}
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
          // ... keep existing code (3-pane editor layout)
          // 3-Pane Editor Layout
          <div className="flex-1 flex">
            {/* Left Sidebar */}
            <div className={`border-r border-border bg-muted/30 transition-all duration-200 ${
              debugMode ? 'w-60' : 'w-80'
            }`} data-testid="navigator">
              <Tabs defaultValue="navigator" className="h-full flex flex-col">
                <TabsList className={`grid w-full rounded-none border-b ${
                  debugMode 
                    ? showVersionHistory 
                      ? trashedSections.length > 0 ? 'grid-cols-5' : 'grid-cols-4' 
                      : trashedSections.length > 0 ? 'grid-cols-4' : 'grid-cols-3'
                    : showVersionHistory
                      ? trashedSections.length > 0 ? 'grid-cols-4' : 'grid-cols-3'
                      : trashedSections.length > 0 ? 'grid-cols-3' : 'grid-cols-2'
                }`}>
                  <TabsTrigger value="navigator">Navigator</TabsTrigger>
                  <TabsTrigger value="blocks">Blocks</TabsTrigger>
                  {showVersionHistory && (
                    <TabsTrigger value="history">
                      <History className="h-4 w-4 mr-1" />
                      History
                    </TabsTrigger>
                  )}
                  {trashedSections.length > 0 && (
                    <TabsTrigger value="trash">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Trash ({trashedSections.length})
                    </TabsTrigger>
                  )}
                  {debugMode && (
                    <TabsTrigger value="structure">Structure</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="navigator" className="flex-1 mt-0">
                  <Navigator
                    document={document}
                    selectedSectionId={selectedSectionId || document.sections[0]?.id}
                    selectedSectionIds={selectedSectionIds}
                    onSectionSelect={setSelectedSectionId}
                    onMultiSectionSelect={setSelectedSectionIds}
                    onAddSection={(name) => {
                      const section = addSection(name)
                      if (section) {
                        setSelectedSectionId(section.id)
                        setSelectedSectionIds([section.id])
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
                    onDeleteSections={handleDeleteSectionRequest}
                    onRenameSection={handleRenameSection}
                    onDuplicateSection={handleDuplicateSection}
                    onMoveSectionUp={handleMoveSectionUp}
                    onMoveSectionDown={handleMoveSectionDown}
                    onBlockDrop={(sectionId, flowId, blockType, position) => {
                      // Handle block drops from Navigator - insert block into specified flow
                      addBlockAfter('create-first', blockType as any, '', { 
                        sectionId, 
                        flowId,
                        position 
                      })
                    }}
                  />
                </TabsContent>
                
                {trashedSections.length > 0 && (
                  <TabsContent value="trash" className="flex-1 mt-0">
                    <TrashPanel
                      trashedSections={trashedSections}
                      onRestoreSection={(trashedSection) => handleRestoreSection(trashedSection.id)}
                      onPermanentlyDelete={permanentlyDeleteSection}
                      onEmptyTrash={emptyTrash}
                    />
                  </TabsContent>
                )}
                
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
                          case 'cross-reference':
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
                 
                 {showVersionHistory && (
                   <TabsContent value="history" className="flex-1 mt-0">
                     <VersionHistoryPanel
                       documentId={persistence.currentDocumentId!}
                       currentDocument={document}
                       onRevertToVersion={revertToVersion}
                       className="h-full"
                     />
                   </TabsContent>
                 )}
                 
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
            
            {/* Main Canvas */}
            <div className="flex-1 flex flex-col" data-testid="canvas">
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
                        <div key={section.id} className="flex-1 flex flex-col">
                           {/* Canvas Section Header */}
                           <CanvasSectionHeader
                             section={section}
                             canDelete={canDeleteSections([section.id])}
                             onDeleteSection={() => handleDeleteSectionRequest([section.id])}
                           />
                          
                          <EditorCanvas
                            section={section}
                            document={document}
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
                            onBlockSelect={setSelectedBlockId}
                            onFocusChange={setFocusedBlockId}
                          />
                        </div>
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
            <div className="flex" data-testid="inspector">
              <Inspector
                selectedBlock={selectedBlock}
                currentSection={document.sections.find(s => s.id === (selectedSectionId || document.sections[0]?.id))!}
                allSections={document.sections}
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
                onDeleteSection={(sectionId) => handleDeleteSectionRequest([sectionId])}
                canDeleteSection={selectedSectionId ? canDeleteSections([selectedSectionId]) : false}
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
        <CommandPalette
          open={commandPaletteOpen}
          onOpenChange={setCommandPaletteOpen}
          onInsertBlock={handleCommandPaletteInsert}
          onDeleteCurrentSection={handleDeleteCurrentSection}
          onDeleteSelectedSections={handleDeleteSelectedSections}
          hasSelectedSections={selectedSectionIds.length > 1}
          currentSectionName={currentSectionName}
        />
        
        {/* Section Delete Dialog */}
        <SectionDeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          sections={document?.sections || []}
          selectedSectionIds={sectionsToDelete}
          onDeleteSections={handleConfirmDeleteSections}
        />
        
        {/* Alt Text Validator */}
        <AltTextValidator
          document={document}
          onFocusFigure={(blockId) => {
            setSelectedBlockId(blockId)
            setFocusedBlockId(blockId)
          }}
        />
        
        {/* Coach Marks for First-time Users */}
        <CoachMarks
          isVisible={isCoachMarksVisible}
          onComplete={completeOnboarding}
          onDismissAll={dismissOnboarding}
        />
        
      </DragDropProvider>
    </AccessibilityProvider>
  )
}