import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'

export const HealthCheck = () => {
  const { user, session, loading } = useAuth()
  const [show, setShow] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setShow(params.has('debug'))
  }, [])

  if (!show) return null

  return (
    <div className="fixed top-4 right-4 z-50 bg-background border rounded-lg p-4 shadow-lg max-w-sm">
      <h3 className="font-semibold mb-2">Health Check</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Auth Loading:</span>
          <Badge variant={loading ? "destructive" : "default"}>
            {loading ? "YES" : "NO"}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span>User:</span>
          <Badge variant={user ? "default" : "secondary"}>
            {user ? "AUTHENTICATED" : "NONE"}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span>Session:</span>
          <Badge variant={session ? "default" : "secondary"}>
            {session ? "ACTIVE" : "NONE"}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span>Route:</span>
          <span className="text-xs">{window.location.pathname}</span>
        </div>
      </div>
    </div>
  )
}