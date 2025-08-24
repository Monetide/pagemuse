import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useWorkspaces, WorkspaceWithRole } from '@/hooks/useWorkspaces';
import { useAuth } from '@/hooks/useAuth';

interface WorkspaceContextType {
  currentWorkspace: WorkspaceWithRole | null;
  workspaces: WorkspaceWithRole[];
  loading: boolean;
  error: string | null;
  switchWorkspace: (workspaceId: string) => void;
  refetchWorkspaces: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspaceContext = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceProvider');
  }
  return context;
};

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider = ({ children }: WorkspaceProviderProps) => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { workspaces, loading, error, refetch } = useWorkspaces();
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceWithRole | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Find current workspace based on URL parameter
  useEffect(() => {
    if (workspaceId && workspaces.length > 0) {
      const workspace = workspaces.find(w => w.id === workspaceId);
      setCurrentWorkspace(workspace || null);
      
      // If workspace not found and we have workspaces, redirect to first available
      if (!workspace && workspaces.length > 0) {
        const firstWorkspace = workspaces.find(w => w.name === 'Personal') || workspaces[0];
        const currentPath = location.pathname.replace(`/w/${workspaceId}`, '');
        navigate(`/w/${firstWorkspace.id}${currentPath}`, { replace: true });
      }
    }
  }, [workspaceId, workspaces, navigate, location.pathname]);

  // Auto-redirect to workspace route if on old route format
  useEffect(() => {
    if (user && workspaces.length > 0 && !location.pathname.startsWith('/w/')) {
      // Don't redirect if on public routes
      if (location.pathname.startsWith('/shared/') || 
          location.pathname.startsWith('/published/') || 
          location.pathname.startsWith('/invite/') ||
          location.pathname === '/reset-password') {
        return;
      }

      const firstWorkspace = workspaces.find(w => w.name === 'Personal') || workspaces[0];
      const newPath = `/w/${firstWorkspace.id}${location.pathname}`;
      navigate(newPath, { replace: true });
    }
  }, [user, workspaces, location.pathname, navigate]);

  const switchWorkspace = (newWorkspaceId: string) => {
    const currentPath = location.pathname.replace(`/w/${workspaceId}`, '');
    navigate(`/w/${newWorkspaceId}${currentPath}`);
  };

  const value: WorkspaceContextType = {
    currentWorkspace,
    workspaces,
    loading,
    error,
    switchWorkspace,
    refetchWorkspaces: refetch
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};