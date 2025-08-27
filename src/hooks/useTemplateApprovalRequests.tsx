import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

export interface TemplateApprovalRequest {
  id: string
  workspace_id: string
  document_id: string
  requested_by: string
  proposed_name: string
  proposed_category?: string | null
  proposed_slug?: string | null
  packaged_snapshot: any
  status: string
  reviewed_by?: string | null
  reviewed_at?: string | null
  response_message?: string | null
  created_at: string
  updated_at: string
}

export function useTemplateApprovalRequests() {
  const [requests, setRequests] = useState<TemplateApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { currentWorkspace } = useWorkspaceContext()
  const { user } = useAuth()
  const { toast } = useToast()

  const fetchRequests = async () => {
    if (!currentWorkspace?.id || !user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('template_approval_requests')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setRequests(data || [])
    } catch (err) {
      console.error('Error fetching approval requests:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch requests')
    } finally {
      setLoading(false)
    }
  }

  const createApprovalRequest = async (
    documentId: string,
    proposedName: string,
    proposedCategory: string,
    packagedSnapshot: any
  ) => {
    if (!currentWorkspace?.id || !user) {
      throw new Error('No workspace or user available')
    }

    try {
      const { data, error } = await supabase
        .from('template_approval_requests')
        .insert({
          workspace_id: currentWorkspace.id,
          document_id: documentId,
          requested_by: user.id,
          proposed_name: proposedName,
          proposed_category: proposedCategory,
          packaged_snapshot: packagedSnapshot
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Template Approval Requested",
        description: "Your template has been submitted for approval by workspace admins.",
      })

      await fetchRequests() // Refresh the list
      return data
    } catch (err) {
      console.error('Error creating approval request:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create approval request'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  const approveRequest = async (requestId: string, responseMessage?: string) => {
    if (!user) {
      throw new Error('No user available')
    }

    try {
      // Update the request status
      const { error: updateError } = await supabase
        .from('template_approval_requests')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          response_message: responseMessage
        })
        .eq('id', requestId)

      if (updateError) throw updateError

      // Get the request to create the template
      const { data: request, error: fetchError } = await supabase
        .from('template_approval_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (fetchError) throw fetchError

      // Create the workspace template
      const { error: templateError } = await supabase
        .from('templates')
        .insert({
          name: request.proposed_name,
          category: request.proposed_category || 'General',
          scope: 'workspace',
          workspace_id: currentWorkspace?.id,
          user_id: request.requested_by,
          tpkg_source: request.packaged_snapshot,
          status: 'published'
        })

      if (templateError) throw templateError

      toast({
        title: "Template Approved",
        description: `Template "${request.proposed_name}" has been approved and published.`,
      })

      await fetchRequests() // Refresh the list
    } catch (err) {
      console.error('Error approving request:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve request'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  const rejectRequest = async (requestId: string, responseMessage?: string) => {
    if (!user) {
      throw new Error('No user available')
    }

    try {
      const { error } = await supabase
        .from('template_approval_requests')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          response_message: responseMessage
        })
        .eq('id', requestId)

      if (error) throw error

      toast({
        title: "Template Rejected",
        description: "The template approval request has been rejected.",
      })

      await fetchRequests() // Refresh the list
    } catch (err) {
      console.error('Error rejecting request:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject request'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [currentWorkspace?.id, user])

  return {
    requests,
    loading,
    error,
    createApprovalRequest,
    approveRequest,
    rejectRequest,
    refetch: fetchRequests
  }
}