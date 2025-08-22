import { useAuth } from '@/hooks/useAuth'
import { LoginForm } from './LoginForm'
import { useEffect, useState } from 'react'

interface AuthGateProps {
  children: React.ReactNode
}

export const AuthGate = ({ children }: AuthGateProps) => {
  const { user, loading } = useAuth()
  const [debugTimeout, setDebugTimeout] = useState(false)

  useEffect(() => {
    console.log('AuthGate state:', { user: !!user, loading, hasSession: !!user })
    
    // Debug timeout to catch hanging auth states
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('AuthGate: Still loading after 5 seconds, possible hang')
        setDebugTimeout(true)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-muted">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-primary rounded-full"></div>
        </div>
        {debugTimeout && (
          <div className="absolute bottom-4 left-4 bg-destructive text-destructive-foreground p-2 rounded">
            Auth loading timeout - check network/console
          </div>
        )}
      </div>
    )
  }

  if (!user) {
    console.log('AuthGate: No user, showing login form')
    return <LoginForm />
  }

  console.log('AuthGate: User authenticated, showing app')
  return <>{children}</>
}