import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Globe, Eye, Download, ArrowRightLeft, Filter } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/integrations/supabase/client'
import { useParams } from 'react-router-dom'
import { emitAnalyticsEvent } from '@/lib/analytics'

interface Template {
  id: string
  name: string
  description: string | null
  category: string
  status: string | null
  created_at: string
  updated_at: string
  preview_image_url: string | null
  metadata: any
  is_global: boolean
  user_id: string | null
}

export const TemplatesList = () => {
  const { workspaceId } = useParams()
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [publishResult, setPublishResult] = useState<any>(null)
  
  // Filter states
  const [filters, setFilters] = useState({
    docType: 'all',
    stylePack: 'all',
    industry: 'all',
    status: 'all'
  })

  // Load templates
  const loadTemplates = async () => {
    if (!workspaceId) return
    
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (err) {
      console.error('Error loading templates:', err)
      setError('Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }

  // Apply filters to templates
  const applyFilters = () => {
    let filtered = templates

    if (filters.docType !== 'all') {
      filtered = filtered.filter(t => t.metadata?.facets?.docType === filters.docType)
    }
    if (filters.stylePack !== 'all') {
      filtered = filtered.filter(t => t.metadata?.facets?.stylePack === filters.stylePack)
    }
    if (filters.industry !== 'all') {
      filtered = filtered.filter(t => t.metadata?.facets?.industry === filters.industry)
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status)
    }

    setFilteredTemplates(filtered)
  }

  // Get unique filter options
  const getFilterOptions = () => {
    const docTypes = new Set<string>()
    const stylePacks = new Set<string>()
    const industries = new Set<string>()
    const statuses = new Set<string>()

    templates.forEach(template => {
      const facets = template.metadata?.facets
      if (facets?.docType) docTypes.add(facets.docType)
      if (facets?.stylePack) stylePacks.add(facets.stylePack)
      if (facets?.industry) industries.add(facets.industry)
      if (template.status) statuses.add(template.status)
    })

    return {
      docTypes: Array.from(docTypes).sort(),
      stylePacks: Array.from(stylePacks).sort(),
      industries: Array.from(industries).sort(),
      statuses: Array.from(statuses).sort()
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [workspaceId])

  useEffect(() => {
    applyFilters()
  }, [templates, filters])

  // Handle template selection
  const handleTemplateSelection = (templateId: string, checked: boolean) => {
    const newSelected = new Set(selectedTemplates)
    if (checked) {
      newSelected.add(templateId)
    } else {
      newSelected.delete(templateId)
    }
    setSelectedTemplates(newSelected)
  }

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const draftTemplates = filteredTemplates.filter(t => t.status === 'draft').map(t => t.id)
      setSelectedTemplates(new Set(draftTemplates))
    } else {
      setSelectedTemplates(new Set())
    }
  }

  // Handle publish selected
  const handlePublishSelected = async () => {
    if (selectedTemplates.size === 0) {
      setError('Please select templates to publish')
      return
    }

    setIsPublishing(true)
    setError(null)
    setPublishResult(null)

    try {
      const SUPABASE_URL = 'https://dbrzfjekbfkjathotjcj.supabase.co'
      const url = `${SUPABASE_URL}/functions/v1/templates-publish`
      
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token

      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          templateIds: Array.from(selectedTemplates),
          workspaceId 
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Publish result:', result)
      
      setPublishResult(result)
      setSelectedTemplates(new Set()) // Clear selection
      
      // Reload templates to show updated statuses
      await loadTemplates()
      
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publishing failed')
    } finally {
      setIsPublishing(false)
    }
  }

  // Handle template interactions for analytics
  const handleTemplateOpen = (template: Template) => {
    const facets = template.metadata?.facets || {
      docType: template.category,
      stylePack: 'default',
      industry: 'general'
    }

    emitAnalyticsEvent('template_opened', {
      templateId: template.id,
      facets,
      workspaceId
    })
  }

  const handleTemplateSelectForUse = (template: Template, docId?: string) => {
    const facets = template.metadata?.facets || {
      docType: template.category,
      stylePack: 'default',
      industry: 'general'
    }

    emitAnalyticsEvent('template_selected', {
      templateId: template.id,
      facets,
      workspaceId,
      docId
    })
  }

  const handleTemplateExport = (template: Template, format: string) => {
    const facets = template.metadata?.facets || {
      docType: template.category,
      stylePack: 'default',
      industry: 'general'
    }

    emitAnalyticsEvent('template_exported', {
      templateId: template.id,
      facets,
      workspaceId,
      format
    })
  }

  const handleTemplateRetarget = (fromTemplateId: string, toTemplateId: string) => {
    emitAnalyticsEvent('template_retargeted', {
      fromTemplateId,
      toTemplateId,
      workspaceId
    })
  }

  const draftTemplates = filteredTemplates.filter(t => t.status === 'draft')
  const publishedTemplates = filteredTemplates.filter(t => t.status === 'published')
  const allSelected = draftTemplates.length > 0 && draftTemplates.every(t => selectedTemplates.has(t.id))
  const someSelected = draftTemplates.some(t => selectedTemplates.has(t.id))
  const filterOptions = getFilterOptions()

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {publishResult && (
        <Alert>
          <Globe className="h-4 w-4" />
          <AlertDescription>
            Successfully published {publishResult.publishedCount} template(s)!
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Templates</CardTitle>
            <CardDescription>
              Manage and publish your generated templates ({templates.length} total)
            </CardDescription>
          </div>
          <Button 
            onClick={handlePublishSelected}
            disabled={isPublishing || selectedTemplates.size === 0}
            className="min-w-[140px]"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Publish selected ({selectedTemplates.size})
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={filters.docType} onValueChange={(value) => setFilters(prev => ({ ...prev, docType: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Doc Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doc Types</SelectItem>
                {filterOptions.docTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.stylePack} onValueChange={(value) => setFilters(prev => ({ ...prev, stylePack: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Style Pack" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Style Packs</SelectItem>
                {filterOptions.stylePacks.map(pack => (
                  <SelectItem key={pack} value={pack}>{pack}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.industry} onValueChange={(value) => setFilters(prev => ({ ...prev, industry: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {filterOptions.industries.map(industry => (
                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {filterOptions.statuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filters.docType !== 'all' || filters.stylePack !== 'all' || filters.industry !== 'all' || filters.status !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ docType: 'all', stylePack: 'all', industry: 'all', status: 'all' })}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading templates...</span>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {templates.length === 0 
                ? "No templates found. Create some templates first using the Seeds tab."
                : "No templates match the current filters."
              }
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all draft templates"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Facets</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => {
                    const facets = template.metadata?.facets
                    const isSelected = selectedTemplates.has(template.id)
                    const isDraft = template.status === 'draft'
                    
                    return (
                      <TableRow key={template.id}>
                        <TableCell>
                          {isDraft && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => 
                                handleTemplateSelection(template.id, checked as boolean)
                              }
                              aria-label={`Select ${template.name}`}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {template.preview_image_url && (
                              <img 
                                src={template.preview_image_url} 
                                alt={template.name}
                                className="w-8 h-6 object-cover rounded border"
                              />
                            )}
                            <div>
                              <div className="font-medium">{template.name}</div>
                              {template.description && (
                                <div className="text-sm text-muted-foreground">
                                  {template.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{template.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {facets && (
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {facets.docType}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {facets.stylePack}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {facets.industry}
                              </Badge>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            template.status === 'published' ? 'default' :
                            template.status === 'draft' ? 'secondary' :
                            'outline'
                          }>
                            {template.status || 'unknown'}
                            {template.is_global && template.status === 'published' && (
                              <Globe className="w-3 h-3 ml-1" />
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(template.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTemplateOpen(template)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTemplateExport(template, 'pdf')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{templates.length}</div>
            <div className="text-sm text-muted-foreground">Total Templates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{draftTemplates.length}</div>
            <div className="text-sm text-muted-foreground">Draft</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{publishedTemplates.length}</div>
            <div className="text-sm text-muted-foreground">Published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{selectedTemplates.size}</div>
            <div className="text-sm text-muted-foreground">Selected</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}