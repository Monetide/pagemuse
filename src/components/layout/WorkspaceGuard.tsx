import { useEffect } from 'react';
import { useParams, Navigate, useLocation } from 'react-router-dom';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface WorkspaceGuardProps {
  children: React.ReactNode;
}

export const WorkspaceGuard = ({ children }: WorkspaceGuardProps) => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { workspaces, loading } = useWorkspaces();
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return null; // AuthGate will handle this
  }

  if (loading) {
    return (
      <div className="flex flex-col space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // If no workspaces exist, something went wrong with migration
  if (workspaces.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">No Workspaces Found</h2>
          <p className="text-muted-foreground">
            It looks like your account doesn't have any workspaces. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  // If workspaceId is provided but doesn't exist, redirect to first workspace
  if (workspaceId) {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (!workspace) {
      const firstWorkspace = workspaces.find(w => w.name === 'Personal') || workspaces[0];
      const currentPath = location.pathname.replace(`/w/${workspaceId}`, '');
      return <Navigate to={`/w/${firstWorkspace.id}${currentPath}`} replace />;
    }
  }

  return <>{children}</>;
};