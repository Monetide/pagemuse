import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { SemanticDocument } from '@/lib/document-model'
import { useToast } from '@/hooks/use-toast'

export interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  title: string
  content: SemanticDocument
  version_type: 'autosave' | 'manual' | 'snapshot' | 'safety'
  snapshot_name?: string
  created_by: string
  created_at: string
  metadata?: Record<string, any>
}

export const useDocumentVersions = (documentId?: string) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  // Load versions for document
  const loadVersions = useCallback(async (docId: string) => {
    if (!user || !docId) return

    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', docId)
        .order('version_number', { ascending: false })

      if (error) throw error

      setVersions((data || []).map(item => ({
        ...item,
        content: item.content as unknown as SemanticDocument,
        version_type: item.version_type as DocumentVersion['version_type'],
        snapshot_name: item.snapshot_name || undefined,
        metadata: item.metadata ? (item.metadata as Record<string, any>) : undefined
      })))
    } catch (err) {
      console.error('Error loading versions:', err)
      setError('Failed to load document versions')
      toast({
        title: 'Error',
        description: 'Failed to load document versions',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [user, toast])

  // Create new version
  const createVersion = useCallback(async (
    docId: string,
    document: SemanticDocument,
    versionType: DocumentVersion['version_type'] = 'autosave',
    snapshotName?: string
  ) => {
    if (!user) return null

    try {
      const { data, error } = await supabase.rpc('create_document_version', {
        p_document_id: docId,
        p_title: document.title,
        p_content: document as any,
        p_version_type: versionType,
        p_snapshot_name: snapshotName
      })

      if (error) throw error

      // Reload versions to get the updated list
      await loadVersions(docId)
      
      return data
    } catch (err) {
      console.error('Error creating version:', err)
      toast({
        title: 'Error',
        description: 'Failed to create document version',
        variant: 'destructive'
      })
      return null
    }
  }, [user, toast, loadVersions])

  // Create named snapshot
  const createSnapshot = useCallback(async (
    docId: string,
    document: SemanticDocument,
    name: string
  ) => {
    return createVersion(docId, document, 'snapshot', name)
  }, [createVersion])

  // Create safety snapshot before revert
  const createSafetySnapshot = useCallback(async (
    docId: string,
    document: SemanticDocument
  ) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ')
    return createVersion(docId, document, 'safety', `Safety backup - ${timestamp}`)
  }, [createVersion])

  // Delete version
  const deleteVersion = useCallback(async (versionId: string) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('document_versions')
        .delete()
        .eq('id', versionId)

      if (error) throw error

      setVersions(prev => prev.filter(v => v.id !== versionId))
      
      toast({
        title: 'Version deleted',
        description: 'Document version has been deleted'
      })
      
      return true
    } catch (err) {
      console.error('Error deleting version:', err)
      toast({
        title: 'Error',
        description: 'Failed to delete document version',
        variant: 'destructive'
      })
      return false
    }
  }, [user, toast])

  // Get version by ID
  const getVersion = useCallback((versionId: string): DocumentVersion | undefined => {
    return versions.find(v => v.id === versionId)
  }, [versions])

  // Load versions when documentId changes
  useEffect(() => {
    if (documentId) {
      loadVersions(documentId)
    }
  }, [documentId, loadVersions])

  return {
    versions,
    loading,
    error,
    loadVersions,
    createVersion,
    createSnapshot,
    createSafetySnapshot,
    deleteVersion,
    getVersion
  }
}