import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Sparkles, 
  Quote, 
  BarChart3, 
  Key, 
  FileText, 
  MapPin, 
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react'
import { HighlightDetector, HighlightCandidate } from '@/lib/highlight-detector'
import { IRDocument } from '@/lib/ir-types'
import { cn } from '@/lib/utils'

interface HighlightsPanelProps {
  irDocument: IRDocument
  onHighlightsConfirm: (selectedHighlights: HighlightCandidate[]) => void
  className?: string
}

export function HighlightsPanel({ irDocument, onHighlightsConfirm, className }: HighlightsPanelProps) {
  const [highlights, setHighlights] = useState<HighlightCandidate[]>([])
  const [selectedHighlights, setSelectedHighlights] = useState<Set<string>>(new Set())
  const [isDetecting, setIsDetecting] = useState(true)

  useEffect(() => {
    const detectHighlights = async () => {
      setIsDetecting(true)
      try {
        const detector = new HighlightDetector()
        const detected = detector.detectHighlights(irDocument)
        setHighlights(detected)
        
        // Auto-select high confidence highlights
        const autoSelected = new Set(
          detected
            .filter(h => h.confidence > 0.7)
            .slice(0, 5) // Max 5 auto-selected
            .map(h => h.id)
        )
        setSelectedHighlights(autoSelected)
      } catch (error) {
        console.error('Failed to detect highlights:', error)
      } finally {
        setIsDetecting(false)
      }
    }

    detectHighlights()
  }, [irDocument])

  const getHighlightIcon = (type: HighlightCandidate['type']) => {
    switch (type) {
      case 'quote': return Quote
      case 'stat': return BarChart3
      case 'key-sentence': return Key
      case 'lead-sentence': return FileText
      default: return Sparkles
    }
  }

  const getHighlightColor = (type: HighlightCandidate['type']) => {
    switch (type) {
      case 'quote': return 'text-blue-600 bg-blue-50'
      case 'stat': return 'text-green-600 bg-green-50'
      case 'key-sentence': return 'text-purple-600 bg-purple-50'
      case 'lead-sentence': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getTypeLabel = (type: HighlightCandidate['type']) => {
    switch (type) {
      case 'quote': return 'Pull Quote'
      case 'stat': return 'Key Stat'
      case 'key-sentence': return 'Key Point'
      case 'lead-sentence': return 'Lead Sentence'
      default: return 'Highlight'
    }
  }

  const toggleHighlight = (highlightId: string) => {
    const newSelected = new Set(selectedHighlights)
    if (newSelected.has(highlightId)) {
      newSelected.delete(highlightId)
    } else {
      newSelected.add(highlightId)
    }
    setSelectedHighlights(newSelected)
  }

  const selectAll = () => {
    setSelectedHighlights(new Set(highlights.map(h => h.id)))
  }

  const selectNone = () => {
    setSelectedHighlights(new Set())
  }

  const selectHighConfidence = () => {
    setSelectedHighlights(new Set(
      highlights
        .filter(h => h.confidence > 0.7)
        .map(h => h.id)
    ))
  }

  const handleConfirm = () => {
    const selected = highlights.filter(h => selectedHighlights.has(h.id))
    onHighlightsConfirm(selected)
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return { label: 'High', color: 'bg-green-100 text-green-700' }
    if (confidence >= 0.6) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' }
    return { label: 'Low', color: 'bg-gray-100 text-gray-700' }
  }

  return (
    <Card className={cn("border-0 shadow-soft", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Smart Highlights
        </CardTitle>
        <CardDescription>
          AI-detected pull quotes, key stats, and important sentences
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isDetecting && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Analyzing content for highlights...</p>
            </div>
          </div>
        )}

        {!isDetecting && highlights.length === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No highlight candidates found. Try content with quotes, statistics, or key statements.
            </AlertDescription>
          </Alert>
        )}

        {!isDetecting && highlights.length > 0 && (
          <>
            {/* Summary and Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">{highlights.length}</span> candidates found, 
                  <span className="font-medium text-primary ml-1">{selectedHighlights.size}</span> selected
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={selectNone}>
                    None
                  </Button>
                  <Button variant="ghost" size="sm" onClick={selectHighConfidence}>
                    High Confidence
                  </Button>
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    All
                  </Button>
                </div>
              </div>

              {/* Type Distribution */}
              <div className="flex flex-wrap gap-2">
                {['quote', 'stat', 'key-sentence', 'lead-sentence'].map(type => {
                  const count = highlights.filter(h => h.type === type).length
                  if (count === 0) return null
                  
                  return (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {getTypeLabel(type as any)}: {count}
                    </Badge>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Highlights List */}
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {highlights.map((highlight, index) => {
                  const isSelected = selectedHighlights.has(highlight.id)
                  const Icon = getHighlightIcon(highlight.type)
                  const colorClass = getHighlightColor(highlight.type)
                  const confidence = getConfidenceLabel(highlight.confidence)
                  
                  return (
                    <div
                      key={highlight.id}
                      className={cn(
                        "p-4 rounded-lg border transition-all duration-200 cursor-pointer",
                        isSelected 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "border-muted hover:border-accent hover:bg-muted/30"
                      )}
                      onClick={() => toggleHighlight(highlight.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleHighlight(highlight.id)}
                          className="mt-0.5"
                        />
                        
                        <div className="flex-1 space-y-2">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={cn("p-1 rounded", colorClass)}>
                                <Icon className="w-3 h-3" />
                              </div>
                              <span className="text-xs font-medium">
                                {getTypeLabel(highlight.type)}
                              </span>
                              <Badge variant="outline" className={cn("text-xs", confidence.color)}>
                                {confidence.label}
                              </Badge>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                          </div>

                          {/* Content */}
                          <div className="space-y-2">
                            <blockquote className="text-sm border-l-2 border-muted pl-3 italic">
                              "{highlight.text}"
                            </blockquote>
                            
                            <div className="text-xs text-muted-foreground">
                              <div className="flex items-center gap-4">
                                <span>{highlight.reason}</span>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>
                                    After paragraph {highlight.suggestedInsertionPoint.afterParagraph}, 
                                    page ~{highlight.suggestedInsertionPoint.estimatedPage}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            <Separator />

            {/* Insertion Rules */}
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Insertion Rules:</strong> Highlights will be inserted as pull-quotes or callouts 
                using your template's styling. No two highlights will be placed back-to-back to maintain 
                good reading flow.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-muted-foreground">
                {selectedHighlights.size > 0 && (
                  <span>
                    {selectedHighlights.size} highlight{selectedHighlights.size !== 1 ? 's' : ''} 
                    will be inserted
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onHighlightsConfirm([])}
                >
                  Skip Highlights
                </Button>
                <Button 
                  size="sm"
                  onClick={handleConfirm}
                  disabled={selectedHighlights.size === 0}
                >
                  Insert {selectedHighlights.size} Highlight{selectedHighlights.size !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}