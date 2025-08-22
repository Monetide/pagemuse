import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { CleanupResult, CleanupChange } from '@/lib/post-import-cleaner'
import { 
  FileText, 
  List, 
  Image, 
  Link, 
  Type, 
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react'

interface CleanupResultsPanelProps {
  cleanupResult: CleanupResult
}

export const CleanupResultsPanel: React.FC<CleanupResultsPanelProps> = ({
  cleanupResult
}) => {
  const { applied, changes } = cleanupResult

  const getChangeIcon = (type: CleanupChange['type']) => {
    switch (type) {
      case 'text-cleanup': return <Type className="h-4 w-4" />
      case 'list-normalization': return <List className="h-4 w-4" />
      case 'figure-caption': return <Image className="h-4 w-4" />
      case 'keep-with-next': return <FileText className="h-4 w-4" />
      case 'cross-reference': return <Link className="h-4 w-4" />
      default: return <CheckCircle className="h-4 w-4" />
    }
  }

  const getChangeColor = (type: CleanupChange['type']) => {
    switch (type) {
      case 'text-cleanup': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'list-normalization': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'figure-caption': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'keep-with-next': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'cross-reference': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getChangeTypeLabel = (type: CleanupChange['type']) => {
    switch (type) {
      case 'text-cleanup': return 'Text Cleanup'
      case 'list-normalization': return 'List Normalization'
      case 'figure-caption': return 'Figure Detection'
      case 'keep-with-next': return 'Pagination'
      case 'cross-reference': return 'Cross-Reference'
      default: return type
    }
  }

  const groupedChanges = changes.reduce((acc, change) => {
    if (!acc[change.type]) {
      acc[change.type] = []
    }
    acc[change.type].push(change)
    return acc
  }, {} as Record<string, CleanupChange[]>)

  if (!applied) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Document Quality
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No cleanups were needed.</p>
            <p className="text-xs">Your document is already well-formatted!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          Applied Cleanups
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {changes.length} fixes applied
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0">
        <ScrollArea className="h-full px-4 pb-4">
          <div className="space-y-4">
            {Object.entries(groupedChanges).map(([type, typeChanges]) => (
              <div key={type} className="space-y-2">
                <div className="flex items-center gap-2">
                  {getChangeIcon(type as CleanupChange['type'])}
                  <span className="font-medium text-sm">
                    {getChangeTypeLabel(type as CleanupChange['type'])}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getChangeColor(type as CleanupChange['type'])}`}
                  >
                    {typeChanges.length}
                  </Badge>
                </div>
                
                <div className="space-y-2 ml-6">
                  {typeChanges.map((change, index) => (
                    <div key={`${change.blockId}-${index}`} className="border rounded-lg p-3 bg-muted/20">
                      <p className="text-xs text-muted-foreground mb-1">
                        Block: {change.blockId.substring(0, 8)}...
                      </p>
                      <p className="text-sm">{change.description}</p>
                      
                      {change.before && change.after && (
                        <div className="mt-2 space-y-1">
                          <div className="text-xs">
                            <span className="text-red-600 dark:text-red-400">- </span>
                            <span className="line-through text-muted-foreground">
                              {change.before}
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="text-green-600 dark:text-green-400">+ </span>
                            <span>{change.after}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {Object.keys(groupedChanges).indexOf(type) < Object.keys(groupedChanges).length - 1 && (
                  <Separator className="my-3" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}