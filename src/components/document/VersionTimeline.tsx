import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  Save, 
  Camera, 
  Shield, 
  Eye, 
  RotateCcw,
  Trash2,
  MoreVertical 
} from 'lucide-react'
import { DocumentVersion } from '@/hooks/useDocumentVersions'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface VersionTimelineProps {
  versions: DocumentVersion[]
  currentVersionId?: string
  onViewVersion: (versionId: string) => void
  onRevertToVersion: (versionId: string) => void
  onDeleteVersion: (versionId: string) => void
  onCompareVersions?: (version1Id: string, version2Id: string) => void
}

const getVersionIcon = (type: DocumentVersion['version_type']) => {
  switch (type) {
    case 'autosave': return <Clock className="h-4 w-4" />
    case 'manual': return <Save className="h-4 w-4" />
    case 'snapshot': return <Camera className="h-4 w-4" />
    case 'safety': return <Shield className="h-4 w-4" />
  }
}

const getVersionBadgeVariant = (type: DocumentVersion['version_type']) => {
  switch (type) {
    case 'autosave': return 'secondary'
    case 'manual': return 'default'
    case 'snapshot': return 'outline'
    case 'safety': return 'destructive'
  }
}

export const VersionTimeline = ({ 
  versions, 
  currentVersionId,
  onViewVersion,
  onRevertToVersion,
  onDeleteVersion,
  onCompareVersions
}: VersionTimelineProps) => {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])

  const handleVersionSelect = (versionId: string) => {
    if (!onCompareVersions) return
    
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId)
      }
      if (prev.length >= 2) {
        return [prev[1], versionId]
      }
      return [...prev, versionId]
    })
  }

  const handleCompare = () => {
    if (selectedVersions.length === 2 && onCompareVersions) {
      onCompareVersions(selectedVersions[0], selectedVersions[1])
      setSelectedVersions([])
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Version History
        </CardTitle>
        {onCompareVersions && selectedVersions.length === 2 && (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCompare}>
              Compare Versions
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setSelectedVersions([])}
            >
              Clear Selection
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="space-y-2 p-4">
            {versions.map((version, index) => {
              const isSelected = selectedVersions.includes(version.id)
              const isCurrent = version.id === currentVersionId
              
              return (
                <div key={version.id} className="relative">
                  {index < versions.length - 1 && (
                    <div className="absolute left-6 top-12 h-6 w-px bg-border" />
                  )}
                  
                  <div 
                    className={`
                      flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                      ${isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}
                      ${isCurrent ? 'bg-accent border-accent-foreground' : ''}
                    `}
                    onClick={() => onCompareVersions && handleVersionSelect(version.id)}
                  >
                    <div className={`
                      flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background
                      ${isSelected ? 'border-primary text-primary' : 'border-border'}
                    `}>
                      {getVersionIcon(version.version_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getVersionBadgeVariant(version.version_type)}>
                          {version.version_type}
                        </Badge>
                        {isCurrent && (
                          <Badge variant="default">Current</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          v{version.version_number}
                        </span>
                      </div>
                      
                      <h4 className="font-medium text-sm truncate">
                        {version.snapshot_name || version.title}
                      </h4>
                      
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewVersion(version.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Version
                        </DropdownMenuItem>
                        {!isCurrent && (
                          <DropdownMenuItem onClick={() => onRevertToVersion(version.id)}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Revert to This
                          </DropdownMenuItem>
                        )}
                        {version.version_type !== 'safety' && (
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => onDeleteVersion(version.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Version
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
            
            {versions.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No version history yet</p>
                <p className="text-xs">Versions will be created automatically as you edit</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}