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

  const handleAddBlock = (sectionId: string, flowId: string, type: 'heading' | 'paragraph') => {
    if (blockContent.trim() && document) {
      addBlock(sectionId, flowId, type, blockContent.trim())
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
        addBlock(section.id, flow.id, 'heading', 'Welcome to Our Document')
        addBlock(section.id, flow.id, 'paragraph', 'This is a paragraph that explains the purpose of this document and provides context for the reader. It contains enough text to demonstrate how content flows through columns and pages.')
        addBlock(section.id, flow.id, 'heading', 'Understanding Document Structure')
        addBlock(section.id, flow.id, 'paragraph', 'Documents are composed of sections, which contain flows of content blocks. Each section has its own page master settings that control layout and formatting.')
        addBlock(section.id, flow.id, 'paragraph', 'When content exceeds the available space in a column, it automatically flows to the next column. When all columns are full, a new page is generated automatically.')
        addBlock(section.id, flow.id, 'heading', 'Advanced Features')
        addBlock(section.id, flow.id, 'paragraph', 'The layout engine supports multiple page sizes, flexible column layouts, configurable margins, and optional headers and footers. Baseline grid alignment ensures consistent typography.')
        addBlock(section.id, flow.id, 'paragraph', 'This additional content helps demonstrate how the pagination system works when content overflows beyond what fits on a single page.')
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
                      <div className="space-y-2">
                        {document.sections.map(section =>
                          section.flows.map(flow => (
                            <div key={flow.id} className="flex gap-2">
                              <Button
                                onClick={() => handleAddBlock(section.id, flow.id, 'heading')}
                                disabled={!blockContent.trim()}
                                size="sm"
                                variant="outline"
                              >
                                Add Heading to "{flow.name}"
                              </Button>
                              <Button
                                onClick={() => handleAddBlock(section.id, flow.id, 'paragraph')}
                                disabled={!blockContent.trim()}
                                size="sm"
                                variant="outline"
                              >
                                Add Paragraph to "{flow.name}"
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