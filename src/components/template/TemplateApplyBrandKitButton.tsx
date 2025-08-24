import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Palette, Check } from 'lucide-react'
import { BrandKit } from '@/types/brandKit'
import { Template } from '@/hooks/useSupabaseData'
import { useBrandKits, useKitApplications } from '@/hooks/useBrandKits'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { TemplateBrandKitApplicationDialog } from './TemplateBrandKitApplicationDialog'

interface TemplateApplyBrandKitButtonProps {
  template: Template
}

export function TemplateApplyBrandKitButton({ template }: TemplateApplyBrandKitButtonProps) {
  const { currentWorkspace } = useWorkspaceContext()
  const { brandKits, loading } = useBrandKits()
  const { applications, fetchApplications } = useKitApplications()
  const [selectedBrandKit, setSelectedBrandKit] = useState<BrandKit | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Get current application for this template
  const currentApplication = applications.find(app => 
    app.target_type === 'template' && app.target_id === template.id
  )

  const currentBrandKit = currentApplication ? 
    brandKits.find(kit => kit.id === currentApplication.brand_kit_id) : null

  const handleBrandKitSelect = (brandKit: BrandKit) => {
    setSelectedBrandKit(brandKit)
    setDialogOpen(true)
  }

  const handleApplicationComplete = () => {
    fetchApplications('template', template.id)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Palette className="w-4 h-4 mr-2" />
            {currentBrandKit ? (
              <>
                {currentBrandKit.name}
                <Check className="w-3 h-3 ml-2" />
              </>
            ) : (
              'Apply Brand Kit'
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Brand Kits</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {!currentBrandKit && (
            <DropdownMenuItem 
              onClick={() => setSelectedBrandKit(null)}
              className="flex items-center justify-between"
            >
              <span>Default</span>
              <Check className="w-4 h-4" />
            </DropdownMenuItem>
          )}
          
          {brandKits.map((brandKit) => (
            <DropdownMenuItem
              key={brandKit.id}
              onClick={() => handleBrandKitSelect(brandKit)}
              className="flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="font-medium">{brandKit.name}</div>
                <div className="flex items-center gap-1 mt-1">
                  <div 
                    className="w-3 h-3 rounded-full border border-border" 
                    style={{ backgroundColor: brandKit.palette.primary }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full border border-border" 
                    style={{ backgroundColor: brandKit.palette.secondary }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full border border-border" 
                    style={{ backgroundColor: brandKit.palette.accent }}
                  />
                </div>
              </div>
              {currentApplication?.brand_kit_id === brandKit.id && (
                <Check className="w-4 h-4" />
              )}
            </DropdownMenuItem>
          ))}
          
          {brandKits.length === 0 && !loading && (
            <DropdownMenuItem disabled>
              No brand kits available
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedBrandKit && (
        <TemplateBrandKitApplicationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          template={template}
          brandKit={selectedBrandKit}
          onComplete={handleApplicationComplete}
        />
      )}
    </>
  )
}