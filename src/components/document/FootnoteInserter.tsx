import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface FootnoteInserterProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (content: string) => void
}

export const FootnoteInserter = ({ isOpen, onClose, onInsert }: FootnoteInserterProps) => {
  const [content, setContent] = useState('')

  const handleInsert = () => {
    if (content.trim()) {
      onInsert(content.trim())
      setContent('')
      onClose()
    }
  }

  const handleCancel = () => {
    setContent('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Footnote</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="footnote-content">Footnote content</Label>
            <Textarea
              id="footnote-content"
              placeholder="Enter footnote text..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleInsert} disabled={!content.trim()}>
              Add Footnote
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}