import { useState } from 'react'
import { Section } from '@/lib/document-model'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Trash2, 
  RotateCcw, 
  Clock, 
  Layers,
  X
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface TrashedSection {
  id: string
  section: Section
  deletedAt: Date
  originalPosition: number
  contentAction: 'delete' | 'move'
  targetSectionId?: string
}

interface TrashPanelProps {
  trashedSections: TrashedSection[]
  onRestoreSection: (trashedSection: TrashedSection) => void
  onPermanentlyDelete: (trashedSectionId: string) => void
  onEmptyTrash: () => void
}

export function TrashPanel({
  trashedSections,
  onRestoreSection,
  onPermanentlyDelete,
  onEmptyTrash
}: TrashPanelProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  
  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedItems.length === trashedSections.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(trashedSections.map(item => item.id))
    }
  }

  const getDaysRemaining = (deletedAt: Date) => {
    const expiryDate = new Date(deletedAt)
    expiryDate.setDate(expiryDate.getDate() + 30)
    const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return Math.max(0, daysLeft)
  }

  if (trashedSections.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Trash2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Trash is empty</h3>
          <p className="text-muted-foreground">
            Deleted sections will appear here and can be restored within 30 days.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Trash
            </CardTitle>
            <CardDescription>
              {trashedSections.length} section{trashedSections.length === 1 ? '' : 's'} in trash
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedItems.length === trashedSections.length ? 'Deselect All' : 'Select All'}
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={trashedSections.length === 0}
                >
                  Empty Trash
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Empty trash permanently?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {trashedSections.length} sections in trash. 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onEmptyTrash} className="bg-destructive text-destructive-foreground">
                    Delete Permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {trashedSections.map((trashedSection) => {
          const daysRemaining = getDaysRemaining(trashedSection.deletedAt)
          const isExpiringSoon = daysRemaining <= 7
          
          return (
            <div 
              key={trashedSection.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={selectedItems.includes(trashedSection.id)}
                onChange={() => handleSelectItem(trashedSection.id)}
                className="rounded"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium truncate">
                    {trashedSection.section.name}
                  </span>
                  <Badge variant={isExpiringSoon ? "destructive" : "secondary"} className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {daysRemaining} days left
                  </Badge>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Deleted {formatDistanceToNow(trashedSection.deletedAt, { addSuffix: true })} • 
                  {trashedSection.section.flows.reduce((total, flow) => total + flow.blocks.length, 0)} blocks
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRestoreSection(trashedSection)}
                  className="text-green-600 hover:text-green-700"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Restore
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{trashedSection.section.name}" and all its content. 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => onPermanentlyDelete(trashedSection.id)}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Delete Permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}