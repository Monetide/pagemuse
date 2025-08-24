import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Image as ImageIcon, X, Palette, Loader2 } from 'lucide-react';
import { useBrandKits } from '@/hooks/useBrandKits';
import { useMediaLibrary } from '@/hooks/useMediaLibrary';
import type { CreateBrandKitData } from '@/types/brandKit';

interface CreateBrandKitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Color extraction utility
const extractColorsFromImage = (imageElement: HTMLImageElement): Promise<string[]> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve(['#000000', '#666666', '#0066cc']);
      return;
    }

    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    ctx.drawImage(imageElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const colorCounts: Record<string, number> = {};

    // Sample pixels and count colors
    for (let i = 0; i < data.length; i += 4 * 10) { // Sample every 10th pixel for performance
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 128) continue; // Skip transparent pixels

      // Convert to hex
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      
      // Filter out near-white and near-black colors
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      if (brightness > 240 || brightness < 15) continue;

      colorCounts[hex] = (colorCounts[hex] || 0) + 1;
    }

    // Get top colors by frequency
    const sortedColors = Object.entries(colorCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([color]) => color)
      .slice(0, 5);

    if (sortedColors.length >= 2) {
      resolve(sortedColors);
    } else {
      resolve(['#000000', '#666666', '#0066cc']);
    }
  });
};

export const CreateBrandKitDialog = ({ open, onOpenChange }: CreateBrandKitDialogProps) => {
  const { createBrandKit } = useBrandKits();
  const { uploadFiles } = useMediaLibrary();
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  
  const [formData, setFormData] = useState<CreateBrandKitData>({
    workspace_id: '',
    name: '',
    logo_primary_url: '',
    logo_alt_url: '',
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
  });

  const primaryFileRef = useRef<HTMLInputElement>(null);
  const altFileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, type: 'primary' | 'alt') => {
    try {
      setLoading(true);
      
      // Upload file using the media library
      await uploadFiles([file]);
      
      // Create URL manually since uploadFiles doesn't return the file data
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const url = `https://dbrzfjekbfkjathotjcj.supabase.co/storage/v1/object/public/media/${fileName}`;
      
      if (type === 'primary') {
        setFormData(prev => ({ ...prev, logo_primary_url: url }));
        
        // Extract colors from primary logo
        setExtracting(true);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async () => {
          try {
            const colors = await extractColorsFromImage(img);
            setFormData(prev => ({
              ...prev,
              palette: {
                primary: colors[0] || '#0066cc',
                secondary: colors[1] || '#666666',
                accent: colors[2] || '#00cc66'
              }
            }));
          } catch (error) {
            console.error('Color extraction failed:', error);
          } finally {
            setExtracting(false);
          }
        };
        img.onerror = () => setExtracting(false);
        img.src = url;
      } else {
        setFormData(prev => ({ ...prev, logo_alt_url: url }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const brandKit = await createBrandKit(formData);
      if (brandKit) {
        onOpenChange(false);
        // Reset form
        setFormData({
          workspace_id: '',
          name: '',
          logo_primary_url: '',
          logo_alt_url: '',
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
        });
      }
    } catch (error) {
      console.error('Failed to create brand kit:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Brand Kit</DialogTitle>
          <DialogDescription>
            Set up your workspace branding with logos, colors, and typography.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Brand Kit Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Company Brand Guidelines"
              required
            />
          </div>

          {/* Logo Uploads */}
          <div className="space-y-4">
            <div>
              <Label>Logos</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Upload your brand logos. We'll auto-extract colors from the primary logo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Logo */}
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <Label className="text-sm font-medium">Primary Logo</Label>
                    {formData.logo_primary_url ? (
                      <div className="relative">
                        <img 
                          src={formData.logo_primary_url} 
                          alt="Primary logo"
                          className="h-16 object-contain mx-auto"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-background border"
                          onClick={() => setFormData(prev => ({ ...prev, logo_primary_url: '' }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 cursor-pointer hover:border-muted-foreground/50 transition-colors"
                        onClick={() => primaryFileRef.current?.click()}
                      >
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload</p>
                      </div>
                    )}
                    <input
                      ref={primaryFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'primary');
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Alt Logo */}
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <Label className="text-sm font-medium">Alt Logo (Optional)</Label>
                    <p className="text-xs text-muted-foreground">For dark backgrounds</p>
                    {formData.logo_alt_url ? (
                      <div className="relative">
                        <img 
                          src={formData.logo_alt_url} 
                          alt="Alt logo"
                          className="h-16 object-contain mx-auto"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-background border"
                          onClick={() => setFormData(prev => ({ ...prev, logo_alt_url: '' }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 cursor-pointer hover:border-muted-foreground/50 transition-colors"
                        onClick={() => altFileRef.current?.click()}
                      >
                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload</p>
                      </div>
                    )}
                    <input
                      ref={altFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'alt');
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Color Palette */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label>Color Palette</Label>
              {extracting && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Extracting colors...
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary</Label>
                <div className="flex gap-2">
                  <div 
                    className="w-10 h-10 rounded border-2 border-white shadow-sm"
                    style={{ backgroundColor: formData.palette.primary }}
                  />
                  <Input
                    id="primary-color"
                    type="color"
                    value={formData.palette.primary}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      palette: { ...prev.palette, primary: e.target.value }
                    }))}
                    className="flex-1 h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color">Secondary</Label>
                <div className="flex gap-2">
                  <div 
                    className="w-10 h-10 rounded border-2 border-white shadow-sm"
                    style={{ backgroundColor: formData.palette.secondary }}
                  />
                  <Input
                    id="secondary-color"
                    type="color"
                    value={formData.palette.secondary}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      palette: { ...prev.palette, secondary: e.target.value }
                    }))}
                    className="flex-1 h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accent-color">Accent</Label>
                <div className="flex gap-2">
                  <div 
                    className="w-10 h-10 rounded border-2 border-white shadow-sm"
                    style={{ backgroundColor: formData.palette.accent }}
                  />
                  <Input
                    id="accent-color"
                    type="color"
                    value={formData.palette.accent}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      palette: { ...prev.palette, accent: e.target.value }
                    }))}
                    className="flex-1 h-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.name.trim()}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Palette className="w-4 h-4 mr-2" />
                  Create Brand Kit
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};