import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/integrations/supabase/client'

interface ValidationResult {
  okCount: number
  missingModules: string[]
  createdModules: string[]
  badParams: Array<{ index: number; error: string; item: any }>
}

export const SeedValidator = () => {
  const [seedsJson, setSeedsJson] = useState('')
  const [autoCreateMissing, setAutoCreateMissing] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleValidate = async () => {
    if (!seedsJson.trim()) {
      setError('Please paste seed data')
      return
    }

    setIsValidating(true)
    setError(null)
    setValidationResult(null)

    try {
      // Parse JSON to validate format
      let seeds
      try {
        seeds = JSON.parse(seedsJson)
      } catch (parseError) {
        throw new Error('Invalid JSON format')
      }

      const SUPABASE_URL = 'https://dbrzfjekbfkjathotjcj.supabase.co'
      const url = `${SUPABASE_URL}/functions/v1/template-gen-seeds-validate${autoCreateMissing ? '?autoCreateMissing=true' : ''}`
      
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token

      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ seeds })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setValidationResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed')
    } finally {
      setIsValidating(false)
    }
  }

  const exampleSeeds = `[
  {
    "docType": "white-paper",
    "stylePack": "professional", 
    "industry": "finance"
  },
  {
    "docType": "report",
    "stylePack": "editorial",
    "industry": "healthcare"
  }
]`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Seed Validator</CardTitle>
          <CardDescription>
            Validate template generation seeds before processing. Paste a JSON array of parameter sets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="seeds-input" className="text-sm font-medium">
              Seeds JSON
            </label>
            <Textarea
              id="seeds-input"
              placeholder={`Paste your seeds JSON here, e.g.:\n${exampleSeeds}`}
              value={seedsJson}
              onChange={(e) => setSeedsJson(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-create"
              checked={autoCreateMissing}
              onCheckedChange={(checked) => setAutoCreateMissing(checked as boolean)}
            />
            <label htmlFor="auto-create" className="text-sm">
              Auto-create missing registry modules
            </label>
          </div>

          <Button 
            onClick={handleValidate} 
            disabled={isValidating || !seedsJson.trim()}
            className="w-full"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              'Validate Seeds (Dry-run)'
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Validation Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {validationResult.okCount}
                </div>
                <div className="text-sm text-muted-foreground">Valid Seeds</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {validationResult.badParams.length}
                </div>
                <div className="text-sm text-muted-foreground">Bad Params</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {validationResult.missingModules.length}
                </div>
                <div className="text-sm text-muted-foreground">Missing Modules</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {validationResult.createdModules.length}
                </div>
                <div className="text-sm text-muted-foreground">Created Modules</div>
              </div>
            </div>

            {validationResult.createdModules.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Created Modules:</h4>
                <div className="flex flex-wrap gap-2">
                  {validationResult.createdModules.map((module) => (
                    <Badge key={module} variant="secondary" className="text-xs">
                      {module}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {validationResult.missingModules.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  Missing Modules:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {validationResult.missingModules.map((module) => (
                    <Badge key={module} variant="destructive" className="text-xs">
                      {module}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {validationResult.badParams.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Bad Parameters:
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {validationResult.badParams.map((param, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertDescription className="text-xs">
                        <strong>Index {param.index}:</strong> {param.error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}