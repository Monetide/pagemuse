import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, XCircle, AlertCircle, Copy, Trash2, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

interface ValidationResult {
  okCount: number
  missingModules: string[]
  badParams: { id: string; messages: string[] }[]
  createdModules?: string[]
}

interface SeedItem {
  id: string
  status: 'valid' | 'invalid' | 'missing-modules'
  messages: string[]
}

interface ComposeResult {
  success: boolean
  createdCount: number
  results: any[]
}

export const SeedValidator = () => {
  const [seedsJson, setSeedsJson] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [isIngesting, setIsIngesting] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [composeResult, setComposeResult] = useState<ComposeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ingestedSeedIds, setIngestedSeedIds] = useState<string[]>([])
  const { session } = useAuth()

  useEffect(() => {
    // Load persisted JSON from localStorage
    const saved = localStorage.getItem('admin-seeds-json')
    if (saved) {
      setSeedsJson(saved)
    }
  }, [])

  const persistJson = (json: string) => {
    localStorage.setItem('admin-seeds-json', json)
  }

  const normalizePayload = (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText)
      
      // If it's an array, wrap in envelope
      if (Array.isArray(parsed)) {
        return { seeds: parsed }
      }
      
      // If it's already an envelope with seeds property, use as-is
      if (parsed.seeds && Array.isArray(parsed.seeds)) {
        return parsed
      }
      
      throw new Error('Invalid format: expected array of seeds or {seeds: [...]} envelope')
    } catch (err) {
      throw new Error(`JSON parse error: ${err.message}`)
    }
  }

  const handleValidate = async () => {
    if (!seedsJson.trim() || !session) return
    
    setIsValidating(true)
    setError(null)
    setValidationResult(null)
    
    try {
      const payload = normalizePayload(seedsJson)
      
      const { data, error: fnError } = await supabase.functions.invoke(
        'template-gen-seeds-validate',
        {
          body: payload,
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )
      
      if (fnError) {
        throw new Error(fnError.message)
      }
      
      setValidationResult(data)
      toast({ 
        title: `Validation complete: ${data.okCount} valid seeds`,
        description: data.missingModules?.length > 0 ? `${data.missingModules.length} missing modules` : undefined
      })
      
    } catch (err) {
      setError(err.message)
      toast({ title: 'Validation failed', description: err.message, variant: 'destructive' })
    } finally {
      setIsValidating(false)
    }
  }

  const handleIngest = async () => {
    if (!seedsJson.trim() || !session) return
    
    setIsIngesting(true)
    setError(null)
    
    try {
      const payload = normalizePayload(seedsJson)
      
      const { data, error: fnError } = await supabase.functions.invoke(
        'system-template-gen-seeds-ingest',
        {
          body: payload,
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )
      
      if (fnError) {
        throw new Error(fnError.message)
      }
      
      const seedIds = payload.seeds.map((seed: any) => seed.id)
      setIngestedSeedIds(seedIds)
      
      toast({ 
        title: `Ingested ${data.successCount || payload.seeds.length} global seeds`,
        description: 'Seeds are ready for composition'
      })
      
    } catch (err) {
      setError(err.message)
      toast({ title: 'Ingestion failed', description: err.message, variant: 'destructive' })
    } finally {
      setIsIngesting(false)
    }
  }

  const handleCompose = async () => {
    if (ingestedSeedIds.length === 0 || !session) return
    
    setIsComposing(true)
    setError(null)
    setComposeResult(null)
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'system-template-gen-seeds-compose',
        {
          body: { seedIds: ingestedSeedIds },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )
      
      if (fnError) {
        throw new Error(fnError.message)
      }
      
      setComposeResult(data)
      toast({ 
        title: `Composed ${data.successCount || 0} global templates`,
        description: data.successCount > 0 ? 'Check /system/templates for new drafts' : undefined
      })
      
      // Clear ingested seed IDs after successful composition
      setIngestedSeedIds([])
      
    } catch (err) {
      setError(err.message)
      toast({ title: 'Composition failed', description: err.message, variant: 'destructive' })
    } finally {
      setIsComposing(false)
    }
  }

  const handleClear = () => {
    setSeedsJson('')
    setValidationResult(null)
    setComposeResult(null)
    setError(null)
    setIngestedSeedIds([])
    localStorage.removeItem('admin-seeds-json')
  }

  const getSeedStatus = (seedId: string): SeedItem => {
    if (!validationResult) return { id: seedId, status: 'valid', messages: [] }
    
    const badParam = validationResult.badParams?.find(bp => bp.id === seedId)
    if (badParam) {
      return { id: seedId, status: 'invalid', messages: badParam.messages }
    }
    
    return { id: seedId, status: 'valid', messages: [] }
  }

  const getSeedIds = (): string[] => {
    try {
      const payload = normalizePayload(seedsJson)
      return payload.seeds.map((seed: any) => seed.id).filter(Boolean)
    } catch {
      return []
    }
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            JSON Import
          </CardTitle>
          <CardDescription>
            Paste seed JSON (array or envelope format) to validate, ingest, and compose global templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              placeholder="Paste seed JSON here..."
              value={seedsJson}
              onChange={(e) => {
                setSeedsJson(e.target.value)
                persistJson(e.target.value)
              }}
              className="min-h-[300px] font-mono text-sm"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleValidate}
              disabled={!seedsJson.trim() || isValidating}
              variant="outline"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Validate (Dry-run)
            </Button>
            
            <Button
              onClick={handleIngest}
              disabled={!seedsJson.trim() || isIngesting}
            >
              {isIngesting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-2" />
              )}
              Ingest (Global)
            </Button>
            
            <Button
              onClick={handleCompose}
              disabled={ingestedSeedIds.length === 0 || isComposing}
              variant="secondary"
            >
              {isComposing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Compose now
            </Button>
            
            <Button
              onClick={handleClear}
              variant="ghost"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2 text-destructive">
              <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {(validationResult || composeResult || ingestedSeedIds.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Validation Results */}
            {validationResult && (
              <div>
                <h4 className="font-medium mb-2">Validation Summary</h4>
                <div className="flex gap-4 mb-3">
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    {validationResult.okCount} Valid
                  </Badge>
                  {validationResult.missingModules?.length > 0 && (
                    <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                      {validationResult.missingModules.length} Missing Modules
                    </Badge>
                  )}
                  {validationResult.badParams?.length > 0 && (
                    <Badge variant="outline" className="text-red-700 border-red-300">
                      {validationResult.badParams.length} Invalid
                    </Badge>
                  )}
                </div>
                
                {/* Missing Modules */}
                {validationResult.missingModules?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-yellow-700 mb-1">Missing Modules:</p>
                    <p className="text-sm text-muted-foreground">
                      {validationResult.missingModules.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Per-Seed Status */}
            {getSeedIds().length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Seed Status</h4>
                <div className="space-y-2">
                  {getSeedIds().map(seedId => {
                    const seed = getSeedStatus(seedId)
                    return (
                      <div key={seedId} className="flex items-start gap-2 p-2 bg-muted/30 rounded">
                        {seed.status === 'valid' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono">{seedId}</p>
                          {seed.messages.length > 0 && (
                            <p className="text-xs text-red-600 mt-1">
                              {seed.messages.join(', ')}
                            </p>
                          )}
                        </div>
                        <Badge variant={seed.status === 'valid' ? 'default' : 'destructive'} className="text-xs">
                          {seed.status}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            {/* Ingested Seeds */}
            {ingestedSeedIds.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Ready for Composition</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {ingestedSeedIds.length} seeds ingested and ready
                </p>
                <div className="flex flex-wrap gap-1">
                  {ingestedSeedIds.map(seedId => (
                    <Badge key={seedId} variant="secondary" className="text-xs">
                      {seedId}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Composition Results */}
            {composeResult && (
              <div>
                <h4 className="font-medium mb-2">Composition Results</h4>
                <Badge variant="outline" className="text-green-700 border-green-300 mb-2">
                  {composeResult.createdCount || 0} Templates Created
                </Badge>
                {composeResult.createdCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Check <span className="font-mono">/system/templates</span> for new draft templates with preview PNGs and SVG assets.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}