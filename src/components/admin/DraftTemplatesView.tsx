import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Package,
  Eye,
  FileText,
  Calendar,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { createDocument, createSection, createFlow, createBlock, addFlowToSection, addSectionToDocument, addBlockToFlow } from '@/lib/document-model'

interface TemplateDraft {
  id: string
  name: string
  description: string | null
  status: string | null
  metadata: any | null
  created_at: string
  updated_at: string
  category: string
  user_id: string | null
}

export function DraftTemplatesView() {
  const [drafts, setDrafts] = useState<TemplateDraft[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadDrafts()
  }, [])

  const loadDrafts = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('id, name, description, status, metadata, created_at, updated_at, category, user_id')
        .eq('status', 'draft')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading drafts:', error)
        toast.error('Failed to load template drafts')
        return
      }

      setDrafts(data || [])
    } catch (error) {
      console.error('Error loading drafts:', error)
      toast.error('Failed to load template drafts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTestDocument = async (templateId: string, templateName: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        toast.error('You must be logged in to create documents')
        return
      }

      // Get user's workspace - ensure they have one
      const { data: workspaceData } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', userData.user.id)
        .limit(1)
        .single()

      if (!workspaceData) {
        toast.error('No workspace found. Please create a workspace first.')
        return
      }

      // Create a new document using this template - fetch template pages for structure
      const { data: templatePages } = await supabase
        .from('template_pages')
        .select('*')
        .eq('template_id', templateId)
        .order('page_index')

      const { data: templateData } = await supabase
        .from('templates')
        .select('id, name, description, category, global_styling, metadata')
        .eq('id', templateId)
        .single()

      // Start with base document
      let initialContent = createDocument(`Test Document - ${templateName}`)

      // Apply template pages to create proper structure
      if (templatePages && templatePages.length > 0) {
        // Clear default sections to replace with template structure
        initialContent.sections = []

        templatePages.forEach((page, index) => {
          const section = createSection(page.name || `Section ${index + 1}`, index)
          
          // Set layout intent based on template page
          const layoutConfig = page.layout_config as any
          if (layoutConfig?.type) {
            ;(section as any).layoutIntent = layoutConfig.type
          }

          // Create flow with template content
          let flow = createFlow('Main', 'linear', 0)

          // Add blocks based on template page content scaffold
          const contentScaffold = page.content_scaffold as any
          if (contentScaffold) {
            let blockOrder = 0
            
            // Add title if present
            if (contentScaffold.title) {
              const titleBlock = createBlock('heading', { 
                level: 1, 
                text: contentScaffold.title, 
                id: crypto.randomUUID() 
              }, blockOrder++)
              flow = addBlockToFlow(flow, titleBlock)
            }

            // Add subtitle if present
            if (contentScaffold.subtitle) {
              const subtitleBlock = createBlock('paragraph', { 
                text: contentScaffold.subtitle 
              }, blockOrder++)
              flow = addBlockToFlow(flow, subtitleBlock)
            }

            // Add author if present
            if (contentScaffold.author) {
              const authorBlock = createBlock('paragraph', { 
                text: `Author: ${contentScaffold.author}` 
              }, blockOrder++)
              flow = addBlockToFlow(flow, authorBlock)
            }

            // Add date if present
            if (contentScaffold.date) {
              const dateBlock = createBlock('paragraph', { 
                text: `Date: ${contentScaffold.date}` 
              }, blockOrder++)
              flow = addBlockToFlow(flow, dateBlock)
            }
          }

          // Add the flow to section
          const sectionWithFlow = addFlowToSection(section, flow)
          initialContent = addSectionToDocument(initialContent, sectionWithFlow)
        })
      }

      // Add template metadata
      initialContent.metadata = {
        ...initialContent.metadata,
        __templateInfo: { 
          id: templateData?.id || templateId, 
          name: templateData?.name || templateName, 
          category: templateData?.category || 'general' 
        },
        global_styling: templateData?.global_styling || null
      }
      const { data, error } = await supabase
        .from('documents')
        .insert({
          title: initialContent.title,
          template_id: templateId,
          content: initialContent as any,
          user_id: userData.user.id,
          workspace_id: workspaceData.workspace_id
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating test document:', error)
        toast.error('Failed to create test document')
        return
      }

      toast.success('Test document created!')
      navigate(`/w/${workspaceData.workspace_id}/documents/${data.id}/editor`)
    } catch (error) {
      console.error('Error creating test document:', error)
      toast.error('Failed to create test document')
    }
  }

  const handleDeleteDraft = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting draft:', error)
        toast.error('Failed to delete template draft')
        return
      }

      toast.success('Template draft deleted')
      loadDrafts()
    } catch (error) {
      console.error('Error deleting draft:', error)
      toast.error('Failed to delete template draft')
    }
  }

  const handlePublishTemplate = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('templates')
        .update({ status: 'published' })
        .eq('id', id)

      if (error) {
        console.error('Error publishing template:', error)
        toast.error('Failed to publish template')
        return
      }

      toast.success(`"${name}" published successfully!`)
      loadDrafts()
    } catch (error) {
      console.error('Error publishing template:', error)
      toast.error('Failed to publish template')
    }
  }

  const filteredDrafts = drafts.filter(draft =>
    draft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    draft.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (draft.metadata?.brandName && draft.metadata.brandName.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-2/3 mb-4" />
              <div className="flex gap-2">
                <div className="h-8 bg-muted rounded w-20" />
                <div className="h-8 bg-muted rounded w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">Draft Templates</h2>
        <p className="text-muted-foreground">
          Manage your template packages and create test documents
        </p>
      </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search draft templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Templates Grid */}
      {filteredDrafts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No template drafts found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'Create your first template to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate('/admin/template-generator')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDrafts.map((draft) => (
            <Card key={draft.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{draft.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {draft.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleCreateTestDocument(draft.id, draft.name)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Create Test Document
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handlePublishTemplate(draft.id, draft.name)}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Publish Template
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteDraft(draft.id, draft.name)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Draft
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Template Info */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {draft.status}
                  </Badge>
                  <Badge variant="outline">
                    v{draft.metadata?.version || '1.0.0'}
                  </Badge>
                  {draft.metadata?.brandName && (
                    <Badge variant="outline">
                      {draft.metadata.brandName}
                    </Badge>
                  )}
                </div>

                {/* TPKG Structure Preview */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <h4 className="font-medium text-sm mb-2">TPKG Contents</h4>
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <Package className="w-3 h-3" />
                      <span>template.json</span>
                      <Badge variant="outline" className="text-xs px-1">
                        {Object.keys(draft.metadata || {}).length} properties
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 ml-5">
                      <span>assets/ (3 SVG files)</span>
                    </div>
                    <div className="flex items-center gap-2 ml-5">
                      <span>previews/ (3 PNG images)</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    onClick={() => handleCreateTestDocument(draft.id, draft.name)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Create Test Document
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Navigate to template preview page
                      navigate(`/admin/templates/${draft.id}/preview`)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Created {new Date(draft.created_at).toLocaleDateString()}
                  </div>
                  {draft.metadata?.layoutIntents && (
                    <div>
                      {Object.keys(draft.metadata.layoutIntents).length} layout intents
                    </div>
                  )}
                  {draft.metadata?.colorways && (
                    <div>
                      {Object.keys(draft.metadata.colorways).length} colorway{Object.keys(draft.metadata.colorways).length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default DraftTemplatesView