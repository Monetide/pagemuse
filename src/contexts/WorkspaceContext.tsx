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
      setCurrentWorkspace(null);
    }
  }, [user]);

  // Main navigation logic - consolidate all workspace navigation in one effect
  useEffect(() => {
    // Don't do anything if already redirecting or still loading
    if (isRedirectingRef.current || loading || !user) {
      return;
    }

    // Don't redirect if on public routes
    if (location.pathname.startsWith('/shared/') || 
        location.pathname.startsWith('/published/') || 
        location.pathname.startsWith('/invite/') ||
        location.pathname.startsWith('/auth-debug') ||
        location.pathname.startsWith('/auth/callback') ||
        location.pathname === '/reset-password') {
      return;
    }

    const handleNavigation = async () => {
      // Case 1: No workspaces available, need to bootstrap
      if (workspaces.length === 0 && !hasBootstrappedRef.current) {
        hasBootstrappedRef.current = true;
        isRedirectingRef.current = true;
        
        try {
          const newWorkspaceId = await bootstrapWorkspace();
          if (newWorkspaceId) {
            await refetch();
            const targetPath = location.pathname.startsWith('/w/') 
              ? location.pathname.replace(/^\/w\/[^\/]+/, '') 
              : location.pathname;
            navigate(`/w/${newWorkspaceId}${targetPath}`, { replace: true });
          }
        } catch (error) {
          console.error('Bootstrap error:', error);
        } finally {
          setTimeout(() => {
            isRedirectingRef.current = false;
          }, 200);
        }
        return;
      }

      // Case 2: Have workspaces but not on workspace route
      if (workspaces.length > 0 && !location.pathname.startsWith('/w/')) {
        isRedirectingRef.current = true;
        
        const preferredWorkspace = preferences.lastWorkspaceId 
          ? workspaces.find(w => w.id === preferences.lastWorkspaceId)
          : null;
        const targetWorkspace = preferredWorkspace || 
          workspaces.find(w => w.name.includes('Personal')) || 
          workspaces[0];
        
        navigate(`/w/${targetWorkspace.id}${location.pathname}`, { replace: true });
        setTimeout(() => {
          isRedirectingRef.current = false;
        }, 200);
        return;
      }

      // Case 3: On workspace route but workspace doesn't exist
      if (workspaceId && workspaces.length > 0) {
        const workspace = workspaces.find(w => w.id === workspaceId);
        
        if (workspace) {
          // Valid workspace - set it as current and save preference
          setCurrentWorkspace(workspace);
          setLastWorkspace(workspace.id);
        } else {
          // Invalid workspace - redirect to preferred or first available
          isRedirectingRef.current = true;
          
          const preferredWorkspace = preferences.lastWorkspaceId 
            ? workspaces.find(w => w.id === preferences.lastWorkspaceId)
            : null;
          const targetWorkspace = preferredWorkspace || 
            workspaces.find(w => w.name === 'Personal') || 
            workspaces[0];
          
          const currentPath = location.pathname.replace(`/w/${workspaceId}`, '');
          navigate(`/w/${targetWorkspace.id}${currentPath}`, { replace: true });
          setTimeout(() => {
            isRedirectingRef.current = false;
          }, 200);
        }
      }
    };

    handleNavigation();
  }, [user, workspaces, loading, workspaceId, location.pathname, preferences.lastWorkspaceId])

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