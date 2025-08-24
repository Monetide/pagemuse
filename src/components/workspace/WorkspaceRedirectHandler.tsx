import { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const WorkspaceRedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaces, loading, createWorkspace } = useWorkspaces();
  const { user } = useAuth();

  useEffect(() => {
    const handleRedirect = async () => {
      if (!user || loading) return;

      // Extract the intended path from the URL
      const path = location.pathname.replace('/w/redirect', '') || '/dashboard';

      if (workspaces.length === 0) {
        // Auto-create personal workspace
        try {
          console.log('No workspaces found, creating Personal workspace...');
          const workspace = await createWorkspace('Personal Workspace');
          if (workspace) {
            navigate(`/w/${workspace.id}${path}`, { replace: true });
            return;
          }
        } catch (error) {
          console.error('Failed to create personal workspace:', error);
          toast.error('Failed to create workspace');
          return;
        }
      }

      // Redirect to the first available workspace (preferring Personal)
      const personalWorkspace = workspaces.find(w => 
        w.name.toLowerCase().includes('personal') || w.role === 'owner'
      );
      const targetWorkspace = personalWorkspace || workspaces[0];
      
      navigate(`/w/${targetWorkspace.id}${path}`, { replace: true });
    };

    handleRedirect();
  }, [user, workspaces, loading, navigate, location.pathname, createWorkspace]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold mb-2">Setting up your workspace...</h2>
        <p className="text-muted-foreground">Please wait while we redirect you.</p>
      </div>
    </div>
  );
};