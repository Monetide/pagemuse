import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWorkspaces, WorkspaceWithRole } from '@/hooks/useWorkspaces';

interface WorkspaceContextType {
  currentWorkspace: WorkspaceWithRole | null;
  setCurrentWorkspace: (workspace: WorkspaceWithRole | null) => void;
  workspaces: WorkspaceWithRole[];
  loading: boolean;
  error: string | null;
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
  const { workspaces, loading, error, refetch } = useWorkspaces();
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceWithRole | null>(null);

  // Auto-select first workspace (usually Personal) when workspaces load
  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspace) {
      const personalWorkspace = workspaces.find(w => w.name === 'Personal') || workspaces[0];
      setCurrentWorkspace(personalWorkspace);
    }
  }, [workspaces, currentWorkspace]);

  const value: WorkspaceContextType = {
    currentWorkspace,
    setCurrentWorkspace,
    workspaces,
    loading,
    error,
    refetchWorkspaces: refetch
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};