import { useState, useEffect } from 'react'
import { SemanticDocument, Section } from '@/lib/document-model'
import { ExportOptions, ExportFormat, ExportScope, exportEngine, PreflightResult } from '@/lib/export-engine'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  FileText, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Image, 
  Table, 
  FileType,
  Folder,
  Settings
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  document: SemanticDocument
  onExportComplete?: (jobId: string) => void
}

export const ExportModal = ({ isOpen, onClose, document, onExportComplete }: ExportModalProps) => {
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [filename, setFilename] = useState('')
  const [scope, setScope] = useState<ExportScope>('entire-doc')
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [pageRange, setPageRange] = useState({ start: 1, end: 1 })
  const [includeTOC, setIncludeTOC] = useState(true)
  const [includeFrontMatter, setIncludeFrontMatter] = useState(true)
  const [includeAppendix, setIncludeAppendix] = useState(true)
  const [generateTOC, setGenerateTOC] = useState(false)
  const [watermark, setWatermark] = useState('')
  
  // PDF specific
  const [embedFonts, setEmbedFonts] = useState(true)
  const [imageQuality, setImageQuality] = useState<'none' | '300dpi' | '150dpi'>('300dpi')
  const [taggedPDF, setTaggedPDF] = useState(true)
  
  // Google Docs specific
  const [folderId, setFolderId] = useState('')
  
  const [preflight, setPreflight] = useState<PreflightResult | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  // Generate default filename
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const version = 'Draft' // Could be dynamic based on document state
    setFilename(`${document.title} - ${version} - ${today}`)
  }, [document.title])

  // Run preflight checks
  useEffect(() => {
    if (isOpen) {
      // Generate layouts for preflight (this would be optimized in real implementation)
      const layoutResults = new Map()
      // For now, simulate the preflight result
      const mockPreflight: PreflightResult = {
        pageCount: 12,
        figureCount: 3,
        tableCount: 2,
        footnoteCount: 8,
        warnings: [
          {
            type: 'missing-alt-text',
            blockId: 'block-1',
            blockType: 'figure',
            message: 'Figure 1 is missing alt text',
            severity: 'warning'
          },
          {
            type: 'missing-caption',
            blockId: 'block-2', 
            blockType: 'figure',
            message: 'Figure 2 has no caption',
            severity: 'info'
          }
        ],
        canExport: true
      }
      setPreflight(mockPreflight)
    }
  }, [isOpen, document])

  const handleExport = async () => {
    if (!preflight) return

    const options: ExportOptions = {
      format,
      filename,
      scope,
      pageRange: scope === 'page-range' ? pageRange : undefined,
      selectedSections: scope === 'sections' ? selectedSections : undefined,
      includeTOC,
      includeFrontMatter,
      includeAppendix,
      generateTOC,
      watermark: watermark || undefined,
      embedFonts,
      imageQuality,
      taggedPDF,
      googleDocsOptions: {
        folderId: folderId || undefined
      }
    }

    try {
      setIsExporting(true)
      setExportProgress(0)

      const jobId = await exportEngine.startExport(
        document,
        options,
        (progress) => setExportProgress(progress)
      )

      // Wait for completion or timeout
      let attempts = 0
      const maxAttempts = 60 // 30 seconds with 500ms intervals

      const checkProgress = setInterval(() => {
        const job = exportEngine.getJob(jobId)
        if (job) {
          setExportProgress(job.progress)
          
          if (job.status === 'completed') {
            clearInterval(checkProgress)
            setIsExporting(false)
            onExportComplete?.(jobId)
            onClose()
            
            toast({
              title: "Export completed",
              description: `${format.toUpperCase()} export finished successfully`,
              action: job.result?.downloadUrl ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={job.result.downloadUrl} download>Download</a>
                </Button>
              ) : undefined
            })
          } else if (job.status === 'failed') {
            clearInterval(checkProgress)
            setIsExporting(false)
            
            toast({
              title: "Export failed",
              description: job.error || "Unknown error occurred",
              variant: "destructive"
            })
          }
        }

        attempts++
        if (attempts >= maxAttempts) {
          clearInterval(checkProgress)
          setIsExporting(false)
          toast({
            title: "Export timeout",
            description: "Export is taking longer than expected",
            variant: "destructive"
          })
        }
      }, 500)

    } catch (error) {
      setIsExporting(false)
      toast({
        title: "Export failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      })
    }
  }

  const getFormatIcon = (fmt: ExportFormat) => {
    switch (fmt) {
      case 'pdf': return <FileText className="w-4 h-4" />
      case 'docx': return <FileType className="w-4 h-4" />
      case 'google-docs': return <Folder className="w-4 h-4" />
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-destructive" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'info': return <Info className="w-4 h-4 text-blue-500" />
      default: return <CheckCircle className="w-4 h-4 text-green-500" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isExporting && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Export Document</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6 h-[600px]">
          {/* Main Export Options */}
          <div className="col-span-2 space-y-6">
            {/* Format Selection */}
            <Tabs value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pdf" className="flex items-center gap-2">
                  {getFormatIcon('pdf')} PDF
                </TabsTrigger>
                <TabsTrigger value="docx" className="flex items-center gap-2">
                  {getFormatIcon('docx')} DOCX
                </TabsTrigger>
                <TabsTrigger value="google-docs" className="flex items-center gap-2">
                  {getFormatIcon('google-docs')} Google Docs
                </TabsTrigger>
              </TabsList>

              {/* Filename */}
              <div className="space-y-2">
                <Label htmlFor="filename">Filename</Label>
                <Input
                  id="filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="Document filename"
                />
              </div>

              {/* Scope */}
              <div className="space-y-3">
                <Label>Scope</Label>
                <Select value={scope} onValueChange={(value) => setScope(value as ExportScope)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entire-doc">Entire document</SelectItem>
                    <SelectItem value="page-range">Page range</SelectItem>
                    <SelectItem value="sections">Selected sections</SelectItem>
                  </SelectContent>
                </Select>

                {scope === 'page-range' && (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Start"
                      value={pageRange.start}
                      onChange={(e) => setPageRange(prev => ({ ...prev, start: parseInt(e.target.value) || 1 }))}
                      className="w-20"
                    />
                    <span className="self-center">to</span>
                    <Input
                      type="number"
                      placeholder="End"
                      value={pageRange.end}
                      onChange={(e) => setPageRange(prev => ({ ...prev, end: parseInt(e.target.value) || 1 }))}
                      className="w-20"
                    />
                  </div>
                )}

                {scope === 'sections' && (
                  <div className="space-y-2">
                    {document.sections.map((section) => (
                      <div key={section.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={section.id}
                          checked={selectedSections.includes(section.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSections([...selectedSections, section.id])
                            } else {
                              setSelectedSections(selectedSections.filter(id => id !== section.id))
                            }
                          }}
                        />
                        <Label htmlFor={section.id} className="text-sm">
                          {section.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Include Options */}
              <div className="space-y-3">
                <Label>Include</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-toc"
                      checked={includeTOC}
                      onCheckedChange={(checked) => setIncludeTOC(!!checked)}
                    />
                    <Label htmlFor="include-toc" className="text-sm">Table of Contents</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="generate-toc"
                      checked={generateTOC}
                      onCheckedChange={(checked) => setGenerateTOC(!!checked)}
                    />
                    <Label htmlFor="generate-toc" className="text-sm">Generate TOC if missing</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-front"
                      checked={includeFrontMatter}
                      onCheckedChange={(checked) => setIncludeFrontMatter(!!checked)}
                    />
                    <Label htmlFor="include-front" className="text-sm">Front matter</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-appendix"
                      checked={includeAppendix}
                      onCheckedChange={(checked) => setIncludeAppendix(!!checked)}
                    />
                    <Label htmlFor="include-appendix" className="text-sm">Appendix</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="embed-fonts"
                      checked={embedFonts}
                      onCheckedChange={(checked) => setEmbedFonts(!!checked)}
                    />
                    <Label htmlFor="embed-fonts" className="text-sm">Embed fonts</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tagged-pdf"
                      checked={taggedPDF}
                      onCheckedChange={(checked) => setTaggedPDF(!!checked)}
                    />
                    <Label htmlFor="tagged-pdf" className="text-sm">Tagged PDF (accessibility)</Label>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Image quality</Label>
                    <Select value={imageQuality} onValueChange={(value: any) => setImageQuality(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No compression</SelectItem>
                        <SelectItem value="300dpi">300 DPI</SelectItem>
                        <SelectItem value="150dpi">150 DPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="google-docs" className="space-y-4">
                <div className="space-y-3">
                  <Label>Google Drive Options</Label>
                  
                  <div className="space-y-2">
                    <Label htmlFor="folder-id" className="text-sm">Folder ID (optional)</Label>
                    <Input
                      id="folder-id"
                      value={folderId}
                      onChange={(e) => setFolderId(e.target.value)}
                      placeholder="Google Drive folder ID"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preflight Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Preflight Check</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {preflight && (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{preflight.pageCount} pages</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Image className="w-3 h-3" />
                        <span>{preflight.figureCount} figures</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Table className="w-3 h-3" />
                        <span>{preflight.tableCount} tables</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileType className="w-3 h-3" />
                        <span>{preflight.footnoteCount} footnotes</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Warnings</Label>
                      {preflight.warnings.length === 0 ? (
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          No issues found
                        </div>
                      ) : (
                        <ScrollArea className="h-32">
                          <div className="space-y-1">
                            {preflight.warnings.map((warning, index) => (
                              <div key={index} className="flex items-start gap-2 text-xs">
                                {getSeverityIcon(warning.severity)}
                                <span className="flex-1">{warning.message}</span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Watermark */}
            <div className="space-y-2">
              <Label htmlFor="watermark" className="text-sm">Watermark (optional)</Label>
              <Input
                id="watermark"
                value={watermark}
                onChange={(e) => setWatermark(e.target.value)}
                placeholder="Confidential"
                className="text-xs"
              />
            </div>
          </div>
        </div>

        {/* Export Progress */}
        {isExporting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Exporting...</span>
              <span>{exportProgress}%</span>
            </div>
            <Progress value={exportProgress} />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={!preflight?.canExport || isExporting}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export {format.toUpperCase()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}