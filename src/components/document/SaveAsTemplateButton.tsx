import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useTemplateApprovalRequests } from '@/hooks/useTemplateApprovalRequests'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { SemanticDocument } from '@/lib/document-model'
import { Save, Clock, CheckCircle } from 'lucide-react'

interface SaveAsTemplateButtonProps {
  document: SemanticDocument
  className?: string
}

export function SaveAsTemplateButton({ document, className }: SaveAsTemplateButtonProps) {
  const [open, setOpen] = useState(false)
  const [proposedName, setProposedName] = useState(document.title || 'My Template')
  const [proposedCategory, setProposedCategory] = useState('General')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { createApprovalRequest } = useTemplateApprovalRequests()
  const { currentWorkspace } = useWorkspaceContext()

  const categories = [
    'General',
    'Business',
    'Report',
    'Presentation',
    'Newsletter',
    'Proposal',
    'Invoice',
    'Letter'
  ]

  const handleSubmit = async () => {
    if (!proposedName.trim() || !document.id) return

    try {
      setLoading(true)
      
      // Package the document as a template snapshot
      const packagedSnapshot = {
        title: proposedName,
        content: document.sections || [],
        metadata: document.metadata || {},
        created_at: new Date().toISOString()
      }

      await createApprovalRequest(
        document.id,
        proposedName,
        proposedCategory,
        packagedSnapshot
      )

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setProposedName(document.title || 'My Template')
        setProposedCategory('General')
      }, 2000)
    } catch (error) {
      console.error('Error submitting template request:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className={className}
      >
        <Save className="w-4 h-4 mr-2" />
        Save as Template
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              Save as Template (Request Approval)
            </DialogTitle>
            <DialogDescription>
              Request approval from workspace admins to make this document available as a template.
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-medium text-green-900 mb-1">Request Submitted!</h3>
              <p className="text-sm text-green-700">
                Your template request has been sent to workspace admins for review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={proposedName}
                  onChange={(e) => setProposedName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="template-category">Category</Label>
                <Select value={proposedCategory} onValueChange={setProposedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md bg-orange-50 border border-orange-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <p className="text-sm font-medium text-orange-900">Approval Required</p>
                </div>
                <p className="text-sm text-orange-800">
                  Your template request will be reviewed by workspace admins. You'll be notified when it's approved or if changes are needed.
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!proposedName.trim() || loading}
                >
                  {loading ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}