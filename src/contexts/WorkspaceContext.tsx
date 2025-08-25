import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useWorkspaces, WorkspaceWithRole } from '@/hooks/useWorkspaces';
import { useWorkspacePreferences } from '@/hooks/useWorkspacePreferences';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaceBootstrap } from '@/hooks/useWorkspaceBootstrap';

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
  const { preferences, setLastWorkspace } = useWorkspacePreferences();
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceWithRole | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { bootstrapWorkspace } = useWorkspaceBootstrap();
  const isRedirectingRef = useRef(false);
  const hasBootstrappedRef = useRef(false);

  // Reset flags when user changes
  useEffect(() => {
    if (!user) {
      isRedirectingRef.current = false;
      hasBootstrappedRef.current = false;
    }
  }, [user]);

  // Find current workspace based on URL parameter
  useEffect(() => {
    if (workspaceId && workspaces.length > 0 && !isRedirectingRef.current) {
      const workspace = workspaces.find(w => w.id === workspaceId);
      setCurrentWorkspace(workspace || null);
      
      // Save as last used workspace
      if (workspace) {
        setLastWorkspace(workspace.id);
      }
      
      // If workspace not found and we have workspaces, redirect to preferred or first available
      if (!workspace && workspaces.length > 0) {
        isRedirectingRef.current = true;
        const preferredWorkspace = preferences.lastWorkspaceId 
          ? workspaces.find(w => w.id === preferences.lastWorkspaceId)
          : null;
        const targetWorkspace = preferredWorkspace || workspaces.find(w => w.name === 'Personal') || workspaces[0];
        const currentPath = location.pathname.replace(`/w/${workspaceId}`, '');
        navigate(`/w/${targetWorkspace.id}${currentPath}`, { replace: true });
        // Reset flag after navigation
        setTimeout(() => {
          isRedirectingRef.current = false;
        }, 100);
      }
    }
  }, [workspaceId, workspaces, preferences.lastWorkspaceId, setLastWorkspace]);

  // Auto-redirect to workspace route if on old route format and bootstrap if needed
  useEffect(() => {
    if (user && !loading && !location.pathname.startsWith('/w/') && !isRedirectingRef.current) {
      // Don't redirect if on public routes
      if (location.pathname.startsWith('/shared/') || 
          location.pathname.startsWith('/published/') || 
          location.pathname.startsWith('/invite/') ||
          location.pathname === '/reset-password') {
        return;
      }

      // If no workspaces, bootstrap (but only once)
      if (workspaces.length === 0 && !hasBootstrappedRef.current) {
        hasBootstrappedRef.current = true;
        isRedirectingRef.current = true;
        bootstrapWorkspace().then((workspaceId) => {
          if (workspaceId) {
            refetch().then(() => {
              navigate(`/w/${workspaceId}${location.pathname}`, { replace: true });
              setTimeout(() => {
                isRedirectingRef.current = false;
              }, 100);
            });
          } else {
            isRedirectingRef.current = false;
          }
        });
        return;
      }

      // Use preferred workspace if available, otherwise fall back to Personal or first
      if (workspaces.length > 0) {
        isRedirectingRef.current = true;
        const preferredWorkspace = preferences.lastWorkspaceId 
          ? workspaces.find(w => w.id === preferences.lastWorkspaceId)
          : null;
        const targetWorkspace = preferredWorkspace || workspaces.find(w => w.name.includes('Personal')) || workspaces[0];
        const newPath = `/w/${targetWorkspace.id}${location.pathname}`;
        navigate(newPath, { replace: true });
        setTimeout(() => {
          isRedirectingRef.current = false;
        }, 100);
      }
    }
  }, [user, workspaces, loading, preferences.lastWorkspaceId]);

  const switchWorkspace = (newWorkspaceId: string) => {
    if (!isRedirectingRef.current) {
      isRedirectingRef.current = true;
      const currentPath = location.pathname.replace(`/w/${workspaceId}`, '');
      setLastWorkspace(newWorkspaceId); // Persist the selection
      navigate(`/w/${newWorkspaceId}${currentPath}`);
      setTimeout(() => {
        isRedirectingRef.current = false;
      }, 100);
    }
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