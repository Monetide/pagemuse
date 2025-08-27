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
  MoreVertical
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

type Template = Tables<'templates'>

interface AdminTemplatesProps {
  scope?: 'workspace' | 'global'
}

export default function AdminTemplates({ scope = 'workspace' }: AdminTemplatesProps) {
  const { templates, loading } = useTemplates()
  const [searchTerm, setSearchTerm] = useState('')

  const refetchTemplates = () => {
    // For now, refresh the page to get updated templates
    window.location.reload()
  }

  const togglePublish = async (templateId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('templates')
        .update({ is_global: !currentStatus })
        .eq('id', templateId)

      if (error) throw error
      
      // For database templates, update local state
      const updatedTemplates = templates.map(template => 
        template.id === templateId 
          ? { ...template, is_global: !currentStatus }
          : template
      )
      // Note: This won't work for starter templates - page reload needed
    } catch (error) {
      console.error('Error updating template status:', error)
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
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase())
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
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="border-0 shadow-soft hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg line-clamp-1">{template.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                        {template.is_global ? (
                          <Badge className="text-xs bg-green-100 text-green-800">
                            <Eye className="w-3 h-3 mr-1" />
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Draft
                          </Badge>
                        )}
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
                        <DropdownMenuItem onClick={() => togglePublish(template.id, template.is_global)}>
                          {template.is_global ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-2" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              Publish
                            </>
                          )}
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
                    <Link to={`/admin/templates/${template.id}/edit`}>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant={template.is_global ? "default" : "outline"}
                      onClick={() => togglePublish(template.id, template.is_global)}
                    >
                      {template.is_global ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Publish
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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