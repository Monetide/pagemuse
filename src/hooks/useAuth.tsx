import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  magicLinkSignIn: (email: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)

    // Listen for auth changes FIRST to avoid missing the SIGNED_IN event
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, !!session)
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        // Only clear loading when we know the state after possible OAuth exchange
        setLoading(false)
      }
    })

    const completeOAuthIfNeeded = async () => {
      try {
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')
        const error = url.searchParams.get('error')
        const errorDescription = url.searchParams.get('error_description')

        // Check if this is an OAuth callback with actual parameters
        if (code || error) {
          console.log('Detected OAuth redirect parameters:', { hasCode: !!code, hasError: !!error })
          
          if (code) {
            console.log('Exchanging OAuth code for session...')
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href)
            
            if (exchangeError) {
              console.error('OAuth exchange error:', exchangeError)
            } else {
              console.log('OAuth exchange successful:', !!data.session)
            }
          }
          
          if (error) {
            console.error('OAuth error from provider:', error, errorDescription)
          }
          
          // Clean up the URL after processing
          const cleanUrl = url.origin + url.pathname
          window.history.replaceState({}, document.title, cleanUrl)
        }
      } catch (e) {
        console.error('Error completing OAuth:', e)
      }
    }

    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
        }
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        if (mounted) setLoading(false)
      }
    }

    // Run OAuth completion first, then check current session
    completeOAuthIfNeeded().finally(getInitialSession)

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
        emailRedirectTo: `${window.location.origin}/`,
      }
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    return { error }
  }

  const magicLinkSignIn = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    })
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    magicLinkSignIn,
    signInWithGoogle,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}