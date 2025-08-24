import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { SemanticDocument } from '@/lib/document-model'
import { useToast } from '@/hooks/use-toast'
import { useDocumentVersions } from '@/hooks/useDocumentVersions'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface DocumentMetadata {
  title: string
  owner: string
  created_at: string
  updated_at: string
  tags: string[]
}

export const useDocumentPersistence = () => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null)
  const [documentMetadata, setDocumentMetadata] = useState<DocumentMetadata | null>(null)
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspaceContext()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { createVersion, createSafetySnapshot } = useDocumentVersions(currentDocumentId || undefined)

  // Auto-save with debouncing
  const saveDocument = useCallback(async (document: SemanticDocument) => {
    if (!user || !document || !currentWorkspace) return null

    setSaveStatus('saving')
    
    try {
      const documentData = {
        title: document.title,
        content: document as any, // Store as JSON
        user_id: user.id,
        workspace_id: currentWorkspace.id,
        updated_at: new Date().toISOString()
      }

      let result
      if (currentDocumentId) {
        // Update existing document
        const { data, error } = await supabase
          .from('documents')
          .update(documentData)
          .eq('id', currentDocumentId)
          .select()
          .single()
        
        if (error) throw error
        result = data
      } else {
        // Create new document
        const { data, error } = await supabase
          .from('documents')
          .insert(documentData)
          .select()
          .single()
        
        if (error) throw error
        result = data
        setCurrentDocumentId(result.id)
      }

      setSaveStatus('saved')
      
      // Create version after successful save
      if (result.id) {
        await createVersion(result.id, document, 'autosave')
      }
      
      // Update metadata
      setDocumentMetadata({
        title: result.title,
        owner: user.email || user.id,
        created_at: result.created_at,
        updated_at: result.updated_at,
        tags: [] // TODO: Implement tags functionality
      })

      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000)
      
      return result.id
    } catch (error) {
      console.error('Error saving document:', error)
      setSaveStatus('error')
      toast({
        title: 'Save failed',
        description: 'Could not save document. Please try again.',
        variant: 'destructive'
      })
      setTimeout(() => setSaveStatus('idle'), 3000)
      return null
    }
  }, [user, currentWorkspace, currentDocumentId, toast, createVersion])

  // Load document
  const loadDocument = useCallback(async (documentId: string) => {
    console.log('Persistence: Loading document with ID:', documentId)
    if (!user) {
      console.log('Persistence: No user, returning null')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      console.log('Persistence: Document loaded successfully:', data)
      setCurrentDocumentId(documentId)
      setDocumentMetadata({
        title: data.title,
        owner: user.email || user.id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        tags: []
      })

      return data.content as unknown as SemanticDocument
    } catch (error) {
      console.error('Error loading document:', error)
      toast({
        title: 'Load failed',
        description: 'Could not load document.',
        variant: 'destructive'
      })
      return null
    }
  }, [user, toast])

  // Save As (duplicate document)
  const saveAs = useCallback(async (document: SemanticDocument, newTitle: string) => {
    if (!user || !document || !currentWorkspace) return null

    setSaveStatus('saving')

    try {
      const documentData = {
        title: newTitle,
        content: { ...document, title: newTitle, id: crypto.randomUUID() } as any, // Store as JSON
        user_id: user.id,
        workspace_id: currentWorkspace.id,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single()

      if (error) throw error

      setSaveStatus('saved')
      toast({
        title: 'Document duplicated',
        description: `"${newTitle}" has been created successfully.`
      })

      setTimeout(() => setSaveStatus('idle'), 2000)
      return data.id
    } catch (error) {
      console.error('Error duplicating document:', error)
      setSaveStatus('error')
      toast({
        title: 'Duplication failed',
        description: 'Could not create document copy.',
        variant: 'destructive'
      })
      return null
    }
  }, [user, currentWorkspace, toast])

  // Rename document
  const renameDocument = useCallback(async (newTitle: string) => {
    if (!user || !currentDocumentId) return false

    try {
      const { error } = await supabase
        .from('documents')
        .update({ 
          title: newTitle,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentDocumentId)
        .eq('user_id', user.id)

      if (error) throw error

      setDocumentMetadata(prev => prev ? {
        ...prev,
        title: newTitle,
        updated_at: new Date().toISOString()
      } : null)

      toast({
        title: 'Document renamed',
        description: `Document renamed to "${newTitle}"`
      })

      return true
    } catch (error) {
      console.error('Error renaming document:', error)
      toast({
        title: 'Rename failed',
        description: 'Could not rename document.',
        variant: 'destructive'
      })
      return false
    }
  }, [user, currentDocumentId, toast])

  // Delete document
  const deleteDocument = useCallback(async (documentId?: string) => {
    if (!user) return false
    
    const docId = documentId || currentDocumentId
    if (!docId) return false

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)
        .eq('user_id', user.id)

      if (error) throw error

      if (docId === currentDocumentId) {
        setCurrentDocumentId(null)
        setDocumentMetadata(null)
      }

      toast({
        title: 'Document deleted',
        description: 'Document has been permanently deleted.'
      })

      return true
    } catch (error) {
      console.error('Error deleting document:', error)
      toast({
        title: 'Delete failed',
        description: 'Could not delete document.',
        variant: 'destructive'
      })
      return false
    }
  }, [user, currentDocumentId, toast])

  // Close document and return to library
  const closeDocument = useCallback(() => {
    setCurrentDocumentId(null)
    setDocumentMetadata(null)
    setSaveStatus('idle')
    navigate('/my-documents')
  }, [navigate])

  // Create new document
  const createNewDocument = useCallback(() => {
    setCurrentDocumentId(null)
    setDocumentMetadata(null)
    setSaveStatus('idle')
  }, [])

  return {
    saveStatus,
    currentDocumentId,
    documentMetadata,
    saveDocument,
    loadDocument,
    saveAs,
    renameDocument,
    deleteDocument,
    closeDocument,
    createNewDocument
  }
}