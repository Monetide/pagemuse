import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ColorwaySelector } from './ColorwaySelector'
import { ValidationPresetSelector } from './ValidationPresetSelector'
import { createDefaultThemeTokens, switchColorway } from '@/lib/template-model'
import { 
  FileText,
  Crown,
  Users,
  Calendar,
  Tag,
  Eye,
  Palette,
  Layout,
  Type,
  Image,
  BarChart3,
  Shield
} from 'lucide-react'
import { Template } from '@/hooks/useSupabaseData'
import { TemplateApplyBrandKitButton } from './TemplateApplyBrandKitButton'
import { BrandTab } from '@/components/brand/BrandTab'

interface TemplatePreviewProps {
  template: Template
  open: boolean
  onOpenChange: (open: boolean) => void
  onUseTemplate: () => void
  mode: 'new' | 'apply'
}

export function TemplatePreview({ 
  template, 
  open, 
  onOpenChange, 
  onUseTemplate, 
  mode 
}: TemplatePreviewProps) {
  const [themeTokens, setThemeTokens] = useState(() => createDefaultThemeTokens())
  const [selectedColorway, setSelectedColorway] = useState(themeTokens.activeColorway)
  const [selectedValidationPreset, setSelectedValidationPreset] = useState('default')

  const handleColorwayChange = (colorwayId: string) => {
    const updatedTokens = switchColorway(themeTokens, colorwayId)
    setThemeTokens(updatedTokens)
    setSelectedColorway(colorwayId)
  }
  // Mock preview pages - in real implementation, these would come from template data
  const previewPages = [
    {
      id: 1,
      name: 'Cover Page',
      type: 'cover',
      description: 'Professional cover page with title and author information',
      thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop'
    },
    {
      id: 2,
      name: 'Executive Summary',
      type: 'summary',
      description: 'Single-column layout for key findings and overview',
      thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop'
    },
    {
      id: 3,
      name: 'Main Content',
      type: 'content',
      description: 'Two-column layout for detailed content and analysis',
      thumbnail: 'https://images.unsplash.com/photo-1586281380614-67ca7b6b34dd?w=400&h=300&fit=crop'
    },
    {
      id: 4,
      name: 'Data Appendix',
      type: 'data',
      description: 'Landscape layout optimized for tables and charts',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop'
    }
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <DialogTitle className="text-2xl">{template.name}</DialogTitle>
                {template.is_premium && (
                  <Badge className="bg-yellow-500 text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              <DialogDescription className="text-base">
                {template.description || 'A professional template for your documents'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-3 ml-4">
              <ColorwaySelector
                themeTokens={themeTokens}
                selectedColorway={selectedColorway}
                onColorwayChange={handleColorwayChange}
                variant="compact"
              />
              <TemplateApplyBrandKitButton template={template} />
              <Button onClick={onUseTemplate}>
                {mode === 'apply' ? 'Apply Template' : 'Use This Template'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0">
            <Tabs defaultValue="preview" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-5 flex-shrink-0">
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="styles" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Styles
                </TabsTrigger>
                <TabsTrigger value="brand" className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Brand
                </TabsTrigger>
                <TabsTrigger value="validation" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Validation
                </TabsTrigger>
              </TabsList>

            <div className="flex-1 min-h-0 mt-4">
              <TabsContent value="preview" className="h-full mt-0">
                <ScrollArea className="h-full">
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold mb-2">Template Preview</h3>
                      <p className="text-muted-foreground">
                        This template includes {previewPages.length} different page layouts
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {previewPages.map((page) => (
                        <div key={page.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-purple-500/10 relative overflow-hidden">
                            <img 
                              src={page.thumbnail} 
                              alt={page.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            <div className="absolute bottom-4 left-4 text-white">
                              <h4 className="font-semibold">{page.name}</h4>
                              <p className="text-sm opacity-90">{page.type}</p>
                            </div>
                          </div>
                          <div className="p-4">
                            <p className="text-sm text-muted-foreground">{page.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="details" className="h-full mt-0">
                <ScrollArea className="h-full">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Tag className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium">Category</h4>
                            <p className="text-sm text-muted-foreground capitalize">{template.category}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium">Usage</h4>
                            <p className="text-sm text-muted-foreground">{template.usage_count} times used</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium">Created</h4>
                            <p className="text-sm text-muted-foreground">{formatDate(template.created_at)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Template Features</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Layout className="w-4 h-4 text-green-500" />
                              Multiple Layouts
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Type className="w-4 h-4 text-blue-500" />
                              Typography System
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Image className="w-4 h-4 text-purple-500" />
                              Image Placeholders
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <BarChart3 className="w-4 h-4 text-orange-500" />
                              Chart Support
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">What's Included</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Complete page layouts and styling</li>
                            <li>• Content placeholders and structure</li>
                            <li>• Typography and color schemes</li>
                            <li>• Table and figure formatting</li>
                            <li>• Header and footer templates</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="styles" className="h-full mt-0">
                <ScrollArea className="h-full">
                  <div className="space-y-6">
                    <ColorwaySelector
                      themeTokens={themeTokens}
                      selectedColorway={selectedColorway}
                      onColorwayChange={handleColorwayChange}
                      variant="palette"
                    />
                    
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-4">Current Color Palette</h4>
                        <div className="grid grid-cols-4 gap-3">
                          {(() => {
                            const activeColorway = themeTokens.colorways.find(c => c.id === selectedColorway)
                            if (!activeColorway) return null
                            
                            const colors = [
                              { name: 'Primary', value: activeColorway.palette.primary },
                              { name: 'Secondary', value: activeColorway.palette.secondary },
                              { name: 'Accent', value: activeColorway.palette.accent },
                              { name: 'Success', value: activeColorway.palette.success },
                              { name: 'Warning', value: activeColorway.palette.warning },
                              { name: 'Destructive', value: activeColorway.palette.destructive },
                              { name: 'Muted', value: activeColorway.palette.muted },
                              { name: 'Border', value: activeColorway.palette.border }
                            ]
                            
                            return colors.map((color, index) => (
                              <div key={index} className="text-center">
                                <div 
                                  className="aspect-square rounded-md border-2 border-white shadow-sm mb-2"
                                  style={{ backgroundColor: color.value }}
                                  title={color.value}
                                />
                                <span className="text-xs text-muted-foreground">{color.name}</span>
                              </div>
                            ))
                          })()}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-4">Typography</h4>
                        <div className="space-y-3">
                          <div>
                            <h1 className="text-2xl font-bold">Heading 1</h1>
                            <p className="text-sm text-muted-foreground">Inter, 24px, Bold</p>
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold">Heading 2</h2>
                            <p className="text-sm text-muted-foreground">Inter, 20px, Semibold</p>
                          </div>
                          <div>
                            <p className="text-base">Body Text</p>
                            <p className="text-sm text-muted-foreground">Inter, 16px, Regular</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Caption Text</p>
                            <p className="text-xs text-muted-foreground">Inter, 14px, Regular</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-4">Component Styles</h4>
                      <div className="grid gap-4">
                        {(() => {
                          const activeColorway = themeTokens.colorways.find(c => c.id === selectedColorway)
                          if (!activeColorway) return null
                          
                          return (
                            <>
                              <div 
                                className="border rounded-lg p-4"
                                style={{ 
                                  backgroundColor: `${activeColorway.palette.primary}15`,
                                  borderColor: activeColorway.palette.primary 
                                }}
                              >
                                <h5 
                                  className="font-medium mb-2"
                                  style={{ color: activeColorway.palette.primary }}
                                >
                                  Primary Callout
                                </h5>
                                <p className="text-sm" style={{ color: activeColorway.palette.foreground }}>
                                  This is how primary callouts will appear with the selected colorway.
                                </p>
                              </div>
                              <div 
                                className="border rounded-lg p-4"
                                style={{ 
                                  backgroundColor: `${activeColorway.palette.warning}15`,
                                  borderColor: activeColorway.palette.warning 
                                }}
                              >
                                <h5 
                                  className="font-medium mb-2"
                                  style={{ color: activeColorway.palette.warning }}
                                >
                                  Warning Callout
                                </h5>
                                <p className="text-sm" style={{ color: activeColorway.palette.foreground }}>
                                  This is how warning callouts will appear with the selected colorway.
                                </p>
                              </div>
                            </>
                          )
                        })()}
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-muted">
                              <tr>
                                <th className="text-left p-3 font-medium">Column 1</th>
                                <th className="text-left p-3 font-medium">Column 2</th>
                                <th className="text-left p-3 font-medium">Column 3</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-t">
                                <td className="p-3">Sample data</td>
                                <td className="p-3">Sample data</td>
                                <td className="p-3">Sample data</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="brand" className="h-full mt-0">
                <ScrollArea className="h-full">
                  <BrandTab
                    entityType="template"
                    entityId={template.id}
                    currentBrandKitId={undefined}
                    onBrandKitChange={() => {}}
                    onLogoSettingsChange={() => {}}
                  />
                </ScrollArea>
              </TabsContent>

              <TabsContent value="validation" className="h-full mt-0">
                <ScrollArea className="h-full">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">Template Validation Rules</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        These validation rules will be automatically applied to documents using this template
                      </p>
                    </div>
                    
                    <ValidationPresetSelector
                      selectedPreset={selectedValidationPreset}
                      onPresetChange={setSelectedValidationPreset}
                      showDetails={true}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}