import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Loader2, 
  Palette, 
  Image, 
  FileText,
  AlertCircle,
  Package
} from 'lucide-react';
import { exportBrandKit, downloadBrandKitExport } from '@/lib/brand-kit-export';
import { toast } from 'sonner';
import type { BrandKit } from '@/types/brandKit';

interface BrandKitExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandKit: BrandKit | null;
}

export const BrandKitExportDialog = ({
  open,
  onOpenChange,
  brandKit
}: BrandKitExportDialogProps) => {
  const [exporting, setExporting] = useState(false);
  const [includeLogos, setIncludeLogos] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);

  const handleExport = async () => {
    if (!brandKit) return;

    setExporting(true);
    try {
      const exportData = await exportBrandKit(brandKit.id);
      
      if (!exportData) {
        toast.error('Failed to export brand kit');
        return;
      }

      // Remove logos if not included
      if (!includeLogos) {
        exportData.logos = {};
        exportData.brand_kit.logo_primary_url = undefined;
        exportData.brand_kit.logo_alt_url = undefined;
      }

      // Remove metadata if not included
      if (!includeMetadata) {
        delete exportData.metadata.total_applications;
        delete exportData.metadata.exported_from_workspace;
      }

      downloadBrandKitExport(exportData);
      
      toast.success('Brand kit exported successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export brand kit');
    } finally {
      setExporting(false);
    }
  };

  if (!brandKit) return null;

  const hasLogos = brandKit.logo_primary_url || brandKit.logo_alt_url;
  const estimatedSize = calculateEstimatedSize();

  function calculateEstimatedSize() {
    let size = 5; // Base JSON size in KB
    if (includeLogos && hasLogos) {
      size += 200; // Estimate ~100KB per logo
    }
    if (includeMetadata) {
      size += 1; // Metadata is small
    }
    return size;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Export Brand Kit
          </DialogTitle>
          <DialogDescription>
            Export "{brandKit.name}" as a portable package that can be imported into other workspaces.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Brand Kit Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Brand Kit Contents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Color Palette */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Colors</Label>
                <div className="flex gap-2 mt-1">
                  {Object.entries({...brandKit.palette, ...brandKit.neutrals}).map(([key, color]) => (
                    <div key={key} className="text-center">
                      <div 
                        className="w-8 h-8 rounded border shadow-sm"
                        style={{ backgroundColor: color as string }}
                        title={`${key}: ${color}`}
                      />
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {key}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logos */}
              {hasLogos && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Logos</Label>
                  <div className="flex gap-3 mt-1">
                    {brandKit.logo_primary_url && (
                      <div className="flex items-center gap-2 text-xs">
                        <Image className="w-3 h-3" />
                        Primary logo
                      </div>
                    )}
                    {brandKit.logo_alt_url && (
                      <div className="flex items-center gap-2 text-xs">
                        <Image className="w-3 h-3" />
                        Alt logo
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fonts */}
              {brandKit.fonts && Object.keys(brandKit.fonts).length > 0 && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Typography</Label>
                  <div className="text-xs text-muted-foreground mt-1">
                    {Object.entries(brandKit.fonts).map(([key, font]) => (
                      <span key={key} className="mr-3">
                        {key}: {font as string}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Export Options</CardTitle>
              <CardDescription className="text-xs">
                Choose what to include in the export package
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Include Logos */}
              {hasLogos && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-logos"
                    checked={includeLogos}
                    onCheckedChange={(checked) => setIncludeLogos(checked === true)}
                  />
                  <Label htmlFor="include-logos" className="text-sm">
                    Include logo files
                  </Label>
                  <Badge variant="secondary" className="text-xs">
                    +~200KB
                  </Badge>
                </div>
              )}

              {/* Include Metadata */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-metadata"
                  checked={includeMetadata}
                  onCheckedChange={(checked) => setIncludeMetadata(checked === true)}
                />
                <Label htmlFor="include-metadata" className="text-sm">
                  Include metadata (workspace, usage stats)
                </Label>
              </div>

              {/* File Size Estimate */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>Estimated file size:</span>
                  </div>
                  <Badge variant="outline">
                    ~{estimatedSize < 1024 ? `${estimatedSize}KB` : `${(estimatedSize / 1024).toFixed(1)}MB`}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning about logos */}
          {!includeLogos && hasLogos && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Logo files will not be included. The imported brand kit will reference the original logo URLs, 
                which may not be accessible in other workspaces.
              </AlertDescription>
            </Alert>
          )}

          {/* Export format info */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Export format: JSON with embedded assets. Compatible with PageMuse import system. 
              The exported file contains all necessary data to recreate this brand kit in another workspace.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Brand Kit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};