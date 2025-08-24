import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Palette, 
  Crown,
  Settings,
  AlertCircle,
  Plus,
  Check
} from 'lucide-react';
import { useBrandKits } from '@/hooks/useBrandKits';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { CreateBrandKitDialog } from './CreateBrandKitDialog';
import type { BrandKit } from '@/types/brandKit';

export const WorkspaceBrandSettings = () => {
  const { brandKits } = useBrandKits();
  const { updateWorkspace } = useWorkspaces();
  const { currentWorkspace } = useWorkspaceContext();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const defaultBrandKit = currentWorkspace?.default_brand_kit_id 
    ? brandKits.find(kit => kit.id === currentWorkspace.default_brand_kit_id)
    : null;

  const handleSetDefault = async (brandKitId: string | null) => {
    if (!currentWorkspace) return;

    setUpdating(true);
    try {
      await updateWorkspace(currentWorkspace.id, {
        default_brand_kit_id: brandKitId
      });
    } catch (error) {
      console.error('Failed to update default brand kit:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Button>
        <div className="h-4 w-px bg-border" />
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Palette className="w-8 h-8" />
            Brand Settings
          </h1>
          <p className="text-muted-foreground">
            Manage workspace brand kits and set defaults for new documents
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Default Brand Kit Setting */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              <CardTitle>Default Brand Kit</CardTitle>
            </div>
            <CardDescription>
              Choose which brand kit is automatically applied to new documents in this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default-kit">Default Brand Kit</Label>
              <Select
                value={currentWorkspace?.default_brand_kit_id || "none"}
                onValueChange={(value) => handleSetDefault(value === "none" ? null : value)}
                disabled={updating}
              >
                <SelectTrigger id="default-kit">
                  <SelectValue placeholder="Select default brand kit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded border bg-muted" />
                      No default (manual selection)
                    </div>
                  </SelectItem>
                  {brandKits.map((kit) => (
                    <SelectItem key={kit.id} value={kit.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded border"
                          style={{ backgroundColor: kit.palette.primary }}
                        />
                        {kit.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {defaultBrandKit && (
              <div className="p-3 rounded border bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: defaultBrandKit.palette.primary }}
                    />
                    <div>
                      <p className="font-medium">{defaultBrandKit.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Will be pre-selected for new documents
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <Crown className="w-3 h-3 mr-1" />
                    Default
                  </Badge>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">How default brand kits work:</p>
                  <ul className="text-blue-800 space-y-1 list-disc list-inside ml-2">
                    <li>New documents will pre-select this brand kit during creation</li>
                    <li>Users can still choose a different kit or no kit when creating documents</li>
                    <li>Changing the default only affects future documents</li>
                    <li>Existing documents keep their current brand kit applications</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Brand Kits */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Available Brand Kits
                </CardTitle>
                <CardDescription>
                  Manage all brand kits available in this workspace
                </CardDescription>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Brand Kit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {brandKits.length > 0 ? (
              <div className="grid gap-3">
                {brandKits.map((kit) => {
                  const isDefault = currentWorkspace?.default_brand_kit_id === kit.id;
                  
                  return (
                    <div
                      key={kit.id}
                      className="flex items-center justify-between p-3 rounded border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: kit.palette.primary }}
                        />
                        <div>
                          <p className="font-medium">{kit.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(kit.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isDefault && (
                          <Badge variant="secondary">
                            <Crown className="w-3 h-3 mr-1" />
                            Default
                          </Badge>
                        )}
                        <Button
                          variant={isDefault ? "outline" : "secondary"}
                          size="sm"
                          onClick={() => handleSetDefault(isDefault ? null : kit.id)}
                          disabled={updating}
                        >
                          {isDefault ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Default
                            </>
                          ) : (
                            "Set as Default"
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-medium mb-2">No Brand Kits</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first brand kit to enable automatic document styling.
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Brand Kit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Document Application Behavior */}
        <Card>
          <CardHeader>
            <CardTitle>Document Application Behavior</CardTitle>
            <CardDescription>
              How brand kits are applied and updated in documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div>
                  <p className="font-medium">Follow Updates (Default)</p>
                  <p className="text-muted-foreground">
                    Documents automatically receive brand kit updates when they're modified.
                    Users can see a preview before applying changes.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                <div>
                  <p className="font-medium">Detached</p>
                  <p className="text-muted-foreground">
                    Documents use a snapshot of the brand kit and won't receive automatic updates.
                    Users can manually reapply the latest version if needed.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateBrandKitDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
};