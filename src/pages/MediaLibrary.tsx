import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Download,
  Eye,
  Trash2,
  MoreHorizontal,
  FileImage,
  FileVideo,
  File
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Mock data - replace with real Supabase data
const mockMediaFiles = [
  {
    id: '1',
    name: 'hero-image.jpg',
    type: 'image',
    size: 2547123,
    url: '/placeholder.svg',
    created_at: '2024-01-15T10:30:00Z',
    file_type: 'image/jpeg'
  },
  {
    id: '2', 
    name: 'company-logo.png',
    type: 'image',
    size: 156432,
    url: '/placeholder.svg',
    created_at: '2024-01-14T15:20:00Z',
    file_type: 'image/png'
  },
  {
    id: '3',
    name: 'presentation.pdf',
    type: 'document',
    size: 5234567,
    url: '/placeholder.svg',
    created_at: '2024-01-13T09:45:00Z',
    file_type: 'application/pdf'
  },
  {
    id: '4',
    name: 'demo-video.mp4',
    type: 'video',
    size: 15678901,
    url: '/placeholder.svg',
    created_at: '2024-01-12T14:15:00Z',
    file_type: 'video/mp4'
  }
]

export default function MediaLibrary() {
  const [mediaFiles] = useState(mockMediaFiles)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fileTypes = ['all', 'image', 'video', 'document']

  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'all' || file.type === selectedType
    return matchesSearch && matchesType
  })

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
    switch (type) {
      case 'image': return FileImage
      case 'video': return FileVideo
      default: return File
    }
  }

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'image': return 'bg-blue-100 text-blue-800'
      case 'video': return 'bg-purple-100 text-purple-800'
      case 'document': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleUpload = () => {
    fileInputRef.current?.click()
  }

  const MediaCard = ({ file }: { file: any }) => {
    const IconComponent = getFileIcon(file.type)
    
    return (
      <Card className="border-0 shadow-soft hover:shadow-medium transition-all duration-200 group">
        <CardContent className="p-0">
          <div className="aspect-square bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-t-lg relative overflow-hidden">
            {file.type === 'image' ? (
              <img 
                src={file.url} 
                alt={file.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <IconComponent className="w-12 h-12 text-primary/50" />
              </div>
            )}
            <div className="absolute top-3 right-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-foreground mb-2 truncate">{file.name}</h3>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Badge variant="secondary" className={getFileTypeColor(file.type)}>
                  {file.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(file.created_at)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const MediaListItem = ({ file }: { file: any }) => {
    const IconComponent = getFileIcon(file.type)
    
    return (
      <Card className="border-0 shadow-soft hover:shadow-medium transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              {file.type === 'image' ? (
                <img src={file.url} alt={file.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <IconComponent className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{file.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Badge variant="secondary" className={getFileTypeColor(file.type)}>
                      {file.type}
                    </Badge>
                    <span>{formatFileSize(file.size)}</span>
                    <span>{formatDate(file.created_at)}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Media Library</h1>
          <p className="text-muted-foreground mt-2">
            Upload and manage your images, videos, and documents
          </p>
        </div>
        <Button onClick={handleUpload} className="bg-gradient-primary hover:shadow-glow transition-all duration-200">
          <Upload className="w-4 h-4 mr-2" />
          Upload Media
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx"
      />

      {/* Search and Filters */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-6">
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
                {fileTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        </CardContent>
      </Card>

      {/* Upload Zone */}
      <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors duration-200">
        <CardContent className="p-12 text-center">
          <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Drop files here or click to upload
          </h3>
          <p className="text-muted-foreground mb-6">
            Support for images, videos, and documents up to 10MB
          </p>
          <Button onClick={handleUpload} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Choose Files
          </Button>
        </CardContent>
      </Card>

      {/* Media Files */}
      <div>
        {filteredFiles.length === 0 ? (
          <Card className="border-0 shadow-soft">
            <CardContent className="p-12 text-center">
              <Image className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery || selectedType !== 'all' ? 'No files found' : 'No media files yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || selectedType !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first media file to get started'
                }
              </p>
              <Button onClick={handleUpload} className="bg-gradient-primary hover:shadow-glow transition-all duration-200">
                <Upload className="w-4 h-4 mr-2" />
                Upload First File
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {filteredFiles.map((file) => 
              viewMode === 'grid' 
                ? <MediaCard key={file.id} file={file} />
                : <MediaListItem key={file.id} file={file} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}