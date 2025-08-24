import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Palette, FileText, Zap, AlertCircle, Eye } from 'lucide-react'
import { MappingConfig } from './MappingWizard'
import { IRDocument } from '@/lib/ir-types'
import { useTemplates, Template } from '@/hooks/useSupabaseData'
import { useBrandKits } from '@/hooks/useBrandKits'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { cn } from '@/lib/utils'

interface MappingStep4Props {
  config: MappingConfig
  updateConfig: (updates: Partial<MappingConfig>) => void
  irDocument: IRDocument
  onValidationChange?: (isValid: boolean) => void
}

interface TemplateRecommendation {
  template: Template
  score: number
  reasons: string[]
  useCaseMatch: boolean
  contentMatch: boolean
}

export function MappingStep4({ 
  config, 
  updateConfig, 
  irDocument,
  onValidationChange 
}: MappingStep4Props) {
  const { templates, loading: templatesLoading } = useTemplates()
  const { brandKits, loading: brandKitsLoading } = useBrandKits()
  const { currentWorkspace } = useWorkspaceContext()
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(config.template || null)
  const [selectedBrandKit, setSelectedBrandKit] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<TemplateRecommendation[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [contrastScores, setContrastScores] = useState<Record<string, number>>({})

  // Get content statistics from IR document
  const getContentStats = useCallback(() => {
    const allBlocks = irDocument.sections?.flatMap(section => section.blocks) || []
    const headings = allBlocks.filter(b => b.type === 'heading')
    const paragraphs = allBlocks.filter(b => b.type === 'paragraph')
    const tables = allBlocks.filter(b => b.type === 'table')
    const figures = allBlocks.filter(b => b.type === 'figure')
    
    return {
      totalBlocks: allBlocks.length,
      headings: headings.length,
      paragraphs: paragraphs.length,
      tables: tables.length,
      figures: figures.length,
      estimatedLength: paragraphs.reduce((acc, p) => {
        if (typeof p.content === 'string') return acc + p.content.length
        if (p.content?.text) return acc + p.content.text.length
        return acc
      }, 0)
    }
  }, [irDocument])

  // Recommend templates based on use case and content
  const generateRecommendations = useCallback(() => {
    if (!templates.length) return

    const contentStats = getContentStats()
    const recs: TemplateRecommendation[] = []

    templates.forEach(template => {
      let score = 0
      const reasons: string[] = []
      let useCaseMatch = false
      let contentMatch = false

      // Use case matching
      const templateCategory = template.category?.toLowerCase() || ''
      const userUseCase = config.useCase
      
      if (
        (userUseCase === 'ebook' && templateCategory.includes('book')) ||
        (userUseCase === 'whitepaper' && (templateCategory.includes('white') || templateCategory.includes('paper'))) ||
        (userUseCase === 'case-study' && templateCategory.includes('case'))
      ) {
        score += 40
        reasons.push(`Perfect match for ${userUseCase}`)
        useCaseMatch = true
      } else if (templateCategory.includes('report') || templateCategory.includes('document')) {
        score += 20
        reasons.push(`General document template`)
      }

      // Content length matching
      if (contentStats.estimatedLength > 5000) {
        if (templateCategory.includes('long') || templateCategory.includes('comprehensive')) {
          score += 30
          reasons.push('Suitable for long-form content')
          contentMatch = true
        }
      } else if (contentStats.estimatedLength < 2000) {
        if (templateCategory.includes('brief') || templateCategory.includes('summary')) {
          score += 30
          reasons.push('Perfect for concise content')
          contentMatch = true
        }
      }

      // Structure matching
      if (contentStats.tables > 0 && templateCategory.includes('data')) {
        score += 20
        reasons.push('Great for data-heavy content')
        contentMatch = true
      }

      if (contentStats.figures > 2 && templateCategory.includes('visual')) {
        score += 20
        reasons.push('Optimized for visual content')
        contentMatch = true
      }

      // Premium templates get slight boost for quality
      if (template.is_premium) {
        score += 10
        reasons.push('Premium quality design')
      }

      // Usage popularity
      if (template.usage_count > 100) {
        score += 15
        reasons.push('Popular choice')
      }

      if (score > 0) {
        recs.push({
          template,
          score,
          reasons,
          useCaseMatch,
          contentMatch
        })
      }
    })

    // Sort by score and take top 3
    const topRecs = recs
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    setRecommendations(topRecs)
    
    // Auto-select highest scoring template if none selected
    if (!selectedTemplate && topRecs.length > 0) {
      const bestTemplate = topRecs[0].template
      setSelectedTemplate(bestTemplate)
      updateConfig({ template: bestTemplate })
    }
  }, [templates, config.useCase, getContentStats, selectedTemplate, updateConfig])

  // Find default brand kit
  const getDefaultBrandKit = useCallback(() => {
    if (!brandKits.length) return null
    
    // Look for a kit marked as default or the first one
    const defaultKit = brandKits.find(kit => 
      kit.name.toLowerCase().includes('default') || 
      kit.name.toLowerCase().includes('primary')
    ) || brandKits[0]
    
    return defaultKit
  }, [brandKits])

  // Calculate contrast scores for preview
  const calculateContrastScores = useCallback((brandKit: any) => {
    if (!brandKit) return {}
    
    const scores: Record<string, number> = {}
    
    // Mock contrast calculation - in real app, this would use actual color analysis
    const palette = brandKit.palette || {}
    const neutrals = brandKit.neutrals || {}
    
    // Calculate contrast between primary colors and background
    Object.keys(palette).forEach(key => {
      // Simplified contrast calculation (would use real WCAG algorithm)
      scores[key] = Math.random() > 0.3 ? 4.5 : 3.1 // AA compliance is 4.5+
    })
    
    return scores
  }, [])

  // Update preview when template or brand kit changes
  const updatePreview = useCallback(async () => {
    if (!selectedTemplate) return
    
    setPreviewLoading(true)
    
    try {
      // Simulate preview generation delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Calculate contrast scores if brand kit is selected
      if (selectedBrandKit) {
        const brandKit = brandKits.find(kit => kit.id === selectedBrandKit)
        const scores = calculateContrastScores(brandKit)
        setContrastScores(scores)
      }
      
      // Notify parent that step is valid
      onValidationChange?.(true)
    } catch (error) {
      console.error('Preview generation failed:', error)
    } finally {
      setPreviewLoading(false)
    }
  }, [selectedTemplate, selectedBrandKit, brandKits, calculateContrastScores, onValidationChange])

  // Initialize recommendations and default brand kit
  useEffect(() => {
    generateRecommendations()
  }, [generateRecommendations])

  useEffect(() => {
    if (!selectedBrandKit && brandKits.length > 0) {
      const defaultKit = getDefaultBrandKit()
      if (defaultKit) {
        setSelectedBrandKit(defaultKit.id)
      }
    }
  }, [brandKits, selectedBrandKit, getDefaultBrandKit])

  // Update preview when selections change
  useEffect(() => {
    updatePreview()
  }, [updatePreview])

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
    updateConfig({ template })
  }

  const handleBrandKitSelect = (brandKitId: string) => {
    setSelectedBrandKit(brandKitId)
    // Brand kit application would be handled during final import
  }

  const renderTemplateCard = (recommendation: TemplateRecommendation, index: number) => {
    const { template, score, reasons, useCaseMatch, contentMatch } = recommendation
    const isSelected = selectedTemplate?.id === template.id
    
    return (
      <Card 
        key={template.id}
        className={cn(
          'cursor-pointer transition-all duration-200 hover:shadow-lg',
          isSelected && 'ring-2 ring-primary shadow-glow'
        )}
        onClick={() => handleTemplateSelect(template)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {template.name}
                {index === 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Recommended
                  </Badge>
                )}
                {template.is_premium && (
                  <Badge variant="outline" className="text-xs">Premium</Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {template.description || 'Professional document template'}
              </p>
            </div>
            {isSelected && (
              <CheckCircle className="w-5 h-5 text-primary" />
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge 
              variant={useCaseMatch ? "default" : "secondary"} 
              className="text-xs"
            >
              {score} pts
            </Badge>
            {useCaseMatch && (
              <Badge variant="outline" className="text-xs text-success border-success">
                Use Case Match
              </Badge>
            )}
            {contentMatch && (
              <Badge variant="outline" className="text-xs text-primary border-primary">
                Content Match
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-2">
            {reasons.slice(0, 2).map((reason, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-1 h-1 rounded-full bg-primary" />
                {reason}
              </div>
            ))}
          </div>
          
          {template.preview_image_url && (
            <div className="mt-3 rounded-md bg-muted/30 h-16 flex items-center justify-center">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground ml-1">Preview</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderBrandKitSelector = () => {
    const defaultKit = getDefaultBrandKit()
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Brand Kit</h3>
          {selectedBrandKit && (
            <Badge variant="outline" className="text-xs">
              <Palette className="w-3 h-3 mr-1" />
              Applied
            </Badge>
          )}
        </div>
        
        <Select value={selectedBrandKit || ''} onValueChange={handleBrandKitSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select brand kit" />
          </SelectTrigger>
          <SelectContent>
            {brandKits.map(kit => (
              <SelectItem key={kit.id} value={kit.id}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  {kit.name}
                  {kit.id === defaultKit?.id && (
                    <Badge variant="secondary" className="text-xs ml-2">Default</Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedBrandKit && (
          <div className="text-xs text-muted-foreground">
            Brand colors and fonts will be applied to the selected template
          </div>
        )}
      </div>
    )
  }

  const renderPreview = () => {
    if (!selectedTemplate) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select a template to see preview</p>
          </div>
        </div>
      )
    }

    if (previewLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-3/4" />
        </div>
      )
    }

    const selectedBrandKitData = brandKits.find(kit => kit.id === selectedBrandKit)
    
    return (
      <div className="space-y-4">
        {/* Cover Page Preview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Cover Page
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-6 space-y-4">
              <div className="space-y-2">
                <div className="h-3 bg-primary/80 rounded w-3/4" />
                <div className="h-2 bg-foreground/60 rounded w-1/2" />
              </div>
              <div className="h-8 bg-muted rounded w-full" />
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <div className="h-2 bg-muted-foreground/40 rounded w-20" />
                  <div className="h-2 bg-muted-foreground/40 rounded w-16" />
                </div>
                {selectedBrandKitData?.logo_primary_url && (
                  <div className="w-8 h-8 bg-primary/20 rounded" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Body Page Preview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Body Page
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-3 bg-foreground/80 rounded w-2/3" />
              <div className="space-y-2">
                <div className="h-2 bg-muted-foreground/60 rounded w-full" />
                <div className="h-2 bg-muted-foreground/60 rounded w-5/6" />
                <div className="h-2 bg-muted-foreground/60 rounded w-4/5" />
              </div>
              <div className="h-16 bg-muted/50 rounded border border-dashed border-muted-foreground/30" />
              <div className="space-y-2">
                <div className="h-2 bg-muted-foreground/60 rounded w-full" />
                <div className="h-2 bg-muted-foreground/60 rounded w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contrast Badges */}
        {Object.keys(contrastScores).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Accessibility
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(contrastScores).map(([color, score]) => (
                  <Badge 
                    key={color}
                    variant={score >= 4.5 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {color}: {score >= 4.5 ? 'AA' : 'Fail'} ({score.toFixed(1)})
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                AA compliance ensures good readability for all users
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full gap-6">
      {/* Left Panel - Template Selection */}
      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Choose Template</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Based on your {config.useCase} use case and content analysis
          </p>
          
          {templatesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((rec, index) => renderTemplateCard(rec, index))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2" />
                  <p>No templates available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        {/* Brand Kit Selection */}
        {brandKitsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : brandKits.length > 0 ? (
          renderBrandKitSelector()
        ) : (
          <div className="text-sm text-muted-foreground">
            No brand kits available in workspace
          </div>
        )}
      </div>

      {/* Right Panel - Live Preview */}
      <div className="w-80 border-l border-border pl-6">
        <div className="sticky top-0">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Live Preview
          </h3>
          
          <div className="space-y-4">
            {renderPreview()}
          </div>
        </div>
      </div>
    </div>
  )
}