import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ColorwaySelector } from '@/components/template/ColorwaySelector'
import { createDefaultThemeTokens, switchColorway, TemplateThemeTokens } from '@/lib/template-model'
import { BrandTab } from '@/components/brand/BrandTab'
import { LogoPlacementSettings, createDefaultLogoSettings } from '@/components/brand/LogoPlacementControls'
import { useToast } from '@/hooks/use-toast'
import { 
  Palette, 
  Type, 
  RotateCcw,
  Save,
  Image
} from 'lucide-react'

interface DocumentThemeSettingsProps {
  documentId: string
  currentTheme?: TemplateThemeTokens
  currentBrandKitId?: string
  logoSettings?: LogoPlacementSettings
  onThemeChange?: (theme: TemplateThemeTokens) => void
  onBrandKitChange?: (brandKitId: string | null) => void
  onLogoSettingsChange?: (settings: LogoPlacementSettings) => void
}

export function DocumentThemeSettings({ 
  documentId, 
  currentTheme,
  currentBrandKitId,
  logoSettings = createDefaultLogoSettings(),
  onThemeChange,
  onBrandKitChange,
  onLogoSettingsChange
}: DocumentThemeSettingsProps) {
  const { toast } = useToast()
  const [themeTokens, setThemeTokens] = useState<TemplateThemeTokens>(() => 
    currentTheme || createDefaultThemeTokens()
  )
  const [selectedColorway, setSelectedColorway] = useState(themeTokens.activeColorway)
  const [hasChanges, setHasChanges] = useState(false)

  const handleColorwayChange = (colorwayId: string) => {
    const updatedTokens = switchColorway(themeTokens, colorwayId)
    setThemeTokens(updatedTokens)
    setSelectedColorway(colorwayId)
    setHasChanges(true)
    
    // Notify parent component
    onThemeChange?.(updatedTokens)
  }

  const handleSaveTheme = () => {
    // In a real implementation, this would save to the backend
    toast({
      title: "Theme Updated",
      description: "Document theme has been saved successfully.",
    })
    setHasChanges(false)
  }

  const handleResetTheme = () => {
    const defaultTokens = createDefaultThemeTokens()
    setThemeTokens(defaultTokens)
    setSelectedColorway(defaultTokens.activeColorway)
    setHasChanges(true)
    onThemeChange?.(defaultTokens)
  }

  const activeColorway = themeTokens.colorways.find(c => c.id === selectedColorway)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Document Styling</h2>
        <p className="text-muted-foreground">
          Customize the visual appearance, branding, and layout of your document
        </p>
      </div>

      <Tabs defaultValue="theme" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="brand" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Brand
          </TabsTrigger>
        </TabsList>

        <TabsContent value="theme" className="space-y-6 mt-6">

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Color Theme
          </CardTitle>
          <CardDescription>
            Choose a colorway that matches your document's purpose and brand
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ColorwaySelector
            themeTokens={themeTokens}
            selectedColorway={selectedColorway}
            onColorwayChange={handleColorwayChange}
            variant="palette"
          />

          {activeColorway && (
            <div className="space-y-4">
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Preview</h4>
                <div className="grid gap-3">
                  <div 
                    className="p-4 rounded-lg border"
                    style={{ 
                      backgroundColor: activeColorway.palette.background,
                      borderColor: activeColorway.palette.border,
                      color: activeColorway.palette.foreground
                    }}
                  >
                    <h3 
                      className="text-lg font-semibold mb-2"
                      style={{ color: activeColorway.palette.primary }}
                    >
                      Document Title
                    </h3>
                    <p className="text-sm mb-3">
                      This is how your document content will appear with the selected colorway. 
                      The colors will be applied to headings, text, callouts, and other elements.
                    </p>
                    <div 
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                      style={{ 
                        backgroundColor: activeColorway.palette.accent,
                        color: activeColorway.palette.accentForeground
                      }}
                    >
                      Accent Element
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Typography
          </CardTitle>
          <CardDescription>
            Font families and sizing are inherited from the template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div 
                  className="text-lg font-bold mb-1"
                  style={{ fontFamily: themeTokens.typography.fontFamily.heading }}
                >
                  Heading Font
                </div>
                <p className="text-sm text-muted-foreground">
                  {themeTokens.typography.fontFamily.heading}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div 
                  className="text-base mb-1"
                  style={{ fontFamily: themeTokens.typography.fontFamily.body }}
                >
                  Body Font
                </div>
                <p className="text-sm text-muted-foreground">
                  {themeTokens.typography.fontFamily.body}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div 
                  className="text-sm font-mono mb-1"
                  style={{ fontFamily: themeTokens.typography.fontFamily.mono }}
                >
                  Code Font
                </div>
                <p className="text-sm text-muted-foreground">
                  {themeTokens.typography.fontFamily.mono}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleResetTheme}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </Button>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-sm text-muted-foreground">
                Unsaved changes
              </span>
            )}
            <Button
              onClick={handleSaveTheme}
              disabled={!hasChanges}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Theme
            </Button>
          </div>
        </div>
        </TabsContent>

        <TabsContent value="brand" className="mt-6">
          <BrandTab
            entityType="document"
            entityId={documentId}
            currentBrandKitId={currentBrandKitId}
            logoSettings={logoSettings}
            onBrandKitChange={onBrandKitChange}
            onLogoSettingsChange={onLogoSettingsChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}