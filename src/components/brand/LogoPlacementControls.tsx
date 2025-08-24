import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Image, 
  Settings, 
  Eye,
  Download,
  RotateCw
} from 'lucide-react'

export interface LogoPlacementSettings {
  coverLogo: {
    enabled: boolean
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    size: number // 8-14% of page width
    autoInvert: boolean
    nudgeOnOverlap: boolean
  }
  headerLogo: {
    enabled: boolean
    style: 'grayscale' | 'primary'
  }
  footerLogo: {
    enabled: boolean
    style: 'grayscale' | 'primary'
  }
}

interface LogoPlacementControlsProps {
  settings: LogoPlacementSettings
  onSettingsChange: (settings: LogoPlacementSettings) => void
  logoUrl?: string
  preview?: boolean
}

export function LogoPlacementControls({ 
  settings, 
  onSettingsChange, 
  logoUrl,
  preview = false 
}: LogoPlacementControlsProps) {
  const [previewMode, setPreviewMode] = useState<'cover' | 'content'>('cover')

  const updateSettings = (newSettings: Partial<LogoPlacementSettings>) => {
    onSettingsChange({
      ...settings,
      ...newSettings
    })
  }

  const updateCoverLogo = (updates: Partial<typeof settings.coverLogo>) => {
    updateSettings({
      coverLogo: { ...settings.coverLogo, ...updates }
    })
  }

  const updateHeaderLogo = (updates: Partial<typeof settings.headerLogo>) => {
    updateSettings({
      headerLogo: { ...settings.headerLogo, ...updates }
    })
  }

  const updateFooterLogo = (updates: Partial<typeof settings.footerLogo>) => {
    updateSettings({
      footerLogo: { ...settings.footerLogo, ...updates }
    })
  }

  const positionLabels = {
    'top-left': 'Top Left',
    'top-right': 'Top Right',
    'bottom-left': 'Bottom Left',
    'bottom-right': 'Bottom Right'
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Image className="w-5 h-5" />
          Logo Placement
        </h3>
        <p className="text-muted-foreground">
          Control how your brand logo appears across document layouts
        </p>
      </div>

      {/* Cover Page Logo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Cover Page Logo</CardTitle>
              <CardDescription>
                Position and size your logo on document covers
              </CardDescription>
            </div>
            <Switch
              checked={settings.coverLogo.enabled}
              onCheckedChange={(enabled) => updateCoverLogo({ enabled })}
            />
          </div>
        </CardHeader>
        {settings.coverLogo.enabled && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cover-position">Position</Label>
                <Select
                  value={settings.coverLogo.position}
                  onValueChange={(value: typeof settings.coverLogo.position) => 
                    updateCoverLogo({ position: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(positionLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover-size">
                  Size: {settings.coverLogo.size}% page width
                </Label>
                <Slider
                  value={[settings.coverLogo.size]}
                  onValueChange={([value]) => updateCoverLogo({ size: value })}
                  min={8}
                  max={14}
                  step={0.5}
                  className="w-full"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-invert">Auto-invert on dark backgrounds</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically invert logo colors when placed over dark images
                  </p>
                </div>
                <Switch
                  id="auto-invert"
                  checked={settings.coverLogo.autoInvert}
                  onCheckedChange={(autoInvert) => updateCoverLogo({ autoInvert })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="nudge-overlap">Nudge if overlaps text</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically adjust position to avoid text overlap
                  </p>
                </div>
                <Switch
                  id="nudge-overlap"
                  checked={settings.coverLogo.nudgeOnOverlap}
                  onCheckedChange={(nudgeOnOverlap) => updateCoverLogo({ nudgeOnOverlap })}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Header & Footer Logos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Header Logo</CardTitle>
                <CardDescription>
                  Show logo in document headers
                </CardDescription>
              </div>
              <Switch
                checked={settings.headerLogo.enabled}
                onCheckedChange={(enabled) => updateHeaderLogo({ enabled })}
              />
            </div>
          </CardHeader>
          {settings.headerLogo.enabled && (
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="header-style">Style</Label>
                <Select
                  value={settings.headerLogo.style}
                  onValueChange={(value: typeof settings.headerLogo.style) => 
                    updateHeaderLogo({ style: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grayscale">Grayscale</SelectItem>
                    <SelectItem value="primary">Primary Colors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Footer Logo</CardTitle>
                <CardDescription>
                  Show logo in document footers
                </CardDescription>
              </div>
              <Switch
                checked={settings.footerLogo.enabled}
                onCheckedChange={(enabled) => updateFooterLogo({ enabled })}
              />
            </div>
          </CardHeader>
          {settings.footerLogo.enabled && (
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="footer-style">Style</Label>
                <Select
                  value={settings.footerLogo.style}
                  onValueChange={(value: typeof settings.footerLogo.style) => 
                    updateFooterLogo({ style: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grayscale">Grayscale</SelectItem>
                    <SelectItem value="primary">Primary Colors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Preview Section */}
      {preview && logoUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Live Preview
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={previewMode === 'cover' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('cover')}
              >
                Cover Page
              </Button>
              <Button
                variant={previewMode === 'content' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('content')}
              >
                Content Page
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden bg-white">
              {previewMode === 'cover' ? (
                <div className="aspect-[8.5/11] relative bg-gradient-to-br from-slate-100 to-slate-200 p-8">
                  {settings.coverLogo.enabled && (
                    <div
                      className={`absolute ${
                        settings.coverLogo.position === 'top-left' ? 'top-8 left-8' :
                        settings.coverLogo.position === 'top-right' ? 'top-8 right-8' :
                        settings.coverLogo.position === 'bottom-left' ? 'bottom-8 left-8' :
                        'bottom-8 right-8'
                      }`}
                      style={{ 
                        width: `${settings.coverLogo.size}%`,
                        filter: settings.coverLogo.autoInvert ? 'invert(0)' : 'none'
                      }}
                    >
                      <img
                        src={logoUrl}
                        alt="Logo preview"
                        className="w-full h-auto max-h-12 object-contain"
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-slate-600">
                      <h1 className="text-3xl font-bold mb-4">Document Title</h1>
                      <p className="text-lg">Subtitle or description</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-[8.5/11] relative bg-white">
                  {/* Header */}
                  {settings.headerLogo.enabled && (
                    <div className="absolute top-0 left-0 right-0 h-16 border-b bg-white flex items-center px-8">
                      <img
                        src={logoUrl}
                        alt="Header logo"
                        className={`h-8 object-contain ${
                          settings.headerLogo.style === 'grayscale' ? 'grayscale' : ''
                        }`}
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className={`p-8 ${settings.headerLogo.enabled ? 'pt-24' : ''} ${settings.footerLogo.enabled ? 'pb-24' : ''}`}>
                    <div className="space-y-4 text-slate-800">
                      <h2 className="text-2xl font-bold">Content Section</h2>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-200 rounded"></div>
                          <div className="h-4 bg-slate-100 rounded w-4/5"></div>
                          <div className="h-4 bg-slate-200 rounded w-3/5"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-100 rounded"></div>
                          <div className="h-4 bg-slate-200 rounded w-4/5"></div>
                          <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  {settings.footerLogo.enabled && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 border-t bg-white flex items-center px-8">
                      <img
                        src={logoUrl}
                        alt="Footer logo"
                        className={`h-6 object-contain ${
                          settings.footerLogo.style === 'grayscale' ? 'grayscale' : ''
                        }`}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Notice */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div>
            <h4 className="font-medium text-foreground mb-1">Export Compatibility</h4>
            <p className="text-sm text-muted-foreground">
              Logo placement settings are applied to PDF and DOCX exports. 
              Cover logos may require high-resolution images for best print quality.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Default settings
export const createDefaultLogoSettings = (): LogoPlacementSettings => ({
  coverLogo: {
    enabled: false,
    position: 'top-right',
    size: 10,
    autoInvert: true,
    nudgeOnOverlap: true
  },
  headerLogo: {
    enabled: false,
    style: 'grayscale'
  },
  footerLogo: {
    enabled: false,
    style: 'grayscale'
  }
})