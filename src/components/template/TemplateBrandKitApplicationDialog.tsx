import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, AlertTriangle, FileText, Palette, Eye } from 'lucide-react'
import { BrandKit } from '@/types/brandKit'
import { Template } from '@/hooks/useSupabaseData'
import { useBrandKits, useKitApplications } from '@/hooks/useBrandKits'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { supabase } from '@/integrations/supabase/client'
import { recolorSvg, generateTokenMapFromBrandKit } from '@/lib/svg-recoloring'
import { useToast } from '@/hooks/use-toast'

// Import the SVG assets as strings
import bodyBgSvg from '@/assets/body-bg.svg?raw'
import dividerSvg from '@/assets/divider.svg?raw'
import coverShapeSvg from '@/assets/cover-shape.svg?raw'

interface TemplateBrandKitApplicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: Template
  brandKit: BrandKit
  onComplete?: () => void
}

export function TemplateBrandKitApplicationDialog({
  open,
  onOpenChange,
  template,
  brandKit,
  onComplete
}: TemplateBrandKitApplicationDialogProps) {
  const { currentWorkspace } = useWorkspaceContext()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [scope, setScope] = useState<'new_docs_only' | 'all_docs'>('new_docs_only')
  const [followUpdates, setFollowUpdates] = useState(true)
  const [existingDocsCount, setExistingDocsCount] = useState(0)
  const [currentApplication, setCurrentApplication] = useState<any>(null)

  const { applications, loading: applicationsLoading, fetchApplications, applyBrandKit, removeApplication } = useKitApplications()

  useEffect(() => {
    if (open && template?.id) {
      fetchApplications('template', template.id)
      fetchExistingDocsCount()
    }
  }, [open, template?.id])

  useEffect(() => {
    if (applications.length > 0) {
      const templateApp = applications.find(app => 
        app.target_type === 'template' && app.target_id === template?.id
      )
      setCurrentApplication(templateApp || null)
    }
  }, [applications, template?.id])

  const fetchExistingDocsCount = async () => {
    if (!template?.id) return

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id', { count: 'exact' })
        .eq('template_id', template.id)
        .is('deleted_at', null)

      if (error) throw error
      setExistingDocsCount(data?.length || 0)
    } catch (error) {
      console.error('Error fetching existing docs count:', error)
    }
  }

  const handleApply = async () => {
    if (!template?.id || !brandKit || !currentWorkspace) return

    setLoading(true)
    try {
      // Apply brand kit to template
      await applyBrandKit({
        target_type: 'template',
        target_id: template.id,
        brand_kit_id: brandKit.id,
        follow_updates: followUpdates,
        snapshot: {
          brandKit: brandKit,
          appliedAt: new Date().toISOString(),
          scope: scope
        }
      })

      // If updating existing docs, trigger background job
      if (scope === 'all_docs' && existingDocsCount > 0) {
        await supabase.functions.invoke('update-template-documents', {
          body: {
            templateId: template.id,
            brandKitId: brandKit.id,
            followUpdates: followUpdates
          }
        })

        toast({
          title: "Template Updated",
          description: `Brand kit applied to template. Updating ${existingDocsCount} existing documents in the background.`,
        })
      } else {
        toast({
          title: "Template Updated",
          description: "Brand kit applied successfully. New documents will use this branding.",
        })
      }

      onComplete?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error applying brand kit:', error)
      toast({
        title: "Error",
        description: "Failed to apply brand kit to template.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRollback = async () => {
    if (!currentApplication?.id) return

    setLoading(true)
    try {
      await removeApplication(currentApplication.id)
      
      toast({
        title: "Brand Kit Removed",
        description: "Template reverted to default styling.",
      })

      onComplete?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error removing brand kit:', error)
      toast({
        title: "Error",
        description: "Failed to remove brand kit from template.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Generate recolored previews
  const tokenMap = generateTokenMapFromBrandKit(brandKit)
  const recoloredBodyBg = recolorSvg(bodyBgSvg, tokenMap)
  const recoloredDivider = recolorSvg(dividerSvg, tokenMap)
  const recoloredCoverShape = recolorSvg(coverShapeSvg, tokenMap)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <Palette className="w-5 h-5" />
            Apply Brand Kit to Template
          </DialogTitle>
          <DialogDescription>
            Apply "{brandKit.name}" brand kit to the "{template.name}" template. 
            This will update styling and SVG assets for consistency.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 space-y-6">
          {/* Scope Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Application Scope</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    value="new_docs_only"
                    checked={scope === 'new_docs_only'}
                    onChange={(e) => setScope(e.target.value as any)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium">New documents only (Recommended)</div>
                    <div className="text-sm text-muted-foreground">
                      Apply brand kit to template. Only new documents created from this template will use the new branding.
                    </div>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    value="all_docs"
                    checked={scope === 'all_docs'}
                    onChange={(e) => setScope(e.target.value as any)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      Also update existing documents
                      <Badge variant="secondary" className="text-xs">
                        {existingDocsCount} docs
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Update the template AND apply changes to all existing documents that follow this template's updates.
                    </div>
                  </div>
                </label>
              </div>

              {scope === 'all_docs' && existingDocsCount > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This will update {existingDocsCount} existing document{existingDocsCount !== 1 ? 's' : ''} in the background. 
                    Each document will keep a snapshot for rollback. This action cannot be undone at the template level.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="follow-updates" 
                  checked={followUpdates}
                  onCheckedChange={(checked) => setFollowUpdates(!!checked)}
                />
                <label htmlFor="follow-updates" className="text-sm font-medium">
                  Follow future brand kit updates
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview Changes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="cover" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="cover">Cover</TabsTrigger>
                  <TabsTrigger value="body">Body</TabsTrigger>
                  <TabsTrigger value="data">Data</TabsTrigger>
                </TabsList>
                
                <TabsContent value="cover" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Before</h4>
                      <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                        <div 
                          className="absolute inset-0 opacity-20" 
                          dangerouslySetInnerHTML={{ __html: coverShapeSvg }}
                        />
                        <div className="relative z-10 text-center p-4">
                          <h3 className="text-lg font-bold text-foreground">Template Cover</h3>
                          <p className="text-sm text-muted-foreground">Default styling</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">After</h4>
                      <div 
                        className="aspect-[4/3] rounded-lg flex items-center justify-center relative overflow-hidden"
                        style={{ backgroundColor: brandKit.neutrals.bgPage }}
                      >
                        <div 
                          className="absolute inset-0 opacity-20" 
                          dangerouslySetInnerHTML={{ __html: recoloredCoverShape }}
                        />
                        <div className="relative z-10 text-center p-4">
                          <h3 
                            className="text-lg font-bold"
                            style={{ color: brandKit.neutrals.textBody }}
                          >
                            Template Cover
                          </h3>
                          <p 
                            className="text-sm"
                            style={{ color: brandKit.neutrals.textMuted }}
                          >
                            {brandKit.name} styling
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="body" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Before</h4>
                      <div className="aspect-[4/3] bg-muted rounded-lg p-4 relative overflow-hidden">
                        <div 
                          className="absolute inset-0 opacity-10" 
                          dangerouslySetInnerHTML={{ __html: bodyBgSvg }}
                        />
                        <div className="relative z-10 space-y-2">
                          <div className="h-3 bg-foreground/20 rounded w-3/4"></div>
                          <div className="h-2 bg-foreground/15 rounded w-full"></div>
                          <div className="h-2 bg-foreground/15 rounded w-5/6"></div>
                          <div 
                            className="h-px my-3" 
                            dangerouslySetInnerHTML={{ __html: dividerSvg }}
                          />
                          <div className="h-2 bg-foreground/15 rounded w-full"></div>
                          <div className="h-2 bg-foreground/15 rounded w-4/5"></div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">After</h4>
                      <div 
                        className="aspect-[4/3] rounded-lg p-4 relative overflow-hidden"
                        style={{ backgroundColor: brandKit.neutrals.bgSection }}
                      >
                        <div 
                          className="absolute inset-0 opacity-10" 
                          dangerouslySetInnerHTML={{ __html: recoloredBodyBg }}
                        />
                        <div className="relative z-10 space-y-2">
                          <div 
                            className="h-3 rounded w-3/4"
                            style={{ backgroundColor: brandKit.palette.primary }}
                          ></div>
                          <div 
                            className="h-2 rounded w-full"
                            style={{ backgroundColor: brandKit.neutrals.textMuted + '40' }}
                          ></div>
                          <div 
                            className="h-2 rounded w-5/6"
                            style={{ backgroundColor: brandKit.neutrals.textMuted + '40' }}
                          ></div>
                          <div 
                            className="h-px my-3" 
                            dangerouslySetInnerHTML={{ __html: recoloredDivider }}
                          />
                          <div 
                            className="h-2 rounded w-full"
                            style={{ backgroundColor: brandKit.neutrals.textMuted + '40' }}
                          ></div>
                          <div 
                            className="h-2 rounded w-4/5"
                            style={{ backgroundColor: brandKit.neutrals.textMuted + '40' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="data" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Before</h4>
                      <div className="aspect-[4/3] bg-muted rounded-lg p-3">
                        <div className="grid grid-cols-3 gap-2 h-full">
                          <div className="bg-foreground/10 rounded"></div>
                          <div className="bg-foreground/10 rounded"></div>
                          <div className="bg-foreground/10 rounded"></div>
                          <div className="bg-foreground/20 rounded"></div>
                          <div className="bg-foreground/15 rounded"></div>
                          <div className="bg-foreground/15 rounded"></div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">After</h4>
                      <div 
                        className="aspect-[4/3] rounded-lg p-3"
                        style={{ backgroundColor: brandKit.neutrals.bgPage }}
                      >
                        <div className="grid grid-cols-3 gap-2 h-full">
                          <div 
                            className="rounded"
                            style={{ backgroundColor: brandKit.palette.primary + '20' }}
                          ></div>
                          <div 
                            className="rounded"
                            style={{ backgroundColor: brandKit.palette.secondary + '20' }}
                          ></div>
                          <div 
                            className="rounded"
                            style={{ backgroundColor: brandKit.palette.accent + '20' }}
                          ></div>
                          <div 
                            className="rounded"
                            style={{ backgroundColor: brandKit.palette.primary }}
                          ></div>
                          <div 
                            className="rounded"
                            style={{ backgroundColor: brandKit.palette.secondary }}
                          ></div>
                          <div 
                            className="rounded"
                            style={{ backgroundColor: brandKit.palette.accent }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-4">
            {currentApplication && (
              <Button
                variant="outline"
                onClick={handleRollback}
                disabled={loading}
              >
                <FileText className="w-4 h-4 mr-2" />
                Rollback to Default
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Apply Brand Kit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}