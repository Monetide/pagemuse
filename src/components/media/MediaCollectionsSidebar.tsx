import { useState } from 'react'
import { 
  Folder, 
  FolderPlus, 
  Star, 
  Grid3X3, 
  MoreHorizontal, 
  Edit2, 
  Trash2,
  Crown,
  Hash
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MediaCollection } from '@/hooks/useMediaLibrary'
import { cn } from '@/lib/utils'

interface MediaCollectionsSidebarProps {
  collections: MediaCollection[]
  selectedCollectionId?: string
  onCollectionSelect: (collectionId?: string) => void
  onCreateCollection: (name: string, description?: string, isBrandAssets?: boolean, color?: string) => void
  className?: string
}

export const MediaCollectionsSidebar = ({
  collections,
  selectedCollectionId,
  onCollectionSelect,
  onCreateCollection,
  className
}: MediaCollectionsSidebarProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createData, setCreateData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    isBrandAssets: false
  })

  const handleCreateCollection = () => {
    if (createData.name.trim()) {
      onCreateCollection(
        createData.name.trim(),
        createData.description.trim() || undefined,
        createData.isBrandAssets,
        createData.color
      )
      setCreateData({
        name: '',
        description: '',
        color: '#6366f1',
        isBrandAssets: false
      })
      setShowCreateDialog(false)
    }
  }

  // Separate brand assets and regular collections
  const brandAssetsCollections = collections.filter(c => c.is_brand_assets)
  const regularCollections = collections.filter(c => !c.is_brand_assets)

  const CollectionItem = ({ collection }: { collection: MediaCollection }) => (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 group",
        selectedCollectionId === collection.id 
          ? "bg-primary/10 border border-primary/20" 
          : "hover:bg-muted/50"
      )}
      onClick={() => onCollectionSelect(collection.id)}
    >
      <div 
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: collection.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">
            {collection.name}
          </span>
          {collection.is_brand_assets && (
            <Crown className="w-3 h-3 text-yellow-600 flex-shrink-0" />
          )}
        </div>
        {collection.description && (
          <p className="text-xs text-muted-foreground truncate">
            {collection.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Badge variant="outline" className="text-xs">
          {collection.media_count || 0}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right">
            <DropdownMenuItem>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Collection
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Collection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <>
      <div className={cn("flex flex-col h-full", className)}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Collections</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCreateDialog(true)}
              className="p-1 h-auto"
            >
              <FolderPlus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Quick Access */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                Quick Access
              </h4>
              <div className="space-y-1">
                <div 
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
                    !selectedCollectionId 
                      ? "bg-primary/10 border border-primary/20" 
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => onCollectionSelect()}
                >
                  <Grid3X3 className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">All Media</span>
                </div>
              </div>
            </div>

            {/* Brand Assets */}
            {brandAssetsCollections.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Brand Assets
                </h4>
                <div className="space-y-1">
                  {brandAssetsCollections.map((collection) => (
                    <CollectionItem key={collection.id} collection={collection} />
                  ))}
                </div>
              </div>
            )}

            {/* Collections */}
            {regularCollections.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Collections
                </h4>
                <div className="space-y-1">
                  {regularCollections.map((collection) => (
                    <CollectionItem key={collection.id} collection={collection} />
                  ))}
                </div>
              </div>
            )}

            {collections.length === 0 && (
              <div className="text-center py-8">
                <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-4">
                  No collections yet
                </p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Create First Collection
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Create Collection Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
            <DialogDescription>
              Organize your media files into collections for better management.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="collection-name">Collection Name</Label>
              <Input
                id="collection-name"
                value={createData.name}
                onChange={(e) => setCreateData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter collection name..."
              />
            </div>
            <div>
              <Label htmlFor="collection-description">Description</Label>
              <Textarea
                id="collection-description"
                value={createData.description}
                onChange={(e) => setCreateData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="collection-color">Color</Label>
                <input
                  id="collection-color"
                  type="color"
                  value={createData.color}
                  onChange={(e) => setCreateData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-8 h-8 border rounded cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="brand-assets"
                  type="checkbox"
                  checked={createData.isBrandAssets}
                  onChange={(e) => setCreateData(prev => ({ ...prev, isBrandAssets: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="brand-assets" className="text-sm">
                  Brand Assets Collection
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCollection} disabled={!createData.name.trim()}>
              Create Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}