import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette, ChevronDown, Check } from 'lucide-react';
import { useBrandKits, useKitApplications } from '@/hooks/useBrandKits';
import { BrandKitApplicationDialog } from './BrandKitApplicationDialog';
import type { BrandKit } from '@/types/brandKit';

interface DocumentBrandKitSelectorProps {
  documentId: string;
  currentBrandKitId?: string;
  onBrandKitChange?: (brandKit: BrandKit | null) => void;
}

export const DocumentBrandKitSelector = ({ 
  documentId, 
  currentBrandKitId,
  onBrandKitChange 
}: DocumentBrandKitSelectorProps) => {
  const { brandKits } = useBrandKits();
  const { applications, fetchApplications } = useKitApplications();
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [selectedBrandKit, setSelectedBrandKit] = useState<BrandKit | null>(null);

  const currentBrandKit = brandKits.find(kit => kit.id === currentBrandKitId);
  const hasApplication = applications.some(app => 
    app.target_type === 'document' && 
    app.target_id === documentId
  );

  const handleBrandKitSelect = (brandKit: BrandKit | null) => {
    setSelectedBrandKit(brandKit);
    setApplicationDialogOpen(true);
  };

  const handleApplicationComplete = () => {
    setApplicationDialogOpen(false);
    setSelectedBrandKit(null);
    fetchApplications('document', documentId);
    if (onBrandKitChange && selectedBrandKit) {
      onBrandKitChange(selectedBrandKit);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">
              {currentBrandKit ? currentBrandKit.name : 'Default'}
            </span>
            {hasApplication && (
              <Badge variant="secondary" className="text-xs">Applied</Badge>
            )}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={() => handleBrandKitSelect(null)}
            className="flex items-center justify-between"
          >
            <span>Default (No Brand Kit)</span>
            {!currentBrandKitId && (
              <Check className="w-4 h-4" />
            )}
          </DropdownMenuItem>
          
          {brandKits.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {brandKits.map((kit) => (
                <DropdownMenuItem
                  key={kit.id}
                  onClick={() => handleBrandKitSelect(kit)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-sm border"
                      style={{ backgroundColor: kit.palette.primary }}
                    />
                    <span>{kit.name}</span>
                  </div>
                  {currentBrandKitId === kit.id && (
                    <Check className="w-4 h-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <BrandKitApplicationDialog
        open={applicationDialogOpen}
        onOpenChange={setApplicationDialogOpen}
        documentId={documentId}
        brandKit={selectedBrandKit}
        onComplete={handleApplicationComplete}
      />
    </>
  );
};