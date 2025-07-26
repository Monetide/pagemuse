import { useAuth } from '@/hooks/useAuth'
import { LoginForm } from './LoginForm'

interface AuthGateProps {
  children: React.ReactNode
}

export const AuthGate = ({ children }: AuthGateProps) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-muted">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-primary rounded-full"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <>{children}</>
}