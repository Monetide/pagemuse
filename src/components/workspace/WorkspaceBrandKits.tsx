import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Palette, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { useBrandKits } from '@/hooks/useBrandKits';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { CreateBrandKitDialog } from './CreateBrandKitDialog';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export const WorkspaceBrandKits = () => {
  const { currentWorkspace } = useWorkspaceContext();
  const { brandKits, loading, deleteBrandKit } = useBrandKits();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this brand kit? This action cannot be undone.')) {
      await deleteBrandKit(id);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to={`/w/${currentWorkspace?.id}/settings`}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Brand Kits</h1>
            <p className="text-muted-foreground">
              Manage your workspace brand guidelines and assets
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setCreateDialogOpen(true)}
          className="bg-gradient-primary hover:shadow-glow transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Brand Kit
        </Button>
      </div>

      {/* Brand Kits Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-soft">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                  <div className="flex gap-2">
                    <div className="w-8 h-8 bg-muted rounded animate-pulse" />
                    <div className="w-8 h-8 bg-muted rounded animate-pulse" />
                    <div className="w-8 h-8 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : brandKits.length === 0 ? (
        <Card className="border-0 shadow-soft">
          <CardContent className="p-12 text-center">
            <Palette className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No brand kits yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Create your first brand kit to establish consistent branding across your workspace.
            </p>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Brand Kit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brandKits.map((brandKit) => (
            <Card key={brandKit.id} className="border-0 shadow-soft hover:shadow-medium transition-all duration-200 group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{brandKit.name}</CardTitle>
                    <CardDescription>
                      Created {formatDistanceToNow(new Date(brandKit.created_at), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(brandKit.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Logo Preview */}
                {brandKit.logo_primary_url && (
                  <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                    <img 
                      src={brandKit.logo_primary_url} 
                      alt={`${brandKit.name} logo`}
                      className="h-12 object-contain mx-auto"
                    />
                  </div>
                )}

                {/* Color Palette */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Color Palette</h4>
                  <div className="flex gap-2">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: brandKit.palette.primary }}
                      title={`Primary: ${brandKit.palette.primary}`}
                    />
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: brandKit.palette.secondary }}
                      title={`Secondary: ${brandKit.palette.secondary}`}
                    />
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: brandKit.palette.accent }}
                      title={`Accent: ${brandKit.palette.accent}`}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Primary: {brandKit.palette.primary.toUpperCase()}
                  </div>
                </div>

                {/* Fonts */}
                {brandKit.fonts && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium">Typography</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {brandKit.fonts.heading && (
                        <div>Heading: {brandKit.fonts.heading}</div>
                      )}
                      {brandKit.fonts.body && (
                        <div>Body: {brandKit.fonts.body}</div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateBrandKitDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
};