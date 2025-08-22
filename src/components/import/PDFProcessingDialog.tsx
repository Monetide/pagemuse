/**
 * PDF Processing Configuration Dialog
 * Allows users to configure PDF processing options including OCR settings
 */

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Eye, Languages, Zap } from 'lucide-react'
import { PDFProcessingOptions } from '@/lib/pdf-processor'

interface PDFProcessingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (options: PDFProcessingOptions) => void
  fileName?: string
}

const OCR_LANGUAGES = [
  { code: 'eng', name: 'English', flag: '🇺🇸' },
  { code: 'spa', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fra', name: 'French', flag: '🇫🇷' },
  { code: 'deu', name: 'German', flag: '🇩🇪' },
  { code: 'ita', name: 'Italian', flag: '🇮🇹' },
  { code: 'por', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'rus', name: 'Russian', flag: '🇷🇺' },
  { code: 'chi_sim', name: 'Chinese Simplified', flag: '🇨🇳' },
  { code: 'chi_tra', name: 'Chinese Traditional', flag: '🇹🇼' },
  { code: 'jpn', name: 'Japanese', flag: '🇯🇵' },
  { code: 'kor', name: 'Korean', flag: '🇰🇷' },
  { code: 'ara', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hin', name: 'Hindi', flag: '🇮🇳' }
]

export const PDFProcessingDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  fileName 
}: PDFProcessingDialogProps) => {
  const [options, setOptions] = useState<PDFProcessingOptions>({
    ocrLanguage: 'eng',
    confidenceThreshold: 75,
    enableOCR: true,
    detectColumns: true,
    mergeHyphenatedWords: true
  })

  const handleConfirm = () => {
    onConfirm(options)
    onOpenChange(false)
  }

  const updateOption = <K extends keyof PDFProcessingOptions>(
    key: K,
    value: PDFProcessingOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  const selectedLanguage = OCR_LANGUAGES.find(lang => lang.code === options.ocrLanguage)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            PDF Processing Options
          </DialogTitle>
          <DialogDescription>
            Configure how to process your PDF file. The system will first try to extract text, 
            and use OCR for image-only pages as fallback.
            {fileName && (
              <div className="mt-2">
                <Badge variant="outline" className="text-sm">
                  {fileName}
                </Badge>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Text Processing Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Text Processing
              </CardTitle>
              <CardDescription>
                Options for processing text-based PDF content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="detect-columns">Column Detection</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically detect multi-column layouts for proper reading order
                  </p>
                </div>
                <Switch
                  id="detect-columns"
                  checked={options.detectColumns}
                  onCheckedChange={(checked) => updateOption('detectColumns', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="merge-hyphenated">Merge Hyphenated Words</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically merge words split across line breaks with hyphens
                  </p>
                </div>
                <Switch
                  id="merge-hyphenated"
                  checked={options.mergeHyphenatedWords}
                  onCheckedChange={(checked) => updateOption('mergeHyphenatedWords', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* OCR Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Languages className="h-4 w-4" />
                OCR Settings
              </CardTitle>
              <CardDescription>
                Optical Character Recognition options for image-only pages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-ocr">Enable OCR</Label>
                  <p className="text-sm text-muted-foreground">
                    Use OCR as fallback for pages without extractable text
                  </p>
                </div>
                <Switch
                  id="enable-ocr"
                  checked={options.enableOCR}
                  onCheckedChange={(checked) => updateOption('enableOCR', checked)}
                />
              </div>

              {options.enableOCR && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="ocr-language">OCR Language</Label>
                    <Select
                      value={options.ocrLanguage}
                      onValueChange={(value) => updateOption('ocrLanguage', value)}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {selectedLanguage && (
                            <span className="flex items-center gap-2">
                              <span>{selectedLanguage.flag}</span>
                              <span>{selectedLanguage.name}</span>
                            </span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {OCR_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <span className="flex items-center gap-2">
                              <span>{lang.flag}</span>
                              <span>{lang.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Select the primary language of your document for better OCR accuracy
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="confidence-threshold">
                      Confidence Threshold: {options.confidenceThreshold}%
                    </Label>
                    <Slider
                      id="confidence-threshold"
                      min={50}
                      max={95}
                      step={5}
                      value={[options.confidenceThreshold || 75]}
                      onValueChange={([value]) => updateOption('confidenceThreshold', value)}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Less strict (50%)</span>
                      <span>More strict (95%)</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Text below this confidence level will be flagged for review
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Processing Info */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Processing Information:</p>
              <ul className="space-y-1 text-xs">
                <li>• Text-based PDFs will be processed using layout analysis</li>
                <li>• Typography heuristics will infer headings, tables, and figures</li>
                <li>• Image-only pages will use OCR when enabled</li>
                <li>• Low-confidence OCR text will be marked for manual review</li>
                <li>• Large PDFs may take several minutes to process</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Process PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}