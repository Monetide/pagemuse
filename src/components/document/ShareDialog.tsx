import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Share, 
  Users, 
  Link2, 
  Copy, 
  Send, 
  Eye, 
  Edit, 
  MessageSquare, 
  Shield,
  Clock,
  Mail,
  Trash2
} from 'lucide-react'
import { SemanticDocument } from '@/lib/document-model'
import { useDocumentSharing, DocumentRole } from '@/hooks/useDocumentSharing'
import { useToast } from '@/hooks/use-toast'

interface ShareDialogProps {
  document: SemanticDocument
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ShareDialog = ({
  document,
  open,
  onOpenChange
}: ShareDialogProps) => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<DocumentRole>('viewer')
  const [message, setMessage] = useState('')
  const [shares, setShares] = useState<any[]>([])
  const [shareLinks, setShareLinks] = useState<any[]>([])
  
  const { inviteUser, createShareLink, getShares, getShareLinks, updateSharePermissions, removeShare, loading } = useDocumentSharing(document.id)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadShares()
      loadShareLinks()
    }
  }, [open])

  const loadShares = async () => {
    try {
      const data = await getShares()
      setShares(data)
    } catch (error) {
      console.error('Failed to load shares:', error)
    }
  }

  const loadShareLinks = async () => {
    try {
      const data = await getShareLinks()
      setShareLinks(data)
    } catch (error) {
      console.error('Failed to load share links:', error)
    }
  }

  const handleInvite = async () => {
    if (!email.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address',
        variant: 'destructive'
      })
      return
    }

    try {
      await inviteUser(email.trim(), role, message.trim() || undefined)
      setEmail('')
      setMessage('')
      loadShares()
    } catch (error) {
      // Error handling done in the hook
    }
  }

  const handleCreateLink = async () => {
    try {
      await createShareLink(role, {
        allowDownload: true
      })
      loadShareLinks()
    } catch (error) {
      // Error handling done in the hook
    }
  }

  const copyShareLink = async (token: string) => {
    const url = `${window.location.origin}/shared/${token}`
    await navigator.clipboard.writeText(url)
    toast({
      title: 'Link copied',
      description: 'Share link copied to clipboard'
    })
  }

  const getRoleIcon = (role: DocumentRole) => {
    switch (role) {
      case 'owner': return Shield
      case 'editor': return Edit
      case 'commenter': return MessageSquare
      case 'viewer': return Eye
      default: return Eye
    }
  }

  const getRoleColor = (role: DocumentRole) => {
    switch (role) {
      case 'owner': return 'text-red-600'
      case 'editor': return 'text-blue-600'
      case 'commenter': return 'text-yellow-600'
      case 'viewer': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Share className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Share Document</DialogTitle>
              <DialogDescription>
                Invite collaborators or create shareable links for "{document.title}"
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="invite" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invite" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Invite People
            </TabsTrigger>
            <TabsTrigger value="links" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Share Links
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invite" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Send Invitation</CardTitle>
                <CardDescription>
                  Invite people to collaborate on this document
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(value: DocumentRole) => setRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer - Can view only</SelectItem>
                      <SelectItem value="commenter">Commenter - Can view and comment</SelectItem>
                      <SelectItem value="editor">Editor - Can view and edit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Input
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a personal message..."
                  />
                </div>

                <Button 
                  onClick={handleInvite} 
                  disabled={loading || !email.trim()}
                  className="w-full flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Invitation
                </Button>
              </CardContent>
            </Card>

            {/* Current Collaborators */}
            {shares.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Collaborators ({shares.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {shares.map((share) => {
                        const RoleIcon = getRoleIcon(share.role)
                        return (
                          <div key={share.id} className="flex items-center justify-between p-2 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <RoleIcon className={`w-4 h-4 ${getRoleColor(share.role)}`} />
                              <div>
                                <p className="font-medium">{share.profile?.display_name || 'Unknown User'}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {share.role} • {share.status}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {share.role}
                              </Badge>
                              {share.role !== 'owner' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeShare(share.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="links" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Create Share Link</CardTitle>
                <CardDescription>
                  Generate a link that anyone can use to access this document
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Access Level</Label>
                  <Select value={role} onValueChange={(value: DocumentRole) => setRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer - Can view only</SelectItem>
                      <SelectItem value="commenter">Commenter - Can view and comment</SelectItem>
                      <SelectItem value="editor">Editor - Can view and edit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleCreateLink}
                  disabled={loading}
                  className="w-full flex items-center gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  Create Share Link
                </Button>
              </CardContent>
            </Card>

            {/* Active Share Links */}
            {shareLinks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Active Links ({shareLinks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {shareLinks.map((link) => (
                      <div key={link.id} className="p-3 rounded-lg border bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {link.role}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {link.view_count} views
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyShareLink(link.token)}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Created {new Date(link.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}