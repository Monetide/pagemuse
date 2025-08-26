import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'

export const AuthCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('AuthCallback: Processing OAuth callback...')
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        
        if (error) {
          console.error('AuthCallback: OAuth exchange error:', error)
          navigate('/auth-debug?error=' + encodeURIComponent(error.message))
          return
        }

        if (data.session) {
          console.log('AuthCallback: OAuth exchange successful, redirecting to app')
          
          // Broadcast success for iframe scenarios (Lovable preview)
          try {
            window.postMessage({ type: 'AUTH_SUCCESS', session: data.session }, window.location.origin)
          } catch (e) {
            console.log('Could not broadcast auth success:', e)
          }
          
          navigate('/', { replace: true })
        } else {
          console.warn('AuthCallback: No session received')
          navigate('/auth-debug?error=no_session')
        }
      } catch (e) {
        console.error('AuthCallback: Unexpected error:', e)
        navigate('/auth-debug?error=' + encodeURIComponent(String(e)))
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-muted">
      <div className="text-center space-y-4">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-primary rounded-full mx-auto"></div>
        </div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}