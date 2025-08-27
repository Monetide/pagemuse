import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface WorkspaceAdminGuardProps {
  children: React.ReactNode
}

export const WorkspaceAdminGuard = ({ children }: WorkspaceAdminGuardProps) => {
  const { currentWorkspace } = useWorkspaceContext()
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user?.id || !currentWorkspace?.id) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('workspace_members')
          .select('role')
          .eq('workspace_id', currentWorkspace.id)
          .eq('user_id', user.id)
          .single()

        if (error) {
          console.error('Error checking workspace admin role:', error)
          setIsAdmin(false)
        } else {
          setIsAdmin(data?.role === 'owner' || data?.role === 'admin')
        }
      } catch (error) {
        console.error('Error checking workspace admin role:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminRole()
  }, [user?.id, currentWorkspace?.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-muted">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-primary rounded-full"></div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to={`/w/${currentWorkspace?.id}`} replace />
  }

  return <>{children}</>
}