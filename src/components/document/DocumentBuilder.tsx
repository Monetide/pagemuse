import React, { useState } from 'react'
import { useDocumentModel } from '@/hooks/useDocumentModel'
import { Block } from '@/types/document'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, FileText } from 'lucide-react'
import { DocumentOutline } from './DocumentOutline'

export const DocumentBuilder: React.FC = () => {
  const { 
    document, 
    createNewDocument, 
    addSection, 
    addFlow, 
    addBlock, 
    getDocumentStats 
  } = useDocumentModel()
  
  const [documentTitle, setDocumentTitle] = useState('')
  const [sectionName, setSectionName] = useState('')
  const [flowName, setFlowName] = useState('')
  const [blockType, setBlockType] = useState<Block['type']>('paragraph')
  const [blockContent, setBlockContent] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedFlow, setSelectedFlow] = useState('')

  const handleCreateDocument = () => {
    if (!documentTitle.trim()) return
    createNewDocument(documentTitle)
    setDocumentTitle('')
  }

  const handleAddSection = () => {
    if (!sectionName.trim()) return
    addSection(sectionName)
    setSectionName('')
  }

  const handleAddFlow = () => {
    if (!flowName.trim() || !selectedSection) return
    addFlow(selectedSection, flowName)
    setFlowName('')
  }

  const handleAddBlock = () => {
    if (!blockContent.trim() || !selectedSection || !selectedFlow) return
    addBlock(selectedSection, selectedFlow, blockType, blockContent)
    setBlockContent('')
  }

  if (!document) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Create New Document</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter document title..."
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateDocument()}
            />
            <Button onClick={handleCreateDocument} className="w-full" disabled={!documentTitle.trim()}>
              Create Document
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = getDocumentStats()

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Controls */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Document: {document.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{stats.sections}</div>
                <div className="text-sm text-muted-foreground">Sections</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{stats.flows}</div>
                <div className="text-sm text-muted-foreground">Flows</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{stats.blocks}</div>
                <div className="text-sm text-muted-foreground">Blocks</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Section</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Section name..."
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
            />
            <Button onClick={handleAddSection} className="w-full" disabled={!sectionName.trim()}>
              Add Section
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Flow</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger>
                <SelectValue placeholder="Select section..." />
              </SelectTrigger>
              <SelectContent>
                {document.sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Flow name..."
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFlow()}
            />
            <Button 
              onClick={handleAddFlow} 
              className="w-full" 
              disabled={!flowName.trim() || !selectedSection}
            >
              Add Flow
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Block</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger>
                <SelectValue placeholder="Select section..." />
              </SelectTrigger>
              <SelectContent>
                {document.sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedFlow} onValueChange={setSelectedFlow} disabled={!selectedSection}>
              <SelectTrigger>
                <SelectValue placeholder="Select flow..." />
              </SelectTrigger>
              <SelectContent>
                {selectedSection && document.sections
                  .find(s => s.id === selectedSection)?.flows
                  .map((flow) => (
                    <SelectItem key={flow.id} value={flow.id}>
                      {flow.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={blockType} onValueChange={(value) => setBlockType(value as Block['type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="heading">Heading</SelectItem>
                <SelectItem value="paragraph">Paragraph</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="quote">Quote</SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Block content..."
              value={blockContent}
              onChange={(e) => setBlockContent(e.target.value)}
            />
            <Button 
              onClick={handleAddBlock} 
              className="w-full" 
              disabled={!blockContent.trim() || !selectedSection || !selectedFlow}
            >
              Add Block
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Outline View */}
      <div>
        <DocumentOutline document={document} />
      </div>
    </div>
  )
}