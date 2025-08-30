import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useDocuments } from '@/hooks/useSupabaseData'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { 
  Plus, 
  Search, 
  FileText, 
  Calendar,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  X,
  Building2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function MyDocuments() {
  const navigate = useNavigate()
  const { currentWorkspace } = useWorkspaceContext()
  const { documents, loading, removeDocument, bulkDeleteDocuments } = useDocuments()
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null)
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Since documents are already filtered by workspace in the hook, we don't need additional filtering
  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (doc: any) => {
    const hasContent = doc.content && (Array.isArray(doc.content) ? doc.content.length > 0 : Object.keys(doc.content).length > 0)
    const isRecent = new Date(doc.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    if (!hasContent) return 'bg-yellow-100 text-yellow-800'
    if (isRecent) return 'bg-blue-100 text-blue-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatus = (doc: any) => {
    const hasContent = doc.content && (Array.isArray(doc.content) ? doc.content.length > 0 : Object.keys(doc.content).length > 0)
    const isRecent = new Date(doc.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    if (!hasContent) return 'Draft'
    if (isRecent) return 'Active'
    return 'Completed'
  }

  const handleDeleteDocument = async (docId: string, docTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${docTitle}"? This action cannot be undone.`)) {
      return
    }

    setDeletingDocId(docId)
    
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)

      if (error) throw error

      // Optimistically remove from local state immediately
      removeDocument(docId)
      // Remove from selection if it was selected
      setSelectedDocuments(prev => {
        const newSet = new Set(prev)
        newSet.delete(docId)
        return newSet
      })

      toast({
        title: "Document deleted",
        description: `"${docTitle}" has been deleted successfully.`,
      })
    } catch (error) {
      console.error('Error deleting document:', error)
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingDocId(null)
    }
  }

  const handleBulkDelete = async () => {
    const selectedCount = selectedDocuments.size
    if (selectedCount === 0) return

    const confirmText = selectedCount === 1 
      ? `Are you sure you want to delete 1 document? This action cannot be undone.`
      : `Are you sure you want to delete ${selectedCount} documents? This action cannot be undone.`
    
    if (!confirm(confirmText)) {
      return
    }

    setBulkDeleting(true)
    
    try {
      const result = await bulkDeleteDocuments(Array.from(selectedDocuments))
      
      if (result.error) {
        throw new Error(result.error)
      }

      setSelectedDocuments(new Set())

      toast({
        title: `${selectedCount} document${selectedCount > 1 ? 's' : ''} deleted`,
        description: "Documents have been deleted successfully.",
      })
    } catch (error) {
      console.error('Error deleting documents:', error)
      toast({
        title: "Error",
        description: "Failed to delete documents. Please try again.",
        variant: "destructive",
      })
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleSelectDocument = (docId: string, checked: boolean) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(docId)
      } else {
        newSet.delete(docId)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(new Set(filteredDocuments.map(doc => doc.id)))
    } else {
      setSelectedDocuments(new Set())
    }
  }

  const isAllSelected = filteredDocuments.length > 0 && selectedDocuments.size === filteredDocuments.length
  const isPartiallySelected = selectedDocuments.size > 0 && selectedDocuments.size < filteredDocuments.length
  const selectAllRef = useRef<HTMLButtonElement>(null)

  // Handle indeterminate state for select all checkbox
  useEffect(() => {
    if (selectAllRef.current) {
      const inputElement = selectAllRef.current.querySelector('input')
      if (inputElement) {
        inputElement.indeterminate = isPartiallySelected
      }
    }
  }, [isPartiallySelected])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Documents</h1>
          <p className="text-muted-foreground mt-2">
            {documents.length} document{documents.length !== 1 ? 's' : ''} in {currentWorkspace?.name}
          </p>
        </div>
        <Button 
          className="bg-gradient-primary hover:shadow-glow transition-all duration-200"
          onClick={() => navigate(`/w/${currentWorkspace?.id}/documents/new`)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Document
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-6">
          <div className="flex gap-4 items-center flex-wrap">
            {/* Workspace Filter Chip */}
            <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
              <Building2 className="w-3 h-3" />
              Workspace: {currentWorkspace?.name}
            </Badge>
            
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedDocuments.size > 0 && (
        <Card className="border-0 shadow-soft bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">
                  {selectedDocuments.size} document{selectedDocuments.size > 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedDocuments(new Set())}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-0 shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded animate-pulse w-1/3" />
                      <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                      <div className="h-3 bg-muted rounded animate-pulse w-1/4" />
                    </div>
                    <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <Card className="border-0 shadow-soft">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? 'No documents found' : 'No documents yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery 
                  ? `No documents match "${searchQuery}"`
                  : 'Create your first document to get started'
                }
              </p>
              {!searchQuery && (
                <Button 
                  className="bg-gradient-primary hover:shadow-glow transition-all duration-200"
                  onClick={() => navigate(`/w/${currentWorkspace?.id}/documents/new`)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Document
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Select All Header */}
            {filteredDocuments.length > 0 && (
              <Card className="border-0 shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isAllSelected}
                      ref={selectAllRef}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-muted-foreground">
                      {isAllSelected ? 'All selected' : isPartiallySelected ? 'Some selected' : 'Select all'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="border-0 shadow-soft hover:shadow-medium transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedDocuments.has(doc.id)}
                            onCheckedChange={(checked) => handleSelectDocument(doc.id, checked as boolean)}
                            className="mt-1"
                          />
                          <div className="p-3 rounded-lg bg-primary/10">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">{doc.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {doc.template?.name || 'Custom Document'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Updated {formatDate(doc.updated_at)}
                            </span>
                            <Badge variant="secondary" className={getStatusColor(doc)}>
                              {getStatus(doc)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            console.log('Navigating to view document:', doc.id, 'URL:', `/w/${currentWorkspace?.id}/documents/${doc.id}/editor`)
                            navigate(`/w/${currentWorkspace?.id}/documents/${doc.id}/editor`)
                          }}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            console.log('Navigating to edit document:', doc.id, 'URL:', `/w/${currentWorkspace?.id}/documents/${doc.id}/editor`)
                            console.log('Document object:', doc)
                            navigate(`/w/${currentWorkspace?.id}/documents/${doc.id}/editor`)
                          }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive" 
                            disabled={deletingDocId === doc.id}
                            onClick={() => handleDeleteDocument(doc.id, doc.title)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {deletingDocId === doc.id ? 'Deleting...' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}