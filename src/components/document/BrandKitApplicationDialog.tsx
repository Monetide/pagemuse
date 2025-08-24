import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette, 
  Loader2, 
  ArrowRight, 
  RefreshCw, 
  Check,
  Eye,
  RotateCcw
} from 'lucide-react';
import { useKitApplications } from '@/hooks/useBrandKits';
import { recolorSvg, generateTokenMapFromBrandKit } from '@/lib/svg-recoloring';
import type { BrandKit } from '@/types/brandKit';
import bodyBgSvg from '@/assets/body-bg.svg?raw';
import dividerSvg from '@/assets/divider.svg?raw';
import coverShapeSvg from '@/assets/cover-shape.svg?raw';

interface BrandKitApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  brandKit: BrandKit | null;
  onComplete: () => void;
}

// Mock current document theme for before preview
const mockCurrentTheme = {
  palette: {
    primary: '#0066cc',
    secondary: '#666666', 
    accent: '#00cc66'
  },
  neutrals: {
    textBody: '#1a1a1a',
    textMuted: '#666666',
    bgPage: '#ffffff',
    bgSection: '#f8f9fa',
    borderSubtle: '#e5e7eb'
  }
};

export const BrandKitApplicationDialog = ({
  open,
  onOpenChange,
  documentId,
  brandKit,
  onComplete
}: BrandKitApplicationDialogProps) => {
  const { applyBrandKit, removeApplication, applications, fetchApplications } = useKitApplications();
  const [loading, setLoading] = useState(false);
  const [followUpdates, setFollowUpdates] = useState(true);
  const [previewMode, setPreviewMode] = useState<'cover' | 'body' | 'data'>('cover');

  const existingApplication = applications.find(app => 
    app.target_type === 'document' && 
    app.target_id === documentId
  );

  useEffect(() => {
    if (open && documentId) {
      fetchApplications('document', documentId);
    }
  }, [open, documentId, fetchApplications]);

  const handleApply = async () => {
    if (!brandKit) return;

    setLoading(true);
    try {
      const result = await applyBrandKit({
        target_type: 'document',
        target_id: documentId,
        brand_kit_id: brandKit.id,
        follow_updates: followUpdates,
        snapshot: brandKit
      });

      if (result) {
        onComplete();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Failed to apply brand kit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!existingApplication) return;

    setLoading(true);
    try {
      const success = await removeApplication(existingApplication.id);
      if (success) {
        onComplete();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Failed to rollback brand kit:', error);
    } finally {
      setLoading(false);
    }
  };

  const beforeTokenMap = generateTokenMapFromBrandKit(mockCurrentTheme);
  const afterTokenMap = brandKit ? generateTokenMapFromBrandKit(brandKit) : beforeTokenMap;

  const PreviewContent = ({ tokenMap, title }: { tokenMap: any; title: string }) => {
    if (previewMode === 'cover') {
      return (
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground">{title}</div>
          <div className="relative h-32 rounded border overflow-hidden">
            <div 
              className="absolute inset-0"
              dangerouslySetInnerHTML={{ 
                __html: recolorSvg(coverShapeSvg, tokenMap)
              }} 
            />
          </div>
          <div className="p-3 rounded" style={{ backgroundColor: tokenMap['bg/page'] }}>
            <h1 
              className="text-lg font-bold"
              style={{ color: tokenMap['brand/primary'] }}
            >
              Document Title
            </h1>
          </div>
        </div>
      );
    }

    if (previewMode === 'body') {
      return (
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground">{title}</div>
          <div 
            className="p-4 rounded border space-y-3"
            style={{ 
              backgroundColor: tokenMap['bg/page'],
              borderColor: tokenMap['border/subtle']
            }}
          >
            {/* Background pattern */}
            <div className="relative h-16 rounded overflow-hidden -mx-2 -mt-2 mb-3">
              <div 
                className="absolute inset-0 opacity-10"
                dangerouslySetInnerHTML={{ 
                  __html: recolorSvg(bodyBgSvg, tokenMap)
                }} 
              />
            </div>
            
            <h2 
              className="text-base font-semibold"
              style={{ color: tokenMap['brand/primary'] }}
            >
              Section Heading
            </h2>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p style={{ color: tokenMap['text/body'] }}>
                  Body text content that demonstrates readability and contrast.
                </p>
              </div>
              <div 
                className="p-2 rounded"
                style={{ backgroundColor: tokenMap['bg/section'] }}
              >
                <p 
                  className="font-medium text-xs"
                  style={{ color: tokenMap['brand/accent'] }}
                >
                  Callout
                </p>
                <p 
                  className="text-xs"
                  style={{ color: tokenMap['text/muted'] }}
                >
                  Secondary content
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground">{title}</div>
        <div 
          className="p-3 rounded border space-y-2"
          style={{ 
            backgroundColor: tokenMap['bg/page'],
            borderColor: tokenMap['border/subtle']
          }}
        >
          {/* Data table mockup */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div 
              className="p-2 rounded font-medium"
              style={{ 
                backgroundColor: tokenMap['brand/primary'],
                color: tokenMap['bg/page']
              }}
            >
              Metric A
            </div>
            <div 
              className="p-2 rounded font-medium"
              style={{ 
                backgroundColor: tokenMap['brand/secondary'],
                color: tokenMap['bg/page']
              }}
            >
              Metric B
            </div>
            <div 
              className="p-2 rounded font-medium"
              style={{ 
                backgroundColor: tokenMap['brand/accent'],
                color: tokenMap['bg/page']
              }}
            >
              Metric C
            </div>
          </div>
          
          {/* Divider */}
          <div className="h-4 my-2">
            <div 
              dangerouslySetInnerHTML={{ 
                __html: recolorSvg(dividerSvg, tokenMap)
              }} 
            />
          </div>
          
          <p 
            className="text-xs"
            style={{ color: tokenMap['text/body'] }}
          >
            Chart data with brand colors applied
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            {brandKit ? `Apply "${brandKit.name}"` : 'Remove Brand Kit'}
          </DialogTitle>
          <DialogDescription>
            {brandKit 
              ? `Preview how this brand kit will transform your document's appearance.`
              : 'Remove the current brand kit and revert to default styling.'
            }
          </DialogDescription>
        </DialogHeader>

        {existingApplication && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Currently Applied</Badge>
                <span className="text-sm">
                  Brand kit applied on {new Date(existingApplication.applied_at).toLocaleDateString()}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRollback}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Rollback
              </Button>
            </div>
          </div>
        )}

        {brandKit && (
          <div className="space-y-4">
            {/* Preview Mode Selector */}
            <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="cover">Cover</TabsTrigger>
                <TabsTrigger value="body">Body (2-col)</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
              </TabsList>

              <TabsContent value={previewMode} className="mt-4">
                <div className="grid grid-cols-2 gap-6">
                  {/* Before */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Before (Current)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PreviewContent tokenMap={beforeTokenMap} title="Current Theme" />
                    </CardContent>
                  </Card>

                  {/* After */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" />
                        After (With Brand Kit)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PreviewContent tokenMap={afterTokenMap} title={brandKit.name} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="follow-updates"
                    checked={followUpdates}
                    onCheckedChange={setFollowUpdates}
                  />
                  <Label htmlFor="follow-updates" className="text-sm">
                    Follow future brand kit updates
                  </Label>
                </div>
                <Badge variant="outline" className="text-xs">
                  Atomic update
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${followUpdates ? 'bg-green-500' : 'bg-orange-500'}`} />
                  <span className="font-medium">
                    {followUpdates ? 'Follow Updates' : 'Detached'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {followUpdates 
                    ? 'This document will automatically receive brand kit updates when they\'re modified. You can preview changes before applying.'
                    : 'This document will use a snapshot of the current brand kit and won\'t receive automatic updates. You can manually reapply updates later.'
                  }
                </p>
              </div>

              <div className="text-xs text-muted-foreground border-t pt-3">
                This will atomically update theme tokens, recolor SVGs, and regenerate previews. 
                A snapshot will be created for one-click rollback.
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApply}
            disabled={loading || !brandKit}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-200"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Apply Brand Kit
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};