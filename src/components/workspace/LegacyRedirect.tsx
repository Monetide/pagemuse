import { useEffect } from 'react';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';

export const LegacyRedirect = ({ to }: { to: string }) => {
  const { workspaces, loading } = useWorkspaces();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || loading) return;

    if (workspaces.length > 0) {
      // Redirect to the first available workspace
      const defaultWorkspace = workspaces.find(w => w.role === 'owner') || workspaces[0];
      navigate(`/w/${defaultWorkspace.id}${to}`, { replace: true });
    }
  }, [user, workspaces, loading, navigate, to]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null;
};