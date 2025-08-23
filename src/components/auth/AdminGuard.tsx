import { useAdminRole } from '@/hooks/useAdminRole'
import { Navigate } from 'react-router-dom'

interface AdminGuardProps {
  children: React.ReactNode
}

export const AdminGuard = ({ children }: AdminGuardProps) => {
  const { isAdmin, loading } = useAdminRole()

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
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}