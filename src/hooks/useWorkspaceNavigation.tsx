import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';

export const useWorkspaceNavigation = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const location = useLocation();
  const { switchWorkspace } = useWorkspaceContext();

  const navigateWithinWorkspace = (path: string) => {
    if (!workspaceId) return;
    navigate(`/w/${workspaceId}${path}`);
  };

  const navigateToWorkspace = (newWorkspaceId: string, path: string = '/dashboard') => {
    navigate(`/w/${newWorkspaceId}${path}`);
  };

  const getCurrentWorkspacePath = () => {
    if (!workspaceId) return '';
    return location.pathname.replace(`/w/${workspaceId}`, '') || '/dashboard';
  };

  const switchToWorkspace = (newWorkspaceId: string) => {
    const currentPath = getCurrentWorkspacePath();
    switchWorkspace(newWorkspaceId);
  };

  return {
    navigateWithinWorkspace,
    navigateToWorkspace,
    switchToWorkspace,
    getCurrentWorkspacePath,
    currentWorkspaceId: workspaceId
  };
};