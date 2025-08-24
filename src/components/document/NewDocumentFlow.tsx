import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, 
  FileText, 
  Palette, 
  Sparkles, 
  ChevronRight,
  Check
} from 'lucide-react';
import { useBrandKits } from '@/hooks/useBrandKits';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { recolorSvg, generateTokenMapFromBrandKit } from '@/lib/svg-recoloring';
import type { BrandKit } from '@/types/brandKit';
import coverShapeSvg from '@/assets/cover-shape.svg?raw';

interface NewDocumentFlowProps {
  onComplete: (title: string, brandKit: BrandKit | null) => void;
  onCancel: () => void;
}

export const NewDocumentFlow = ({ onComplete, onCancel }: NewDocumentFlowProps) => {
  const { brandKits } = useBrandKits();
  const { currentWorkspace } = useWorkspaceContext();
  const [step, setStep] = useState<'title' | 'brand'>('title');
  const [title, setTitle] = useState('');
  const [selectedBrandKit, setSelectedBrandKit] = useState<BrandKit | null>(
    // Pre-select workspace default brand kit
    currentWorkspace?.default_brand_kit_id 
      ? brandKits.find(kit => kit.id === currentWorkspace.default_brand_kit_id) || null
      : null
  );

  const handleTitleNext = () => {
    if (title.trim()) {
      setStep('brand');
    }
  };

  const handleComplete = () => {
    onComplete(title.trim(), selectedBrandKit);
  };

  if (step === 'title') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Create New Document</h1>
          </div>
          <p className="text-muted-foreground">
            Let's start by giving your document a memorable title
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Project Proposal, Meeting Notes, Design Brief..."
                className="text-lg"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && title.trim()) {
                    handleTitleNext();
                  }
                }}
              />
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleTitleNext}
                disabled={!title.trim()}
                className="bg-gradient-primary hover:shadow-glow transition-all duration-200"
              >
                Next: Choose Brand Kit
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Palette className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Choose Brand Kit</h1>
        </div>
        <p className="text-muted-foreground">
          Select a brand kit to automatically style your document with your brand colors and assets
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Default Option */}
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-medium ${
            selectedBrandKit === null ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-muted-foreground'
          }`}
          onClick={() => setSelectedBrandKit(null)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-4 h-4 rounded border bg-muted" />
                Default
              </CardTitle>
              {selectedBrandKit === null && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Start with system defaults. You can apply a brand kit later.
              </p>
              <div className="h-16 rounded border bg-gradient-to-br from-muted to-background flex items-center justify-center">
                <span className="text-xs text-muted-foreground">No branding</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand Kit Options */}
        {brandKits.map((kit) => {
          const isSelected = selectedBrandKit?.id === kit.id;
          const tokenMap = generateTokenMapFromBrandKit(kit);
          
          return (
            <Card 
              key={kit.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-medium ${
                isSelected ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-muted-foreground'
              }`}
              onClick={() => setSelectedBrandKit(kit)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: kit.palette.primary }}
                    />
                    {kit.name}
                  </CardTitle>
                  {isSelected && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
                {currentWorkspace?.default_brand_kit_id === kit.id && (
                  <Badge variant="secondary" className="w-fit text-xs">
                    Workspace Default
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-1">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: kit.palette.primary }}
                    />
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: kit.palette.secondary }}
                    />
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: kit.palette.accent }}
                    />
                  </div>
                  
                  {/* Mini preview */}
                  <div className="relative h-16 rounded border overflow-hidden">
                    <div 
                      className="absolute inset-0 opacity-80"
                      dangerouslySetInnerHTML={{ 
                        __html: recolorSvg(coverShapeSvg, tokenMap)
                      }} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {brandKits.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-2">No Brand Kits Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a brand kit in workspace settings to automatically style your documents.
            </p>
            <Button variant="outline" size="sm">
              <ChevronRight className="w-4 h-4 mr-2" />
              Go to Brand Kits
            </Button>
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-medium text-blue-900">Auto-Brand Feature</h4>
            <p className="text-sm text-blue-800">
              Your new document will inherit the selected brand kit and automatically follow future updates. 
              You can change this later in the document settings.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('title')}>
          Back
        </Button>
        <Button 
          onClick={handleComplete}
          className="bg-gradient-primary hover:shadow-glow transition-all duration-200"
        >
          <FileText className="w-4 h-4 mr-2" />
          Create Document
        </Button>
      </div>
    </div>
  );
};