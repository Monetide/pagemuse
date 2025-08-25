import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, AlertTriangle, Upload, Wand2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/integrations/supabase/client'
import { useParams } from 'react-router-dom'

interface ValidationResult {
  okCount: number
  missingModules: string[]
  createdModules: string[]
  badParams: Array<{ index: number; error: string; item: any }>
}

interface TemplateSeed {
  id: string
  doc_type: string
  style_pack: string
  industry: string
  status: string
  created_at: string
  updated_at: string
}

interface ComposeResult {
  success: boolean
  templatesCreated: number
  templates: Array<{
    seedId: string
    templateId: string
    name: string
  }>
}

export const SeedValidator = () => {
  const { workspaceId } = useParams()
  const [seedsJson, setSeedsJson] = useState('')
  const [autoCreateMissing, setAutoCreateMissing] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  const [isIngesting, setIsIngesting] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [composeResult, setComposeResult] = useState<ComposeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [seeds, setSeeds] = useState<TemplateSeed[]>([])
  const [isLoadingSeeds, setIsLoadingSeeds] = useState(false)

  // Load existing seeds
  const loadSeeds = async () => {
    if (!workspaceId) return
    
    setIsLoadingSeeds(true)
    try {
      const { data, error } = await supabase
        .from('template_seeds')
        .select('id, doc_type, style_pack, industry, status, created_at, updated_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSeeds(data || [])
    } catch (err) {
      console.error('Error loading seeds:', err)
      setError('Failed to load seeds')
    } finally {
      setIsLoadingSeeds(false)
    }
  }

  useEffect(() => {
    loadSeeds()
  }, [workspaceId])

  const handleCompose = async () => {
    if (!workspaceId) {
      setError('Workspace not loaded')
      return
    }

    const readySeeds = seeds.filter(seed => seed.status === 'ready')
    if (readySeeds.length === 0) {
      setError('No ready seeds to compose')
      return
    }

    setIsComposing(true)
    setError(null)
    setComposeResult(null)

    try {
      const SUPABASE_URL = 'https://dbrzfjekbfkjathotjcj.supabase.co'
      const url = `${SUPABASE_URL}/functions/v1/template-gen-seeds-compose`
      
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
        body: JSON.stringify({ workspaceId })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Compose result:', result)
      
      setComposeResult(result)
      
      // Reload seeds to show updated statuses
      await loadSeeds()
      
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Composition failed')
    } finally {
      setIsComposing(false)
    }
  }

  const handleIngest = async () => {
    if (!seedsJson.trim() || !workspaceId) {
      setError('Please paste seed data and ensure workspace is loaded')
      return
    }

    setIsIngesting(true)
    setError(null)

    try {
      // Parse JSON to validate format
      let seeds
      try {
        seeds = JSON.parse(seedsJson)
      } catch (parseError) {
        throw new Error('Invalid JSON format')
      }

      const SUPABASE_URL = 'https://dbrzfjekbfkjathotjcj.supabase.co'
      const url = `${SUPABASE_URL}/functions/v1/template-gen-seeds-ingest`
      
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
        body: JSON.stringify({ seeds, workspaceId })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Ingest result:', result)
      
      // Reload seeds to show the new ones
      await loadSeeds()
      
      // Clear the input
      setSeedsJson('')
      
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ingestion failed')
    } finally {
      setIsIngesting(false)
    }
  }

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

          <div className="flex gap-2">
            <Button 
              onClick={handleValidate} 
              disabled={isValidating || !seedsJson.trim()}
              variant="outline"
              className="flex-1"
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
            
            <Button 
              onClick={handleIngest} 
              disabled={isIngesting || !seedsJson.trim()}
              className="flex-1"
            >
              {isIngesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ingesting...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Ingest Seeds
                </>
              )}
            </Button>
          </div>
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

      {composeResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Composition Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {composeResult.templatesCreated}
                </div>
                <div className="text-sm text-muted-foreground">Templates Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {composeResult.templates?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Draft Templates</div>
              </div>
            </div>

            {composeResult.templates && composeResult.templates.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Created Templates:</h4>
                <div className="space-y-1">
                  {composeResult.templates.map((template) => (
                    <div key={template.templateId} className="text-xs bg-muted p-2 rounded">
                      <strong>{template.name}</strong> (from seed: {template.seedId})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Ingested Seeds
            <Button 
              onClick={handleCompose} 
              disabled={isComposing || seeds.filter(s => s.status === 'ready').length === 0}
              variant="default"
              size="sm"
            >
              {isComposing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Composing...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Compose all Ready ({seeds.filter(s => s.status === 'ready').length})
                </>
              )}
            </Button>
          </CardTitle>
          <CardDescription>
            Template parameter sets that have been ingested and stored in the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSeeds ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading seeds...</span>
            </div>
          ) : seeds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No seeds have been ingested yet. Use the form above to ingest seeds.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Doc Type</TableHead>
                    <TableHead>Style Pack</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seeds.map((seed) => (
                    <TableRow key={seed.id}>
                      <TableCell className="font-mono text-sm">{seed.id}</TableCell>
                      <TableCell>{seed.doc_type}</TableCell>
                      <TableCell>{seed.style_pack}</TableCell>
                      <TableCell>{seed.industry}</TableCell>
                      <TableCell>
                        <Badge variant={
                          seed.status === 'ready' ? 'default' : 
                          seed.status === 'composed' ? 'secondary' : 
                          'outline'
                        }>
                          {seed.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(seed.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}