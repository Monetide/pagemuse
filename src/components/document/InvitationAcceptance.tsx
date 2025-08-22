import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Invitation {
  id: string;
  document_id: string;
  email: string;
  role: string;
  expires_at: string;
  accepted_at?: string;
  invited_by_user_id: string;
  document: {
    title: string;
  };
  inviter_profile?: {
    display_name?: string;
  };
}

export const InvitationAcceptance = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token]);

  const loadInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('document_invitations')
        .select(`
          *,
          document:documents(title),
          inviter_profile:profiles!document_invitations_invited_by_user_id_fkey(display_name)
        `)
        .eq('token', token)
        .single();

      if (error) {
        setError('Invitation not found or expired');
        return;
      }

      // Check if invitation has expired
      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired');
        return;
      }

      setInvitation(data as any);
    } catch (err) {
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!invitation || !user) return;

    setAccepting(true);
    try {
      // Check if user email matches invitation email
      if (user.email !== invitation.email) {
        toast({
          title: 'Email mismatch',
          description: 'You must be logged in with the invited email address',
          variant: 'destructive'
        });
        return;
      }

      // Update invitation as accepted
      const { error: inviteError } = await supabase
        .from('document_invitations')
        .update({
          accepted_at: new Date().toISOString(),
          accepted_by_user_id: user.id
        })
        .eq('id', invitation.id);

      if (inviteError) throw inviteError;

      // Create document share
      const { error: shareError } = await supabase
        .from('document_shares')
        .insert({
          document_id: invitation.document_id,
          shared_with_user_id: user.id,
          shared_by_user_id: invitation.invited_by_user_id,
          role: invitation.role as any,
          status: 'accepted'
        });

      if (shareError && !shareError.message.includes('duplicate')) {
        throw shareError;
      }

      // Log activity
      await supabase.rpc('log_document_activity', {
        _document_id: invitation.document_id,
        _user_id: user.id,
        _activity_type: 'invitation_accepted',
        _description: `${user.email} accepted invitation as ${invitation.role}`,
        _metadata: { invitation_id: invitation.id }
      });

      toast({
        title: 'Invitation accepted',
        description: 'You now have access to the document'
      });

      // Navigate to document
      navigate(`/documents/${invitation.document_id}/editor`);
    } catch (err: any) {
      toast({
        title: 'Failed to accept invitation',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setAccepting(false);
    }
  };

  const declineInvitation = async () => {
    if (!invitation) return;

    try {
      await supabase
        .from('document_invitations')
        .delete()
        .eq('id', invitation.id);

      toast({
        title: 'Invitation declined',
        description: 'The invitation has been declined'
      });

      navigate('/');
    } catch (err: any) {
      toast({
        title: 'Failed to decline invitation',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) return null;

  const isExpired = new Date(invitation.expires_at) < new Date();
  const isAccepted = !!invitation.accepted_at;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">
            {isAccepted ? 'Invitation Accepted' : 'Document Invitation'}
          </CardTitle>
          <CardDescription>
            {invitation.inviter_profile?.display_name || 'Someone'} invited you to collaborate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{invitation.document.title}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {invitation.role}
              </Badge>
              {isExpired && (
                <Badge variant="destructive">
                  <Clock className="w-3 h-3 mr-1" />
                  Expired
                </Badge>
              )}
              {isAccepted && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Accepted
                </Badge>
              )}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p><strong>Role:</strong> {invitation.role}</p>
            <p><strong>Invited to:</strong> {invitation.email}</p>
            <p><strong>Expires:</strong> {new Date(invitation.expires_at).toLocaleDateString()}</p>
          </div>

          {!user && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 text-sm">
                You need to be logged in to accept this invitation.
              </p>
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full mt-2"
                variant="outline"
              >
                Sign In / Sign Up
              </Button>
            </div>
          )}

          {user && !isExpired && !isAccepted && (
            <div className="flex gap-2">
              <Button 
                onClick={acceptInvitation} 
                disabled={accepting}
                className="flex-1"
              >
                {accepting ? 'Accepting...' : 'Accept Invitation'}
              </Button>
              <Button 
                onClick={declineInvitation} 
                variant="outline"
                className="flex-1"
              >
                Decline
              </Button>
            </div>
          )}

          {isAccepted && (
            <Button 
              onClick={() => navigate(`/documents/${invitation.document_id}/editor`)}
              className="w-full"
            >
              Open Document
            </Button>
          )}

          {isExpired && (
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Go Home
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};