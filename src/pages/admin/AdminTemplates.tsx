import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTemplates } from '@/hooks/useSupabaseData'
import DraftTemplatesView from '@/components/admin/DraftTemplatesView'
import { 
  Palette, 
  Plus,
  Edit,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  ArrowLeft,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCcw
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/integrations/supabase/client'
import type { Tables } from '@/integrations/supabase/types'
import { ImportTemplateDialog } from '@/components/admin/ImportTemplateDialog'
import { toast } from 'sonner'

type Template = Tables<'templates'> & { status?: string }

interface AdminTemplatesProps {
  scope?: 'workspace' | 'global'
}

// Template integrity checker
const checkTemplateIntegrity = (template: any) => {
  const integrity = {
    config: false,
    tpkg: false,
    pngs: false,
    svgs: false,
    pageMasters: false
  }

  // Check config
  if (template.config) {
    integrity.config = true
    // Check pageMasters in config
    const config = template.config as any
    if (config.pageMasters && Array.isArray(config.pageMasters) && config.pageMasters.length >= 3) {
      integrity.pageMasters = true
    }
  }

  // Check tpkg_source
  if (template.tpkg_source) {
    const tpkg = template.tpkg_source as any
    integrity.tpkg = true
    
    // Check for 3 PNGs in previews
    if (tpkg.previews && Array.isArray(tpkg.previews) && tpkg.previews.length >= 3) {
      integrity.pngs = true
    }
    
    // Check for 3 SVGs in assets
    if (tpkg.assets && Array.isArray(tpkg.assets) && tpkg.assets.length >= 3) {
      integrity.svgs = true
    }
  }

  const isComplete = Object.values(integrity).every(Boolean)
  return { integrity, isComplete }
}

export default function AdminTemplates({ scope = 'workspace' }: AdminTemplatesProps) {
  const { templates, loading } = useTemplates()
  const [searchTerm, setSearchTerm] = useState('')
  const [recomposingTemplate, setRecomposingTemplate] = useState<string | null>(null)

  const refetchTemplates = () => {
    // For now, refresh the page to get updated templates
    window.location.reload()
  }

  const recomposeTemplate = async (templateId: string) => {
    setRecomposingTemplate(templateId)
    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token

      if (!token) {
        throw new Error('Authentication required')
      }

      // Call the appropriate composer based on scope
      const composerFunction = scope === 'global' 
        ? 'system-template-gen-seeds-compose'
        : 'template-gen-seeds-compose'

      const response = await supabase.functions.invoke(composerFunction, {
        body: scope === 'global' 
          ? { seedIds: [templateId] }  // For global, use seed ID
          : { templateId },            // For workspace, use template ID
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.error) {
        throw new Error(response.error.message || 'Failed to recompose template')
      }

      toast.success('Template recomposed successfully')
      refetchTemplates()
    } catch (error) {
      console.error('Error recomposing template:', error)
      toast.error(`Failed to recompose template: ${error.message}`)
    } finally {
      setRecomposingTemplate(null)
    }
  }

  const togglePublish = async (templateId: string, currentlyPublished: boolean, isComplete: boolean = true) => {
    if (!currentlyPublished && !isComplete) {
      toast.error('Cannot publish incomplete template. Use "Recompose & Fix" first.')
      return
    }

    try {
      const newStatus = currentlyPublished ? 'draft' : 'published'
      const updatePayload: any = { status: newStatus }
      if (!currentlyPublished && scope === 'global') {
        updatePayload.scope = 'global'
      }
      const { error } = await supabase
        .from('templates')
        .update(updatePayload)
        .eq('id', templateId)

      if (error) {
        if (error.code === '23514' && error.message.includes('templates_publish_guard')) {
          toast.error('Cannot publish: Template is missing required packaging data')
          return
        }
        throw error
      }
      
      // Refresh templates to show updated status
      refetchTemplates()
    } catch (error) {
      console.error('Error updating template status:', error)
      toast.error(`Failed to ${currentlyPublished ? 'unpublish' : 'publish'} template`)
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error
      
      // For database templates, remove from local state
      // Note: This won't work for starter templates - they can't be deleted
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const filteredTemplates = templates.filter(template =>
    (template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     template.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
    ((template as any).status === 'published') &&
    ((template as any).scope === scope)
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={scope === 'global' ? '/system/templates' : '/admin'}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Palette className="w-8 h-8 text-primary" />
              {scope === 'global' ? 'Global Template Management' : 'Template Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {scope === 'global' 
                ? 'Manage global templates available to all users'
                : 'Create, manage, and publish document templates'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <ImportTemplateDialog onImportComplete={refetchTemplates} />
          <Link to={scope === 'global' ? '/system/template-generator' : '/admin/template-generator'}>
            <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Generate Template
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="drafts" className="w-full">
        <TabsList>
          <TabsTrigger value="drafts">Draft Templates</TabsTrigger>
          <TabsTrigger value="published">Published Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="drafts" className="mt-6">
          <DraftTemplatesView />
        </TabsContent>
        
        <TabsContent value="published" className="mt-6">
          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Published Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const { integrity, isComplete } = checkTemplateIntegrity(template as any)
              const isPublished = (template as any).status === 'published'
              
              return (
                <Card key={template.id} className="border-0 shadow-soft hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg line-clamp-1">{template.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                          <Badge className="text-xs bg-green-100 text-green-800">
                            <Eye className="w-3 h-3 mr-1" />
                            Published
                          </Badge>
                          {template.is_premium && (
                            <Badge className="text-xs bg-yellow-100 text-yellow-800">
                              Premium
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Link 
                              to={`/admin/templates/${template.id}/edit`}
                              className="flex items-center w-full"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => togglePublish(template.id, isPublished, isComplete)}>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Unpublish
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deleteTemplate(template.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Integrity Status */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">Package Integrity</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={integrity.config ? "default" : "destructive"} className="text-xs">
                          {integrity.config ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          Config
                        </Badge>
                        <Badge variant={integrity.tpkg ? "default" : "destructive"} className="text-xs">
                          {integrity.tpkg ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          TPKG
                        </Badge>
                        <Badge variant={integrity.pngs ? "default" : "destructive"} className="text-xs">
                          {integrity.pngs ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          3 PNGs
                        </Badge>
                        <Badge variant={integrity.svgs ? "default" : "destructive"} className="text-xs">
                          {integrity.svgs ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          3 SVGs
                        </Badge>
                        <Badge variant={integrity.pageMasters ? "default" : "destructive"} className="text-xs">
                          {integrity.pageMasters ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          ≥3 Masters
                        </Badge>
                      </div>
                      {!isComplete && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <AlertCircle className="w-4 h-4" />
                          <span>Incomplete package - cannot publish</span>
                        </div>
                      )}
                    </div>

                    {/* Template Preview */}
                    <div className="h-32 bg-gradient-to-br from-muted/50 to-muted rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                      <div className="text-center">
                        <Palette className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Preview</p>
                      </div>
                    </div>
                    
                    {/* Template Info */}
                    {template.description && (
                      <CardDescription className="line-clamp-2">
                        {template.description}
                      </CardDescription>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Used {template.usage_count || 0} times</span>
                      <span>{new Date(template.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex gap-2">
                      {!isComplete ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => recomposeTemplate(template.id)}
                          disabled={recomposingTemplate === template.id}
                          className="flex-1"
                        >
                          <RefreshCcw className={`w-4 h-4 mr-1 ${recomposingTemplate === template.id ? 'animate-spin' : ''}`} />
                          Recompose & Fix
                        </Button>
                      ) : (
                        <>
                          <Link to={`/admin/templates/${template.id}/edit`}>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => togglePublish(template.id, isPublished, isComplete)}
                          >
                            <EyeOff className="w-4 h-4 mr-1" />
                            Unpublish
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Empty State */}
          {filteredTemplates.length === 0 && !loading && (
            <div className="text-center py-12">
              <Palette className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? 'No templates found' : 'No templates available'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? `No templates match "${searchTerm}". Try adjusting your search.`
                  : 'Create your first template to get started.'
                }
              </p>
              {!searchTerm && (
                <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-200">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}