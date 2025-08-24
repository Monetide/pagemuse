import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LogoPlacementControls, LogoPlacementSettings, createDefaultLogoSettings } from './LogoPlacementControls'
import { useBrandKits } from '@/hooks/useBrandKits'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { 
  Palette, 
  Image, 
  Settings,
  Eye,
  Download
} from 'lucide-react'

interface BrandTabProps {
  entityType: 'template' | 'document'
  entityId: string
  currentBrandKitId?: string
  logoSettings?: LogoPlacementSettings
  onBrandKitChange?: (brandKitId: string | null) => void
  onLogoSettingsChange?: (settings: LogoPlacementSettings) => void
}

export function BrandTab({ 
  entityType,
  entityId,
  currentBrandKitId,
  logoSettings = createDefaultLogoSettings(),
  onBrandKitChange,
  onLogoSettingsChange
}: BrandTabProps) {
  const { currentWorkspace } = useWorkspaceContext()
  const { brandKits } = useBrandKits()
  const [localLogoSettings, setLocalLogoSettings] = useState<LogoPlacementSettings>(logoSettings)

  const currentBrandKit = brandKits.find(kit => kit.id === currentBrandKitId)
  const logoUrl = currentBrandKit?.logo_primary_url

  const handleLogoSettingsChange = (newSettings: LogoPlacementSettings) => {
    setLocalLogoSettings(newSettings)
    onLogoSettingsChange?.(newSettings)
  }

  const hasLogoSettings = logoUrl && (
    localLogoSettings.coverLogo.enabled ||
    localLogoSettings.headerLogo.enabled ||
    localLogoSettings.footerLogo.enabled
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Palette className="w-6 h-6" />
          Brand Settings
        </h2>
        <p className="text-muted-foreground">
          Configure brand kit and logo placement for this {entityType}
        </p>
      </div>

      {/* Current Brand Kit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Brand Kit</CardTitle>
          <CardDescription>
            The brand kit currently applied to this {entityType}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentBrandKit ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <div 
                    className="w-8 h-8 rounded border-2 border-white shadow-sm"
                    style={{ backgroundColor: currentBrandKit.palette.primary }}
                    title="Primary"
                  />
                  <div 
                    className="w-8 h-8 rounded border-2 border-white shadow-sm"
                    style={{ backgroundColor: currentBrandKit.palette.secondary }}
                    title="Secondary"
                  />
                  <div 
                    className="w-8 h-8 rounded border-2 border-white shadow-sm"
                    style={{ backgroundColor: currentBrandKit.palette.accent }}
                    title="Accent"
                  />
                </div>
                <div>
                  <h4 className="font-medium">{currentBrandKit.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {currentBrandKit.logo_primary_url ? 'With logo' : 'Colors only'}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
          ) : (
            <div className="text-center py-8">
              <Palette className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h4 className="font-medium mb-2">No Brand Kit Applied</h4>
              <p className="text-sm text-muted-foreground mb-4">
                This {entityType} is using default styling
              </p>
              <Button variant="outline" size="sm">
                Apply Brand Kit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Logo Placement Controls */}
      {logoUrl ? (
        <LogoPlacementControls
          settings={localLogoSettings}
          onSettingsChange={handleLogoSettingsChange}
          logoUrl={logoUrl}
          preview={true}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Image className="w-5 h-5" />
              Logo Placement
            </CardTitle>
            <CardDescription>
              Logo placement controls will be available when a brand kit with a logo is applied
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Image className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h4 className="font-medium mb-2">No Logo Available</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Add a logo to your brand kit to enable placement controls
              </p>
              <Button variant="outline" size="sm">
                Update Brand Kit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {hasLogoSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Current Settings Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {localLogoSettings.coverLogo.enabled && (
                <div className="flex justify-between">
                  <span>Cover logo:</span>
                  <span className="text-muted-foreground">
                    {localLogoSettings.coverLogo.position.replace('-', ' ')} at {localLogoSettings.coverLogo.size}%
                  </span>
                </div>
              )}
              {localLogoSettings.headerLogo.enabled && (
                <div className="flex justify-between">
                  <span>Header logo:</span>
                  <span className="text-muted-foreground capitalize">
                    {localLogoSettings.headerLogo.style}
                  </span>
                </div>
              )}
              {localLogoSettings.footerLogo.enabled && (
                <div className="flex justify-between">
                  <span>Footer logo:</span>
                  <span className="text-muted-foreground capitalize">
                    {localLogoSettings.footerLogo.style}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Integration Notice */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Export Integration
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Logo placement settings are automatically applied to PDF and DOCX exports. 
              Changes made here will be reflected in all exported documents.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}