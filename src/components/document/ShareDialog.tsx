import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Share2, 
  Mail, 
  Link, 
  Settings, 
  Activity,
  Calendar as CalendarIcon,
  Copy,
  Eye,
  Edit,
  MessageSquare,
  Crown,
  Trash2,
  ExternalLink,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { useDocumentSharing, DocumentShare, ShareLink, DocumentActivity, DocumentRole } from '@/hooks/useDocumentSharing';
import { useToast } from '@/hooks/use-toast';

interface ShareDialogProps {
  documentId: string;
  documentTitle: string;
  children: React.ReactNode;
}

const roleIcons = {
  owner: Crown,
  editor: Edit,
  commenter: MessageSquare,
  viewer: Eye
};

const roleColors = {
  owner: 'bg-purple-500',
  editor: 'bg-blue-500',
  commenter: 'bg-green-500',
  viewer: 'bg-gray-500'
};

export const ShareDialog = ({ documentId, documentTitle, children }: ShareDialogProps) => {
  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<DocumentRole>('viewer');
  const [inviteMessage, setInviteMessage] = useState('');
  const [shares, setShares] = useState<DocumentShare[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [activities, setActivities] = useState<DocumentActivity[]>([]);
  const [linkRole, setLinkRole] = useState<DocumentRole>('viewer');
  const [linkExpires, setLinkExpires] = useState<Date>();
  const [linkPassword, setLinkPassword] = useState('');
  const [linkMaxViews, setLinkMaxViews] = useState<number>();
  const [linkAllowDownload, setLinkAllowDownload] = useState(false);
  const [linkWatermark, setLinkWatermark] = useState('');

  const { 
    loading,
    inviteUser,
    createShareLink,
    getShares,
    getShareLinks,
    getActivities,
    updateSharePermissions,
    removeShare,
    deactivateShareLink,
    publishDocument
  } = useDocumentSharing(documentId);

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const [sharesData, linksData, activitiesData] = await Promise.all([
        getShares(),
        getShareLinks(),
        getActivities()
      ]);
      setShares(sharesData);
      setShareLinks(linksData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Failed to load sharing data:', error);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    try {
      await inviteUser(inviteEmail, inviteRole, inviteMessage || undefined);
      setInviteEmail('');
      setInviteMessage('');
      loadData();
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleCreateShareLink = async () => {
    try {
      await createShareLink(linkRole, {
        expiresAt: linkExpires,
        password: linkPassword || undefined,
        maxViews: linkMaxViews,
        allowDownload: linkAllowDownload,
        watermarkText: linkWatermark || undefined
      });
      // Reset form
      setLinkRole('viewer');
      setLinkExpires(undefined);
      setLinkPassword('');
      setLinkMaxViews(undefined);
      setLinkAllowDownload(false);
      setLinkWatermark('');
      loadData();
    } catch (error) {
      // Error handled in hook
    }
  };

  const copyShareLink = (token: string) => {
    const url = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link copied',
      description: 'Share link copied to clipboard.'
    });
  };

  const handlePublish = async () => {
    try {
      const result = await publishDocument();
      toast({
        title: 'Document published',
        description: (
          <div className="flex items-center gap-2">
            <span>Public URL copied to clipboard</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(result.publishedDocument.publicUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        )
      });
      navigator.clipboard.writeText(result.publishedDocument.publicUrl);
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share "{documentTitle}"
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="invite" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="invite" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Invite
            </TabsTrigger>
            <TabsTrigger value="links" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Links
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Manage
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invite" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as DocumentRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer - Can view document</SelectItem>
                    <SelectItem value="commenter">Commenter - Can view and comment</SelectItem>
                    <SelectItem value="editor">Editor - Can view, comment, and edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Message (optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message..."
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                />
              </div>

              <Button onClick={handleInvite} disabled={loading || !inviteEmail.trim()}>
                Send Invitation
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="links" className="space-y-4">
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="font-semibold">Create Share Link</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Role</Label>
                  <Select value={linkRole} onValueChange={(value) => setLinkRole(value as DocumentRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="commenter">Commenter</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Expires</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {linkExpires ? format(linkExpires, "PPP") : "Never"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={linkExpires}
                        onSelect={setLinkExpires}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Password (optional)</Label>
                  <Input
                    type="password"
                    placeholder="Optional password"
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Max Views (optional)</Label>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={linkMaxViews || ''}
                    onChange={(e) => setLinkMaxViews(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="allow-download"
                  checked={linkAllowDownload}
                  onCheckedChange={setLinkAllowDownload}
                />
                <Label htmlFor="allow-download">Allow download</Label>
              </div>

              <div>
                <Label>Watermark text (optional)</Label>
                <Input
                  placeholder="e.g., CONFIDENTIAL"
                  value={linkWatermark}
                  onChange={(e) => setLinkWatermark(e.target.value)}
                />
              </div>

              <Button onClick={handleCreateShareLink} disabled={loading}>
                Create Share Link
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Active Share Links</h3>
              {shareLinks.map((link) => {
                const RoleIcon = roleIcons[link.role];
                return (
                  <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${roleColors[link.role]}`}>
                        <RoleIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">{link.role}</Badge>
                          {link.watermark_text && (
                            <Badge variant="secondary">Watermarked</Badge>
                          )}
                          {link.max_views && (
                            <Badge variant="outline">{link.view_count}/{link.max_views} views</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {link.expires_at 
                            ? `Expires ${format(new Date(link.expires_at), "PPP")}`
                            : "Never expires"
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyShareLink(link.token)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deactivateShareLink(link.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Document Access</h3>
                <Button onClick={handlePublish} disabled={loading}>
                  <Download className="w-4 h-4 mr-2" />
                  Publish Document
                </Button>
              </div>

              {shares.map((share) => {
                const RoleIcon = roleIcons[share.role];
                return (
                  <div key={share.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${roleColors[share.role]}`}>
                        <RoleIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {share.profile?.display_name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {share.status} • {share.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={share.role}
                        onValueChange={(value) => updateSharePermissions(share.id, value as DocumentRole)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="commenter">Commenter</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeShare(share.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">
                      {activity.profile?.display_name || 'System'}
                    </span>{' '}
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(activity.created_at), "PPP 'at' p")}
                  </p>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};