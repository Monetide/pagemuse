import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ExternalLink, AlertTriangle } from 'lucide-react'

const SUPABASE_PROJECT_ID = 'dbrzfjekbfkjathotjcj'
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`
const SUPABASE_CALLBACK = `${SUPABASE_URL}/auth/v1/callback`

const Row = ({ label, value, copy }: { label: string; value: string; copy?: boolean }) => (
  <div className="flex items-center justify-between py-2">
    <div className="text-sm text-muted-foreground">{label}</div>
    <div className="flex items-center gap-2">
      <code className="text-xs break-all">{value}</code>
      {copy && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigator.clipboard.writeText(value)}
        >
          Copy
        </Button>
      )}
    </div>
  </div>
)

function parseProviderUrl(providerUrl?: string | null) {
  if (!providerUrl) return null
  try {
    const u = new URL(providerUrl)
    const params = u.searchParams
    return {
      url: providerUrl,
      origin: u.origin,
      path: u.pathname,
      client_id: params.get('client_id') ?? '',
      redirect_uri: params.get('redirect_uri') ?? '',
      scope: params.get('scope') ?? '',
      response_type: params.get('response_type') ?? '',
      state: params.get('state') ?? '',
    }
  } catch (e) {
    return { url: providerUrl } as any
  }
}

function parseOAuthError(errorUrl?: string) {
  if (!errorUrl) return null
  try {
    const u = new URL(errorUrl)
    const authError = u.searchParams.get('authError')
    const clientId = u.searchParams.get('client_id')
    const flowName = u.searchParams.get('flowName')
    
    if (authError) {
      // Decode the authError parameter (it's base64 encoded)
      try {
        const decoded = atob(authError)
        return {
          rawError: authError,
          decoded,
          clientId,
          flowName,
          isRedirectMismatch: decoded.includes('redirect_uri_mismatch'),
          extractedRedirectUri: decoded.match(/redirect_uri[:\s]*([^\s"]+)/)?.[1]
        }
      } catch {
        return { rawError: authError, clientId, flowName }
      }
    }
    return null
  } catch {
    return null
  }
}

function detectIframe() {
  try {
    return window.self !== window.top
  } catch {
    return true // If we can't check, assume we're in an iframe
  }
}

const AuthDebug = () => {
  const [providerUrl, setProviderUrl] = useState<string | null>(null)
  const parsed = useMemo(() => parseProviderUrl(providerUrl), [providerUrl])
  const isInIframe = useMemo(() => detectIframe(), [])
  const currentUrlError = useMemo(() => parseOAuthError(window.location.href), [])

  useEffect(() => {
    document.title = 'Auth Debug – Google OAuth diagnostics'
    const link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null
    const canonical = link ?? document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    canonical.setAttribute('href', window.location.origin + '/auth-debug')
    if (!link) document.head.appendChild(canonical)
  }, [])

  const testRedirectTo = `${window.location.origin}/auth/callback`

  const previewGoogleUrl = async () => {
    setProviderUrl(null)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: testRedirectTo,
        skipBrowserRedirect: true,
      } as any,
    })
    if (error) {
      console.error('Preview error', error)
      alert(`Error: ${error.message}`)
      return
    }
    setProviderUrl(data?.url ?? null)
  }

  const startGoogleLogin = async () => {
    console.log('Starting Google login...', { testRedirectTo, isInIframe })
    
    if (isInIframe) {
      // In iframe, open in new tab
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: testRedirectTo,
          skipBrowserRedirect: true 
        }
      })
      if (error) {
        console.error('Google OAuth error:', error)
        alert(`Error: ${error.message}`)
        return
      }
      if (data?.url) {
        window.open(data.url, '_blank')
      }
    } else {
      // Not in iframe, proceed normally
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: testRedirectTo }
      })
      if (error) {
        console.error('Google OAuth error:', error)
        alert(`Error: ${error.message}`)
      }
    }
  }

  return (
    <main className="container mx-auto max-w-3xl py-10">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Auth Debug – Google OAuth</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentUrlError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>OAuth Error Detected:</strong> 
{currentUrlError.isRedirectMismatch ? (
                  <>
                    <br />Redirect URI mismatch. Expected callback: {currentUrlError.extractedRedirectUri}
                    <br />Make sure this URL is added to your Google Cloud Console "Authorized redirect URIs"
                  </>
                ) : (
                  <>
                    <br />Check console for details
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {isInIframe && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Running in iframe - Google login will open in new tab
              </AlertDescription>
            </Alert>
          )}

          <section>
            <h2 className="text-sm font-medium mb-2">Environment</h2>
            <Row label="Current origin" value={window.location.origin} copy />
            <Row label="Current path" value={window.location.pathname + window.location.search} />
            <Row label="Supabase URL" value={SUPABASE_URL} copy />
            <Row label="Supabase callback (Google)" value={SUPABASE_CALLBACK} copy />
            <Row label="Redirect-to we will use" value={testRedirectTo} copy />
            <Row label="In iframe" value={isInIframe ? 'Yes' : 'No'} />
          </section>

          <section className="space-y-3">
            <div className="flex gap-3">
              <Button onClick={previewGoogleUrl} variant="secondary">Preview Google URL (no redirect)</Button>
              <Button onClick={startGoogleLogin}>
                Start Google Login {isInIframe && <ExternalLink className="ml-1 h-3 w-3" />}
              </Button>
            </div>
            {parsed && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Previewed Provider URL</h3>
                  {isInIframe && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => window.open(parsed.url, '_blank')}
                    >
                      Open in new tab <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Row label="URL" value={parsed.url} copy />
                {'origin' in parsed && <Row label="Origin" value={(parsed as any).origin} />}
                {'path' in parsed && <Row label="Path" value={(parsed as any).path} />}
                {'client_id' in parsed && <Row label="client_id" value={(parsed as any).client_id} />}
                {'redirect_uri' in parsed && <Row label="redirect_uri" value={(parsed as any).redirect_uri} copy />}
                {'response_type' in parsed && <Row label="response_type" value={(parsed as any).response_type} />}
                {'scope' in parsed && <Row label="scope" value={(parsed as any).scope} />}
                {'state' in parsed && <Row label="state" value={(parsed as any).state} />}
              </div>
            )}
          </section>

          <section className="text-sm text-muted-foreground">
            <p>Tips:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Google Cloud: put the Supabase callback URL above in Authorized redirect URIs.</li>
              <li>Google Cloud: put your site origins (e.g. this page's origin) in Authorized JavaScript origins.</li>
              <li>Supabase Auth settings: ensure Site URL is your deployed/staging URL(s).</li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </main>
  )
}

export default AuthDebug
