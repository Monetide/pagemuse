import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Camera } from 'lucide-react'

interface SnapshotCreatorProps {
  onCreateSnapshot: (name: string, description?: string) => Promise<void>
  disabled?: boolean
}

export const SnapshotCreator = ({ onCreateSnapshot, disabled }: SnapshotCreatorProps) => {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return

    setCreating(true)
    try {
      await onCreateSnapshot(name.trim(), description.trim() || undefined)
      setOpen(false)
      setName('')
      setDescription('')
    } finally {
      setCreating(false)
    }
  }

  const handleCancel = () => {
    setOpen(false)
    setName('')
    setDescription('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Camera className="h-4 w-4 mr-2" />
          Create Snapshot
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Named Snapshot</DialogTitle>
          <DialogDescription>
            Create a named snapshot of your document that you can easily find and revert to later.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="snapshot-name">Snapshot Name</Label>
            <Input
              id="snapshot-name"
              placeholder="e.g. Final draft, Before review, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) {
                  e.preventDefault()
                  handleCreate()
                }
              }}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="snapshot-description">Description (Optional)</Label>
            <Textarea
              id="snapshot-description"
              placeholder="Add notes about what's in this snapshot..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!name.trim() || creating}
          >
            {creating ? 'Creating...' : 'Create Snapshot'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}