import { useState } from 'react'
import { useDocumentModel } from '@/hooks/useDocumentModel'
import { DocumentOutlineView } from '@/components/document/DocumentOutlineView'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function DocumentModelDemo() {
  const { document, createNewDocument, addSection, addFlow, addBlock } = useDocumentModel()
  const [docTitle, setDocTitle] = useState('')
  const [sectionName, setSectionName] = useState('')
  const [flowName, setFlowName] = useState('')
  const [blockContent, setBlockContent] = useState('')

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

  const createDemoDocument = () => {
    const doc = createNewDocument('Demo Document')
    const section = addSection('Introduction Section')
    if (section) {
      const flow = addFlow(section.id, 'Main Content Flow')
      if (flow) {
        addBlock(section.id, flow.id, 'heading', 'Welcome to Our Document')
        addBlock(section.id, flow.id, 'paragraph', 'This is a paragraph that explains the purpose of this document and provides context for the reader.')
      }
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Document Model Demo</h1>
        <p className="text-muted-foreground">
          Semantic document structure: Document → Section → Flow → Block
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Outline View */}
        <div>
          {document ? (
            <DocumentOutlineView document={document} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Create a document to see the outline</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}