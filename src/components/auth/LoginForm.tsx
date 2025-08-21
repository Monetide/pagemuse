import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Palette } from 'lucide-react'

export const LoginForm = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, resetPassword } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let result
      if (isForgotPassword) {
        result = await resetPassword(email)
      } else if (isSignUp) {
        result = await signUp(email, password, displayName)
      } else {
        result = await signIn(email, password)
      }

      const { error } = result

      if (error) {
        toast({
          title: 'Authentication Error',
          description: error.message,
          variant: 'destructive',
        })
      } else if (isForgotPassword) {
        toast({
          title: 'Reset Email Sent',
          description: 'Please check your email for password reset instructions.',
        })
        setIsForgotPassword(false)
      } else if (isSignUp) {
        toast({
          title: 'Account Created',
          description: 'Please check your email to verify your account.',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-muted p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and branding */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Palette className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              PageMuse
            </h1>
          </div>
          <p className="text-muted-foreground">
            Professional document design made simple
          </p>
        </div>

        <Card className="border-0 shadow-medium">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">
              {isForgotPassword ? 'Reset password' : (isSignUp ? 'Create account' : 'Welcome back')}
            </CardTitle>
            <CardDescription>
              {isForgotPassword 
                ? 'Enter your email address to receive reset instructions'
                : (isSignUp 
                  ? 'Enter your details to create your PageMuse account'
                  : 'Enter your credentials to access your workspace'
                )
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && !isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="transition-all duration-200 focus:shadow-glow"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="gevaperry@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="transition-all duration-200 focus:shadow-glow"
                />
              </div>
              
              {!isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="transition-all duration-200 focus:shadow-glow"
                  />
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isForgotPassword ? 'Sending reset email...' : (isSignUp ? 'Creating account...' : 'Signing in...')}
                  </>
                ) : (
                  isForgotPassword ? 'Send reset email' : (isSignUp ? 'Create account' : 'Sign in')
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              {!isForgotPassword && (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
              
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setIsForgotPassword(false)
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"
                  }
                </button>
              </div>
              
              {isForgotPassword && (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Back to sign in
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}