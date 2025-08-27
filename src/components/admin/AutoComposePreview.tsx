import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Download, 
  RefreshCw, 
  Shuffle, 
  Eye, 
  FileImage,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import type { SeedFormData } from '@/components/admin/SeedForm'
import type { PageComposition, LoremSeed } from '@/lib/page-composer'
import { 
  generateLoremContent, 
  generatePageCompositions, 
  exportPageAsPNG, 
  downloadBlob 
} from '@/lib/page-composer'
import { generateMotifAssets } from '@/lib/svg-motif-generator'
import PageRenderer from '@/components/admin/PageRenderer'

interface AutoComposePreviewProps {
  seedData?: SeedFormData
  onMotifShuffle?: (newMotifs: any) => void
  className?: string
}

const AutoComposePreview = React.memo(function AutoComposePreview({ 
  seedData, 
  onMotifShuffle, 
  className = '' 
}: AutoComposePreviewProps) {
  const [loremSeed, setLoremSeed] = useState<LoremSeed>(() => generateLoremContent(1))
  const [compositions, setCompositions] = useState<PageComposition[]>([])
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isShuffling, setIsShuffling] = useState(false)

  // Update compositions when seedData or loremSeed changes
  React.useEffect(() => {
    if (seedData) {
      const newCompositions = generatePageCompositions(seedData, loremSeed)
      setCompositions(newCompositions)
    }
  }, [seedData, loremSeed])

  const handleRegenerate = useCallback(async () => {
    setIsRegenerating(true)
    try {
      const newSeed = Math.floor(Math.random() * 10000)
      const newLoremSeed = generateLoremContent(newSeed)
      setLoremSeed(newLoremSeed)
      toast.success('Content regenerated with new lorem ipsum')
    } catch (error) {
      toast.error('Failed to regenerate content')
    } finally {
      setIsRegenerating(false)
    }
  }, [])

  const handleShuffleMotifs = useCallback(async () => {
    if (!seedData?.primaryColor || !onMotifShuffle) return
    
    setIsShuffling(true)
    try {
      const motifColors = {
        brand: seedData.primaryColor,
        brandSecondary: seedData.colorway?.colors.brandSecondary || seedData.primaryColor,
        textBody: seedData.colorway?.colors.textBody || '#1a1a1a',
        textMuted: seedData.colorway?.colors.textMuted || '#666666',
        borderSubtle: seedData.colorway?.colors.borderSubtle || '#e5e5e5'
      }
      const newMotifs = await generateMotifAssets(motifColors)
      onMotifShuffle(newMotifs)
      toast.success('Motifs shuffled successfully')
    } catch (error) {
      toast.error('Failed to shuffle motifs')
    } finally {
      setIsShuffling(false)
    }
  }, [seedData?.primaryColor, onMotifShuffle])

  const handleExportPage = useCallback(async (composition: PageComposition) => {
    setIsExporting(composition.id)
    try {
      const filename = `${composition.id}.png`
      const blob = await exportPageAsPNG(`page-${composition.id}`, filename, {
        width: 595,
        height: 842,
        scale: 2
      })
      downloadBlob(blob, `previews/${filename}`)
      toast.success(`Exported ${filename} successfully`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error(`Failed to export ${composition.id}.png`)
    } finally {
      setIsExporting(null)
    }
  }, [])

  const handleExportAll = useCallback(async () => {
    if (compositions.length === 0) return
    
    for (const composition of compositions) {
      await handleExportPage(composition)
      // Small delay between exports
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }, [compositions, handleExportPage])

  if (!seedData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            Auto-Compose Preview
          </CardTitle>
          <CardDescription>
            Configure your template settings to generate preview pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Complete the template configuration to see auto-composed pages
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="w-5 h-5" />
          Auto-Compose Preview
        </CardTitle>
        <CardDescription>
          Generated sample pages using your template settings
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Regenerate Content
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleShuffleMotifs}
            disabled={isShuffling || !seedData.motifs}
          >
            {isShuffling ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Shuffle className="w-4 h-4 mr-2" />
            )}
            Shuffle Motifs
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button 
            variant="default" 
            size="sm"
            onClick={handleExportAll}
            disabled={isExporting !== null || compositions.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export All PNGs
          </Button>
        </div>

        {/* Page Previews */}
        <div className="space-y-6">
          {compositions.map((composition) => (
            <div key={composition.id} className="space-y-3">
              {/* Page info */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{composition.name}</h4>
                  <p className="text-sm text-muted-foreground">{composition.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    previews/{composition.id}.png
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExportPage(composition)}
                    disabled={isExporting === composition.id}
                  >
                    {isExporting === composition.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Export PNG
                  </Button>
                </div>
              </div>

              {/* Page preview */}
              <div className="border rounded-lg overflow-hidden bg-white">
                <div 
                  id={`page-${composition.id}`}
                  className="w-full relative"
                  style={{ 
                    aspectRatio: '595/842', // A4 aspect ratio
                    maxWidth: '400px'
                  }}
                >
                  <PageRenderer 
                    composition={composition}
                    seedData={seedData}
                    scale={0.67} // Scale down for preview
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm font-medium">{compositions.length}</div>
              <div className="text-xs text-muted-foreground">Pages Generated</div>
            </div>
            <div>
              <div className="text-sm font-medium">{loremSeed.paragraphs.length}</div>
              <div className="text-xs text-muted-foreground">Lorem Paragraphs</div>
            </div>
            <div>
              <div className="text-sm font-medium">{seedData.motifs?.assets?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Motif Assets</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

export { AutoComposePreview }
export default AutoComposePreview