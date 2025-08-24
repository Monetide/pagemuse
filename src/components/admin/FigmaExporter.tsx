import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Figma, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { exportToFigma } from '@/lib/figma-exporter'
import type { SeedFormData } from './SeedForm'

interface FigmaExporterProps {
  seedData: SeedFormData
  onExport?: (success: boolean) => void
}

export function FigmaExporter({ seedData, onExport }: FigmaExporterProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [fileName, setFileName] = useState(seedData.brandName ? `${seedData.brandName}-template` : 'template')
  const [lastExport, setLastExport] = useState<Date | null>(null)

  const handleExport = async () => {
    if (!seedData.brandName) {
      toast.error('Please enter a brand name before exporting')
      return
    }

    setIsExporting(true)
    
    try {
      const figmaBlob = await exportToFigma(seedData, fileName)
      
      // Create download link
      const url = URL.createObjectURL(figmaBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileName}.fig`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      setLastExport(new Date())
      toast.success('Figma file exported successfully!')
      onExport?.(true)
    } catch (error) {
      console.error('Error exporting to Figma:', error)
      toast.error('Failed to export Figma file')
      onExport?.(false)
    } finally {
      setIsExporting(false)
    }
  }

  const canExport = seedData.brandName && seedData.colorway && seedData.typography

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Figma className="w-5 h-5 text-primary" />
          Export to Figma
        </CardTitle>
        <CardDescription>
          Generate a .fig file with your template tokens, page masters, and assets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Name */}
        <div className="space-y-2">
          <Label htmlFor="figma-filename">File Name</Label>
          <Input
            id="figma-filename"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Enter file name"
          />
        </div>

        {/* Export Contents Preview */}
        <div className="space-y-3">
          <Label>Export Contents</Label>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Color Tokens</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Page Masters</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Typography Components</span>
            </div>
            <div className="flex items-center gap-2">
              {seedData.motifs?.assets ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              <span>SVG Assets</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Layout Previews</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Export Settings</span>
            </div>
          </div>
        </div>

        {/* Export Status */}
        {lastExport && (
          <div className="text-sm text-muted-foreground">
            Last exported: {lastExport.toLocaleString()}
          </div>
        )}

        {/* Export Button */}
        <Button 
          onClick={handleExport} 
          disabled={!canExport || isExporting}
          className="w-full"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export .fig File
            </>
          )}
        </Button>

        {!canExport && (
          <p className="text-sm text-muted-foreground">
            Complete brand information, colorway, and typography to enable export
          </p>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p className="font-medium">After download:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Open Figma</li>
            <li>Go to File → Import</li>
            <li>Select the downloaded .fig file</li>
            <li>Your template will open with organized pages and components</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}