import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDocumentModel } from '@/hooks/useDocumentModel'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, FileText, Palette, Hash, Download, Archive } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

const DocumentSettings = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const documentId = id === 'new' ? undefined : id
  const { document, loadDocument, setDocument, persistence } = useDocumentModel()
  
  // Local state for settings
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft')
  const [theme, setTheme] = useState('default')
  const [enableNumbering, setEnableNumbering] = useState(true)
  const [enableTOC, setEnableTOC] = useState(true)
  const [tocMaxDepth, setTocMaxDepth] = useState(3)
  const [exportFormat, setExportFormat] = useState('pdf')
  const [exportQuality, setExportQuality] = useState('high')
  const [includeMetadata, setIncludeMetadata] = useState(true)
  
  // Load document when component mounts
  useEffect(() => {
    if (documentId && !document) {
      loadDocument(documentId)
    }
  }, [documentId, document, loadDocument])
  
  // Update local state when document loads
  useEffect(() => {
    if (document) {
      setTitle(document.title || '')
      setDescription(document.description || '')
      setTags(document.metadata?.tags?.join(', ') || '')
      setStatus(document.metadata?.status || 'draft')
      setTheme(document.metadata?.theme || 'default')
      setEnableNumbering(document.metadata?.enableNumbering !== false)
      setEnableTOC(document.metadata?.enableTOC !== false)
      setTocMaxDepth(document.metadata?.tocMaxDepth || 3)
      setExportFormat(document.metadata?.exportFormat || 'pdf')
      setExportQuality(document.metadata?.exportQuality || 'high')
      setIncludeMetadata(document.metadata?.includeMetadata !== false)
    }
  }, [document])
  
  const handleSave = async () => {
    if (!document) return
    
    const updatedDoc = {
      ...document,
      title,
      description,
      metadata: {
        ...document.metadata,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        status,
        theme,
        enableNumbering,
        enableTOC,
        tocMaxDepth,
        exportFormat,
        exportQuality,
        includeMetadata
      },
      updated_at: new Date().toISOString()
    }
    
    setDocument(updatedDoc)
    toast.success('Settings saved successfully')
  }
  
  const handleBackToEditor = () => {
    navigate(`/documents/${documentId}/editor`)
  }
  
  if (!document) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBackToEditor}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Editor
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Document Settings</h1>
                <p className="text-sm text-muted-foreground">
                  Configure document properties and export options
                </p>
              </div>
            </div>
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        
        {/* Metadata Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Document Metadata</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter document title..."
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg">
                    <SelectItem value="draft">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Draft
                      </div>
                    </SelectItem>
                    <SelectItem value="published">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Published
                      </div>
                    </SelectItem>
                    <SelectItem value="archived">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        Archived
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the document..."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="research, analysis, report..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(document.created_at))} ago
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Modified</Label>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(document.updated_at))} ago
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Theme Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Theme & Appearance</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="theme">Document Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg">
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="classic">Classic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border border-border rounded-lg text-center">
                <div className="w-full h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded mb-2"></div>
                <Badge variant="outline">Professional</Badge>
              </div>
              <div className="p-4 border border-border rounded-lg text-center">
                <div className="w-full h-20 bg-gradient-to-br from-slate-50 to-gray-100 rounded mb-2"></div>
                <Badge variant="outline">Minimal</Badge>
              </div>
              <div className="p-4 border border-border rounded-lg text-center">
                <div className="w-full h-20 bg-gradient-to-br from-green-50 to-emerald-100 rounded mb-2"></div>
                <Badge variant="outline">Academic</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Numbering & TOC Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Hash className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Numbering & Table of Contents</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Enable Heading Numbering</Label>
                <p className="text-xs text-muted-foreground">Automatically number headings (1., 1.1., 1.1.1.)</p>
              </div>
              <Switch 
                checked={enableNumbering} 
                onCheckedChange={setEnableNumbering} 
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Generate Table of Contents</Label>
                <p className="text-xs text-muted-foreground">Include TOC in document exports</p>
              </div>
              <Switch 
                checked={enableTOC} 
                onCheckedChange={setEnableTOC} 
              />
            </div>
            
            <div>
              <Label htmlFor="tocDepth">TOC Maximum Depth</Label>
              <Select value={String(tocMaxDepth)} onValueChange={(value) => setTocMaxDepth(parseInt(value))}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg">
                  <SelectItem value="1">H1 only</SelectItem>
                  <SelectItem value="2">H1-H2</SelectItem>
                  <SelectItem value="3">H1-H3</SelectItem>
                  <SelectItem value="4">H1-H4</SelectItem>
                  <SelectItem value="5">H1-H5</SelectItem>
                  <SelectItem value="6">All levels</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Export Defaults Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Download className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Export Defaults</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exportFormat">Default Format</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg">
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="docx">Word Document</SelectItem>
                    <SelectItem value="html">HTML Page</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="exportQuality">Export Quality</Label>
                <Select value={exportQuality} onValueChange={setExportQuality}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg">
                    <SelectItem value="high">High Quality</SelectItem>
                    <SelectItem value="medium">Medium Quality</SelectItem>
                    <SelectItem value="low">Low Quality (Faster)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Include Metadata in Export</Label>
                <p className="text-xs text-muted-foreground">Add document properties to exported files</p>
              </div>
              <Switch 
                checked={includeMetadata} 
                onCheckedChange={setIncludeMetadata} 
              />
            </div>
          </div>
        </Card>

        {/* Document Status Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Archive className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Document State</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  status === 'draft' ? 'border-yellow-500 bg-yellow-50' : 'border-border hover:border-yellow-300'
                }`}
                onClick={() => setStatus('draft')}
              >
                <div className="text-center">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full mx-auto mb-2"></div>
                  <h3 className="font-medium">Draft</h3>
                  <p className="text-xs text-muted-foreground">Work in progress</p>
                </div>
              </div>
              
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  status === 'published' ? 'border-green-500 bg-green-50' : 'border-border hover:border-green-300'
                }`}
                onClick={() => setStatus('published')}
              >
                <div className="text-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <h3 className="font-medium">Published</h3>
                  <p className="text-xs text-muted-foreground">Ready to share</p>
                </div>
              </div>
              
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  status === 'archived' ? 'border-gray-500 bg-gray-50' : 'border-border hover:border-gray-300'
                }`}
                onClick={() => setStatus('archived')}
              >
                <div className="text-center">
                  <div className="w-8 h-8 bg-gray-500 rounded-full mx-auto mb-2"></div>
                  <h3 className="font-medium">Archived</h3>
                  <p className="text-xs text-muted-foreground">No longer active</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Save Status */}
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${
              persistence.saveStatus === 'saved' ? 'bg-green-500' : 
              persistence.saveStatus === 'saving' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            {persistence.saveStatus === 'saved' && 'All changes saved'}
            {persistence.saveStatus === 'saving' && 'Saving changes...'}
            {persistence.saveStatus === 'error' && 'Error saving changes'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentSettings