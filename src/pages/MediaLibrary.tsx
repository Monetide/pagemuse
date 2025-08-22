import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  Image, 
  Upload,
  Filter,
  Grid3X3,
  List,
  FileImage,
  SortAsc,
  SortDesc,
  Calendar,
  Type,
  Hash
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMediaLibrary } from '@/hooks/useMediaLibrary'
import { MediaUploadZone } from '@/components/media/MediaUploadZone'
import { MediaCard } from '@/components/media/MediaCard'
import { MediaCollectionsSidebar } from '@/components/media/MediaCollectionsSidebar'

export default function MediaLibrary() {
  const {
    mediaFiles,
    collections,
    loading,
    uploadProgress,
    fetchMediaFiles,
    uploadFiles,
    updateMediaMetadata,
    deleteMediaFile,
    createCollection,
    addToCollection,
    getMediaUrl
  } = useMediaLibrary()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'size'>('recent')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>()

  // Get all unique tags from media files
  const allTags = Array.from(new Set(mediaFiles.flatMap(file => file.tags)))

  // Filter and sort media files
  const filteredAndSortedFiles = mediaFiles
    .filter(file => {
      const matchesSearch = file.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           file.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (file.description && file.description.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesType = selectedType === 'all' || file.file_type.startsWith(selectedType + '/')
      
      const matchesTags = selectedTags.length === 0 || 
                         selectedTags.some(tag => file.tags.includes(tag))
      
      return matchesSearch && matchesType && matchesTags
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.display_name.localeCompare(b.display_name)
          break
        case 'size':
          comparison = a.file_size - b.file_size
          break
        case 'recent':
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })

  const handleCollectionSelect = (collectionId?: string) => {
    setSelectedCollectionId(collectionId)
    fetchMediaFiles(collectionId)
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Load media when component mounts or collection changes
  useEffect(() => {
    if (selectedCollectionId !== undefined) {
      fetchMediaFiles(selectedCollectionId)
    }
  }, [selectedCollectionId, fetchMediaFiles])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading media library...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      {/* Collections Sidebar */}
      <div className="w-80 border-r bg-muted/30">
        <MediaCollectionsSidebar
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          onCollectionSelect={handleCollectionSelect}
          onCreateCollection={createCollection}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Media Library</h1>
              <p className="text-muted-foreground mt-2">
                {selectedCollectionId 
                  ? `Collection: ${collections.find(c => c.id === selectedCollectionId)?.name || 'Unknown'}`
                  : `${filteredAndSortedFiles.length} media file${filteredAndSortedFiles.length !== 1 ? 's' : ''} total`
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </Button>
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search media files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="File Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="application">Documents</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: 'recent' | 'name' | 'size') => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Recent
                  </div>
                </SelectItem>
                <SelectItem value="name">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Name
                  </div>
                </SelectItem>
                <SelectItem value="size">
                  <div className="flex items-center gap-2">
                    <FileImage className="w-4 h-4" />
                    Size
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {allTags.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Hash className="w-4 h-4 mr-2" />
                    Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allTags.map(tag => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={() => handleTagToggle(tag)}
                    >
                      {tag}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Upload Zone */}
          <MediaUploadZone 
            onUpload={uploadFiles}
            uploadProgress={uploadProgress}
          />

          {/* Media Files */}
          {filteredAndSortedFiles.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Image className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {mediaFiles.length === 0 ? 'No media files yet' : 'No files match your filters'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {mediaFiles.length === 0
                    ? 'Upload your first media file to get started'
                    : 'Try adjusting your search or filters'
                  }
                </p>
                {mediaFiles.length === 0 && (
                  <Button onClick={() => document.getElementById('file-upload')?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload First File
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6'
              : 'space-y-4'
            }>
              {filteredAndSortedFiles.map((file) => (
                <MediaCard
                  key={file.id}
                  file={file}
                  getMediaUrl={getMediaUrl}
                  onUpdate={updateMediaMetadata}
                  onDelete={deleteMediaFile}
                  onAddToCollection={(mediaId) => {
                    // Add to collection logic - could open a dialog to select collection
                    console.log('Add to collection:', mediaId)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}