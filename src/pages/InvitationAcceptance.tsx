import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, Users, Mail } from 'lucide-react';

interface Invitation {
  id: string;
  workspace_id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  workspace: {
    name: string;
  };
}

export const InvitationAcceptance = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      loadInvitation();
    } else {
      setError('Invalid invitation link');
      setLoading(false);
    }
  }, [token]);

  const loadInvitation = async () => {
    try {
      // Use edge function to get invitation data safely
      const response = await supabase.functions.invoke('get-invitation', {
        body: { token },
      });

      if (response.error || !response.data?.invitation) {
        setError('Invitation not found or has already been used');
        return;
      }

      const data = response.data.invitation;

      // Check if invitation has expired
      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired');
        return;
      }

      setInvitation(data);
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to accept this invitation',
        variant: 'destructive',
      });
      return;
    }

    if (!token) return;

    setAccepting(true);
    try {
      const response = await supabase.functions.invoke('accept-invitation', {
        body: { token },
      });

      if (response.error) throw response.error;

      const result = response.data;
      if (result.success) {
        toast({
          title: 'Invitation accepted!',
          description: `You've joined ${invitation?.workspace.name}`,
        });
        
        // Navigate to the workspace
        navigate(`/w/${result.workspace_id}/dashboard`);
      } else {
        throw new Error(result.error || 'Failed to accept invitation');
      }
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      toast({
        title: 'Failed to accept invitation',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setAccepting(false);
    }
  };

  const declineInvitation = async () => {
    if (!token) return;

    try {
      const response = await supabase.functions.invoke('decline-invitation', {
        body: { token },
      });

      if (response.error) throw response.error;

      toast({
        title: 'Invitation declined',
        description: 'You have declined the workspace invitation',
      });

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error declining invitation:', err);
      toast({
        title: 'Failed to decline invitation',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 animate-spin" />
          <span>Loading invitation...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 max-w-md">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Invalid Invitation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="w-full mt-4"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="container mx-auto py-12 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle>Workspace Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">{invitation.workspace.name}</h3>
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{invitation.email}</span>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-secondary">
              Role: {invitation.role}
            </div>
          </div>

          {user ? (
            user.email === invitation.email ? (
              <div className="space-y-3">
                <Button 
                  onClick={acceptInvitation} 
                  disabled={accepting}
                  className="w-full"
                >
                  {accepting ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Accept Invitation
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={declineInvitation}
                  className="w-full"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Decline
                </Button>
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  This invitation was sent to {invitation.email}, but you're signed in as {user.email}. 
                  Please sign in with the correct email address to accept this invitation.
                </AlertDescription>
              </Alert>
            )
          ) : (
            <div className="space-y-3">
              <Alert>
                <AlertDescription>
                  Please sign in to accept this workspace invitation.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={() => navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
                className="w-full"
              >
                Sign In to Accept
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            This invitation expires on {new Date(invitation.expires_at).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};