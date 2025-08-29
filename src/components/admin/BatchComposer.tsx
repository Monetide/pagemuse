import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/use-toast'
import { 
  Grid3X3, 
  Play, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Eye,
  Globe,
  Sparkles
} from 'lucide-react'

interface BatchSelection {
  docType: string
  vibe: string
  industry: string
  stylePack: string
}

interface BatchProgress {
  id: string
  combination: BatchSelection
  status: 'pending' | 'ingesting' | 'composing' | 'completed' | 'error'
  templateId?: string
  error?: string
}

const DOC_TYPES = [
  { id: 'report', label: 'Report' },
  { id: 'ebook', label: 'E-book' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'white-paper', label: 'White Paper' },
  { id: 'case-study', label: 'Case Study' },
  { id: 'annual-report', label: 'Annual Report' }
]

const VIBES = [
  { id: 'modern', label: 'Modern', stylePack: 'professional' },
  { id: 'classic', label: 'Classic', stylePack: 'professional-serif' },
  { id: 'editorial', label: 'Editorial', stylePack: 'editorial' },
  { id: 'minimal', label: 'Minimal', stylePack: 'minimal' },
  { id: 'bold', label: 'Bold', stylePack: 'bold' },
  { id: 'technical', label: 'Technical', stylePack: 'technical' }
]

const INDUSTRIES = [
  { id: 'tech-saas', label: 'Tech & SaaS' },
  { id: 'finance', label: 'Finance' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'real-estate', label: 'Real Estate' },
  { id: 'consumer-goods', label: 'Consumer Goods' },
  { id: 'public-sector', label: 'Public Sector' }
]

export function BatchComposer() {
  const [selectedCombinations, setSelectedCombinations] = useState<BatchSelection[]>([])
  const [isComposing, setIsComposing] = useState(false)
  const [batchProgress, setBatchProgress] = useState<BatchProgress[]>([])
  const [showProgress, setShowProgress] = useState(false)
  const { session } = useAuth()

  // Generate all possible combinations
  const allCombinations = useMemo(() => {
    const combinations: BatchSelection[] = []
    DOC_TYPES.forEach(docType => {
      VIBES.forEach(vibe => {
        INDUSTRIES.forEach(industry => {
          combinations.push({
            docType: docType.id,
            vibe: vibe.id,
            industry: industry.id,
            stylePack: vibe.stylePack
          })
        })
      })
    })
    return combinations
  }, [])

  const toggleCombination = (combination: BatchSelection) => {
    const combinationKey = `${combination.docType}-${combination.vibe}-${combination.industry}`
    const isSelected = selectedCombinations.some(c => 
      `${c.docType}-${c.vibe}-${c.industry}` === combinationKey
    )
    
    if (isSelected) {
      setSelectedCombinations(prev => 
        prev.filter(c => `${c.docType}-${c.vibe}-${c.industry}` !== combinationKey)
      )
    } else {
      setSelectedCombinations(prev => [...prev, combination])
    }
  }

  const isSelected = (combination: BatchSelection) => {
    const combinationKey = `${combination.docType}-${combination.vibe}-${combination.industry}`
    return selectedCombinations.some(c => 
      `${c.docType}-${c.vibe}-${c.industry}` === combinationKey
    )
  }

  const buildSeed = (combination: BatchSelection) => {
    const templateId = `${combination.docType}.${combination.stylePack}.${combination.industry}.v1`
    
    return {
      id: templateId,
      doc_type: combination.docType,
      industry: combination.industry,
      style_pack: combination.stylePack,
      palette_hints: {
        neutrals: 'cool',
        accentSaturation: 'medium',
        brandColor: '#8B5CF6'
      },
      scale: {
        fonts: {
          sans: { name: 'Inter', family: 'font-inter' },
          serif: { name: 'Source Serif 4', family: 'font-source-serif' }
        }
      },
      motifs: [],
      chart_defaults: {
        numberFormat: 'standard',
        showGrid: true
      },
      snippets: [],
      type_pairing: [{
        id: 'inter-source-serif',
        name: 'Inter × Source Serif Pro',
        sans: { name: 'Inter', family: 'font-inter' },
        serif: { name: 'Source Serif 4', family: 'font-source-serif' }
      }],
      validation_preset: null
    }
  }

  const handleBatchCompose = async () => {
    if (selectedCombinations.length === 0 || !session) return
    
    setIsComposing(true)
    setShowProgress(true)
    
    // Initialize progress tracking
    const initialProgress: BatchProgress[] = selectedCombinations.map(combination => ({
      id: `${combination.docType}.${combination.stylePack}.${combination.industry}.v1`,
      combination,
      status: 'pending'
    }))
    
    setBatchProgress(initialProgress)
    
    try {
      // Build seeds for all combinations
      const seeds = selectedCombinations.map(buildSeed)
      
      // Step 1: Batch ingest all seeds
      toast({ title: 'Starting batch composition...', description: `Processing ${seeds.length} combinations` })
      
      for (let i = 0; i < seeds.length; i++) {
        const seed = seeds[i]
        const combination = selectedCombinations[i]
        
        setBatchProgress(prev => prev.map(p => 
          p.id === seed.id ? { ...p, status: 'ingesting' } : p
        ))
        
        try {
          // Ingest individual seed
          const { error: ingestError } = await supabase.functions.invoke(
            'system-template-gen-seeds-ingest',
            {
              body: { seeds: [seed] },
              headers: {
                Authorization: `Bearer ${session.access_token}`
              }
            }
          )
          
          if (ingestError) throw new Error(`Ingest failed: ${ingestError.message}`)
          
          // Compose template
          setBatchProgress(prev => prev.map(p => 
            p.id === seed.id ? { ...p, status: 'composing' } : p
          ))
          
          const { data: composeResult, error: composeError } = await supabase.functions.invoke(
            'system-template-gen-seeds-compose',
            {
              body: { seedIds: [seed.id] },
              headers: {
                Authorization: `Bearer ${session.access_token}`
              }
            }
          )
          
          if (composeError) throw new Error(`Compose failed: ${composeError.message}`)
          
          const successfulResults = composeResult.results?.filter((r: any) => r.success) || []
          if (successfulResults.length > 0) {
            setBatchProgress(prev => prev.map(p => 
              p.id === seed.id ? { 
                ...p, 
                status: 'completed',
                templateId: successfulResults[0].templateId
              } : p
            ))
          } else {
            throw new Error('No template was created')
          }
          
        } catch (error) {
          console.error(`Error processing combination ${seed.id}:`, error)
          setBatchProgress(prev => prev.map(p => 
            p.id === seed.id ? { 
              ...p, 
              status: 'error',
              error: error.message
            } : p
          ))
        }
      }
      
      const completedCount = batchProgress.filter(p => p.status === 'completed').length
      toast({ 
        title: 'Batch composition completed!', 
        description: `Successfully created ${completedCount} of ${seeds.length} templates` 
      })
      
    } catch (error) {
      console.error('Batch compose error:', error)
      toast({ title: 'Batch composition failed', description: error.message })
    } finally {
      setIsComposing(false)
    }
  }

  const completedProgress = batchProgress.filter(p => p.status === 'completed').length
  const totalProgress = batchProgress.length
  const progressPercentage = totalProgress > 0 ? (completedProgress / totalProgress) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3X3 className="w-5 h-5 text-primary" />
          Batch Template Composer
        </CardTitle>
        <CardDescription>
          Select multiple combinations of Doc Type × Vibe × Industry to compose templates in batch
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selection Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="secondary">
              {selectedCombinations.length} of {allCombinations.length} combinations selected
            </Badge>
            {selectedCombinations.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCombinations([])}
              >
                Clear All
              </Button>
            )}
          </div>
          <Button
            onClick={handleBatchCompose}
            disabled={selectedCombinations.length === 0 || isComposing}
            className="flex items-center gap-2"
          >
            {isComposing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Compose Batch (Global)
          </Button>
        </div>

        {/* Progress Section */}
        {showProgress && (
          <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Batch Progress</CardTitle>
                <Badge variant={isComposing ? 'secondary' : 'default'}>
                  {completedProgress} / {totalProgress} completed
                </Badge>
              </div>
              {totalProgress > 0 && (
                <Progress value={progressPercentage} className="w-full" />
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {batchProgress.map((progress) => (
                    <div key={progress.id} className="flex items-center gap-3 p-2 border rounded-lg">
                      <div className="w-6 h-6 flex items-center justify-center">
                        {progress.status === 'pending' && (
                          <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                        )}
                        {(progress.status === 'ingesting' || progress.status === 'composing') && (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        )}
                        {progress.status === 'completed' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {progress.status === 'error' && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-mono text-sm">{progress.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {DOC_TYPES.find(d => d.id === progress.combination.docType)?.label} × {' '}
                          {VIBES.find(v => v.id === progress.combination.vibe)?.label} × {' '}
                          {INDUSTRIES.find(i => i.id === progress.combination.industry)?.label}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xs font-medium capitalize">{progress.status}</p>
                        {progress.error && (
                          <p className="text-xs text-red-500">{progress.error}</p>
                        )}
                      </div>
                      
                      {progress.templateId && (
                        <Button size="sm" variant="outline">
                          <Eye className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Matrix Picker */}
        <div className="space-y-4">
          <h3 className="font-medium">Select Combinations</h3>
          
          {DOC_TYPES.map(docType => (
            <Card key={docType.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{docType.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {VIBES.map(vibe => (
                    <div key={vibe.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {vibe.label} → {vibe.stylePack}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 ml-4">
                        {INDUSTRIES.map(industry => {
                          const combination = {
                            docType: docType.id,
                            vibe: vibe.id,
                            industry: industry.id,
                            stylePack: vibe.stylePack
                          }
                          const selected = isSelected(combination)
                          
                          return (
                            <div
                              key={industry.id}
                              className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
                                selected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                              }`}
                              onClick={() => toggleCombination(combination)}
                            >
                              <Checkbox
                                id={`${docType.id}-${vibe.id}-${industry.id}`}
                                checked={selected}
                                onChange={() => toggleCombination(combination)}
                              />
                              <label
                                htmlFor={`${docType.id}-${vibe.id}-${industry.id}`}
                                className="text-sm cursor-pointer"
                              >
                                {industry.label}
                              </label>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}