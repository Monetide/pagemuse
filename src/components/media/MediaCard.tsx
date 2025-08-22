import { useState } from 'react'
import { 
  MoreHorizontal, 
  Eye, 
  Download, 
  Edit, 
  Trash2, 
  Copy,
  FileImage,
  FileVideo,
  File,
  Tag,
  Users,
  History,
  FolderPlus
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MediaFile } from '@/hooks/useMediaLibrary'
import { cn } from '@/lib/utils'

interface MediaCardProps {
  file: MediaFile
  getMediaUrl: (filePath: string) => string
  onUpdate: (id: string, metadata: Partial<MediaFile>) => void
  onDelete: (id: string, filePath: string) => void
  onAddToCollection?: (mediaId: string) => void
  className?: string
}

export const MediaCard = ({ 
  file, 
  getMediaUrl, 
  onUpdate, 
  onDelete, 
  onAddToCollection,
  className 
}: MediaCardProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [editData, setEditData] = useState({
    display_name: file.display_name,
    description: file.description || '',
    credit: file.credit || '',
    license: file.license || '',
    alt_text: file.alt_text || '',
    tags: file.tags.join(', ')
  })

  const fileUrl = getMediaUrl(file.file_path)

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return FileImage
    if (type.startsWith('video/')) return FileVideo
    return File
  }

  const getFileTypeColor = (type: string) => {
    if (type.startsWith('image/')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    if (type.startsWith('video/')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }

  const handleSaveEdit = () => {
    onUpdate(file.id, {
      display_name: editData.display_name,
      description: editData.description || undefined,
      credit: editData.credit || undefined,
      license: editData.license || undefined,
      alt_text: editData.alt_text || undefined,
      tags: editData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    })
    setShowEditDialog(false)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = file.file_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const IconComponent = getFileIcon(file.file_type)

  return (
    <>
      <Card className={cn(
        "border-0 shadow-soft hover:shadow-medium transition-all duration-200 group",
        className
      )}>
        <CardContent className="p-0">
          <div className="aspect-square bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-t-lg relative overflow-hidden">
            {file.file_type.startsWith('image/') ? (
              <img 
                src={fileUrl} 
                alt={file.alt_text || file.display_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <IconComponent className="w-12 h-12 text-primary/50" />
              </div>
            )}
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowPreviewDialog(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 text-white border-0"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(fileUrl)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy URL
                    </DropdownMenuItem>
                    {onAddToCollection && (
                      <DropdownMenuItem onClick={() => onAddToCollection(file.id)}>
                        <FolderPlus className="w-4 h-4 mr-2" />
                        Add to Collection
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => onDelete(file.id, file.file_path)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Usage count badge */}
            {file.usage_count > 0 && (
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="bg-white/90 text-gray-800">
                  <Users className="w-3 h-3 mr-1" />
                  {file.usage_count}
                </Badge>
              </div>
            )}
          </div>
          
          <div className="p-4">
            <h3 className="font-semibold text-foreground mb-2 truncate" title={file.display_name}>
              {file.display_name}
            </h3>
            
            {/* Tags */}
            {file.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {file.tags.slice(0, 2).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <Tag className="w-2 h-2 mr-1" />
                    {tag}
                  </Badge>
                ))}
                {file.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{file.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Badge variant="secondary" className={getFileTypeColor(file.file_type)}>
                  {file.file_type.split('/')[0]}
                </Badge>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(file.file_size)}</span>
                  {file.width && file.height && (
                    <span>{file.width}×{file.height}</span>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(file.created_at)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{file.display_name}</DialogTitle>
            <DialogDescription>
              {file.description || 'No description available'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center max-h-96 overflow-hidden rounded-lg bg-muted">
            {file.file_type.startsWith('image/') ? (
              <img 
                src={fileUrl} 
                alt={file.alt_text || file.display_name}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8">
                <IconComponent className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Preview not available</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>File Size:</strong> {formatFileSize(file.file_size)}
            </div>
            <div>
              <strong>Type:</strong> {file.file_type}
            </div>
            {file.width && file.height && (
              <>
                <div>
                  <strong>Dimensions:</strong> {file.width}×{file.height}
                </div>
              </>
            )}
            <div>
              <strong>Created:</strong> {formatDate(file.created_at)}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Media Details</DialogTitle>
            <DialogDescription>
              Update the metadata for this media file
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={editData.display_name}
                onChange={(e) => setEditData(prev => ({ ...prev, display_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this media file..."
              />
            </div>
            <div>
              <Label htmlFor="alt_text">Alt Text</Label>
              <Input
                id="alt_text"
                value={editData.alt_text}
                onChange={(e) => setEditData(prev => ({ ...prev, alt_text: e.target.value }))}
                placeholder="Alternative text for accessibility..."
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={editData.tags}
                onChange={(e) => setEditData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="tag1, tag2, tag3..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="credit">Credit/Attribution</Label>
                <Input
                  id="credit"
                  value={editData.credit}
                  onChange={(e) => setEditData(prev => ({ ...prev, credit: e.target.value }))}
                  placeholder="Photo by..."
                />
              </div>
              <div>
                <Label htmlFor="license">License</Label>
                <Input
                  id="license"
                  value={editData.license}
                  onChange={(e) => setEditData(prev => ({ ...prev, license: e.target.value }))}
                  placeholder="CC BY-SA, All Rights Reserved..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}