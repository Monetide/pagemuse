import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CalendarIcon, BookOpen, User, Tag, FileText, Sparkles, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MappingConfig } from './MappingWizard'
import { IRDocument } from '@/lib/ir-types'
import { SemanticDocument } from '@/lib/document-model'
import { HighlightsPanel } from './HighlightsPanel'
import { HighlightCandidate } from '@/lib/highlight-detector'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface DocumentMetadata {
  title: string
  subtitle?: string
  author: string
  date: Date
  keywords: string[]
  description?: string
}

interface MappingStep5Props {
  config: MappingConfig
  updateConfig: (updates: Partial<MappingConfig>) => void
  irDocument: IRDocument
  mappedDocument?: SemanticDocument | null
  onComplete: () => void
}

export function MappingStep5({ 
  config, 
  updateConfig, 
  irDocument,
  mappedDocument,
  onComplete
}: MappingStep5Props) {
  const { currentWorkspace } = useWorkspaceContext()
  const { user } = useAuth()
  
  const [selectedHighlights, setSelectedHighlights] = useState<HighlightCandidate[]>([])
  const [showHighlights, setShowHighlights] = useState(false)
  
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    title: '',
    subtitle: '',
    author: user?.email || '',
    date: new Date(),
    keywords: [],
    description: ''
  })
  
  const [keywordInput, setKeywordInput] = useState('')
  const [suggestions, setSuggestions] = useState({
    titles: [] as string[],
    subtitles: [] as string[],
    keywords: [] as string[]
  })
  const [isGeneratingCover, setIsGeneratingCover] = useState(false)
  const [coverPreview, setCoverPreview] = useState<any>(null)

  // Extract suggestions from IR document
  const generateSuggestions = useCallback(() => {
    const allBlocks = irDocument.sections?.flatMap(section => section.blocks) || []
    const headings = allBlocks.filter(b => b.type === 'heading')
    
    // Title suggestions
    const titleSuggestions: string[] = []
    
    // Use document title if available
    if (irDocument.title) {
      titleSuggestions.push(irDocument.title)
    }
    
    // Use first H1 heading
    const firstH1 = headings.find(h => h.content?.level === 1)
    if (firstH1 && typeof firstH1.content?.text === 'string') {
      titleSuggestions.push(firstH1.content.text)
    }
    
    // Subtitle suggestions (H2s)
    const subtitleSuggestions: string[] = []
    const h2Headings = headings.filter(h => h.content?.level === 2)
    h2Headings.slice(0, 3).forEach(h => {
      if (typeof h.content?.text === 'string') {
        subtitleSuggestions.push(h.content.text)
      }
    })
    
    // Add pattern-based subtitles
    if (config.useCase === 'ebook') {
      subtitleSuggestions.push('A Comprehensive Guide', 'Essential Insights and Strategies')
    } else if (config.useCase === 'whitepaper') {
      subtitleSuggestions.push('Research and Analysis', 'Industry Insights Report')
    } else if (config.useCase === 'case-study') {
      subtitleSuggestions.push('Success Story and Lessons Learned', 'Implementation Case Study')
    }
    
    // Keyword suggestions based on headings
    const keywordSuggestions: string[] = []
    headings.forEach(h => {
      if (typeof h.content?.text === 'string') {
        const words = h.content.text.toLowerCase().split(/\s+/)
        words.forEach(word => {
          if (word.length > 4 && !keywordSuggestions.includes(word)) {
            keywordSuggestions.push(word)
          }
        })
      }
    })
    
    setSuggestions({
      titles: [...new Set(titleSuggestions)].slice(0, 3),
      subtitles: [...new Set(subtitleSuggestions)].slice(0, 3),
      keywords: [...new Set(keywordSuggestions)].slice(0, 8)
    })
    
    // Auto-fill title if empty
    if (!metadata.title && titleSuggestions.length > 0) {
      setMetadata(prev => ({ ...prev, title: titleSuggestions[0] }))
    }
  }, [irDocument, config.useCase, metadata.title])

  // Generate cover preview
  const generateCoverPreview = useCallback(() => {
    if (!metadata.title) return
    
    setIsGeneratingCover(true)
    
    setTimeout(() => {
      const allBlocks = irDocument.sections?.flatMap(section => section.blocks) || []
      const figures = allBlocks.filter(b => b.type === 'figure')
      
      const coverData = {
        title: metadata.title,
        subtitle: metadata.subtitle,
        author: metadata.author,
        date: format(metadata.date, 'MMMM yyyy'),
        hasImage: figures.length > 0
      }
      
      setCoverPreview(coverData)
      setIsGeneratingCover(false)
    }, 500)
  }, [metadata, irDocument])

  useEffect(() => {
    generateSuggestions()
  }, [generateSuggestions])

  useEffect(() => {
    if (metadata.title) {
      generateCoverPreview()
    }
  }, [generateCoverPreview])

  const handleMetadataChange = (field: keyof DocumentMetadata, value: any) => {
    setMetadata(prev => ({ ...prev, [field]: value }))
  }

  const handleSuggestionClick = (field: keyof DocumentMetadata, value: string) => {
    setMetadata(prev => ({ ...prev, [field]: value }))
  }

  const handleKeywordAdd = (keyword: string) => {
    if (keyword.trim() && !metadata.keywords.includes(keyword.trim())) {
      setMetadata(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword.trim()]
      }))
      setKeywordInput('')
    }
  }

  const handleKeywordRemove = (keyword: string) => {
    setMetadata(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }))
  }

  const handleKeywordInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleKeywordAdd(keywordInput)
    }
  }

  const handleGenerateAndContinue = () => {
    // Apply highlights to document here if needed
    if (selectedHighlights.length > 0) {
      console.log('Applying highlights:', selectedHighlights)
      // TODO: Insert highlights into the document structure
    }
    
    onComplete()
  }

  const handleHighlightsConfirm = (highlights: HighlightCandidate[]) => {
    setSelectedHighlights(highlights)
    setShowHighlights(false)
  }

  const toggleHighlightsPanel = () => {
    setShowHighlights(!showHighlights)
  }

  const renderSuggestions = (
    field: keyof typeof suggestions,
    onSelect: (value: string) => void
  ) => {
    const items = suggestions[field]
    if (!items.length) return null
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {items.map((item, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onSelect(item)}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            {item}
          </Button>
        ))}
      </div>
    )
  }

  const renderCoverPreview = () => {
    if (isGeneratingCover) {
      return (
        <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg">
          <div className="text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-muted-foreground">Generating cover...</p>
          </div>
        </div>
      )
    }
    
    if (!coverPreview) {
      return (
        <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
          <div className="text-center text-muted-foreground">
            <BookOpen className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Cover preview will appear here</p>
          </div>
        </div>
      )
    }
    
    return (
      <div className="relative h-64 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-6 overflow-hidden">
        {/* Cover shape background */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M40,-45C50,-35,55,-20,60,-5C65,10,70,25,65,35C60,45,45,50,30,55C15,60,0,65,-15,60C-30,55,-60,40,-70,20C-80,0,-70,-25,-55,-40C-40,-55,-20,-60,0,-60C20,-60,40,-55,40,-45Z" transform="translate(100 100)" />
          </svg>
        </div>
        
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-foreground leading-tight">
              {coverPreview.title}
            </h1>
            {coverPreview.subtitle && (
              <p className="text-sm text-muted-foreground font-medium">
                {coverPreview.subtitle}
              </p>
            )}
          </div>
          
          {coverPreview.hasImage && (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center">
                <FileText className="w-8 h-8 text-primary/60" />
              </div>
            </div>
          )}
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {coverPreview.author}
            </p>
            <p className="text-xs text-muted-foreground">
              {coverPreview.date}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Main Content - Cover & Metadata */}
      <div className={cn("transition-all duration-300", showHighlights ? "w-1/2" : "flex-1")}>
        <div className="space-y-6 h-full overflow-auto pr-2">
          
          {/* Header */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Cover & Metadata Generator</h2>
            <p className="text-sm text-muted-foreground">
              Complete the document information and review smart highlights
            </p>
          </div>

          <div className="flex gap-6">
            {/* Left Panel - Metadata Form */}
            <div className="flex-1 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Title *
                </Label>
                <Input
                  id="title"
                  value={metadata.title}
                  onChange={(e) => handleMetadataChange('title', e.target.value)}
                  placeholder="Enter document title"
                  className="text-base"
                />
                {renderSuggestions('titles', (value) => handleSuggestionClick('title', value))}
              </div>

              {/* Subtitle */}
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                <Input
                  id="subtitle"
                  value={metadata.subtitle || ''}
                  onChange={(e) => handleMetadataChange('subtitle', e.target.value)}
                  placeholder="Enter subtitle"
                />
                {renderSuggestions('subtitles', (value) => handleSuggestionClick('subtitle', value))}
              </div>

              {/* Author */}
              <div className="space-y-2">
                <Label htmlFor="author" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Author *
                </Label>
                <Input
                  id="author"
                  value={metadata.author}
                  onChange={(e) => handleMetadataChange('author', e.target.value)}
                  placeholder="Enter author name"
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Publication Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !metadata.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {metadata.date ? format(metadata.date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={metadata.date}
                      onSelect={(date) => date && handleMetadataChange('date', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Keywords
                </Label>
                <div className="space-y-2">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordInputKeyPress}
                    placeholder="Add keywords (press Enter or comma to add)"
                  />
                  
                  {/* Current keywords */}
                  {metadata.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {metadata.keywords.map((keyword) => (
                        <Badge
                          key={keyword}
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleKeywordRemove(keyword)}
                        >
                          {keyword} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Keyword suggestions */}
                  <div className="flex flex-wrap gap-2">
                    {suggestions.keywords.map((keyword) => (
                      <Button
                        key={keyword}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleKeywordAdd(keyword)}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {keyword}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={metadata.description || ''}
                  onChange={(e) => handleMetadataChange('description', e.target.value)}
                  placeholder="Brief description of the document"
                  rows={3}
                />
              </div>
            </div>

            {/* Right Panel - Cover Preview */}
            <div className="w-80 border-l border-border pl-6">
              <div className="sticky top-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Cover Preview</h3>
                  <Badge variant="outline" className="text-xs">
                    {config.template?.name || 'Template'}
                  </Badge>
                </div>
                
                {renderCoverPreview()}
                
                {coverPreview && (
                  <div className="space-y-3">
                    <Separator />
                    
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground">COVER ELEMENTS</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Title (H1):</span>
                          <span className="text-muted-foreground">✓</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Subtitle (Caption):</span>
                          <span className="text-muted-foreground">
                            {metadata.subtitle ? '✓' : '−'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cover Shape:</span>
                          <span className="text-muted-foreground">✓</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Body Background:</span>
                          <span className="text-muted-foreground">✓</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={toggleHighlightsPanel}
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {showHighlights ? 'Hide' : 'Show'} Smart Highlights
              {selectedHighlights.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedHighlights.length}
                </Badge>
              )}
            </Button>
            
            <Button 
              onClick={handleGenerateAndContinue}
              size="lg"
              className="flex items-center gap-2"
              disabled={!metadata.title.trim() || !metadata.author.trim()}
            >
              <FileText className="w-4 h-4" />
              Insert Cover & Continue
            </Button>
          </div>
        </div>
      </div>

      {/* Highlights Panel */}
      {showHighlights && (
        <div className="w-1/2 border-l border-border pl-4">
          <HighlightsPanel 
            irDocument={irDocument}
            onHighlightsConfirm={handleHighlightsConfirm}
          />
        </div>
      )}
    </div>
  )
}