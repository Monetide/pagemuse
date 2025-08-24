import { useEffect } from 'react';
import { useParams, Navigate, useLocation } from 'react-router-dom';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyWorkspaceState } from '@/components/workspace/EmptyWorkspaceState';
import { WorkspaceAccessDenied } from '@/components/workspace/WorkspaceAccessDenied';

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

  // If no workspaces exist, show bootstrap UI
  if (workspaces.length === 0) {
    return <EmptyWorkspaceState />;
  }

  // If workspaceId is provided but doesn't exist in user's workspaces, show access denied
  if (workspaceId && workspaceId !== 'redirect') {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (!workspace) {
      return <WorkspaceAccessDenied />;
    }
  }

  return <>{children}</>;
};