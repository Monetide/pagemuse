import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
import { canUser, WorkspaceAction, DocumentAction, PermissionContext } from '@/lib/permissions';

export const usePermissions = () => {
  const { currentWorkspace } = useWorkspaceContext();
  const { user } = useAuth();

  const checkWorkspacePermission = (action: WorkspaceAction, context?: Partial<PermissionContext>) => {
    if (!currentWorkspace || !user) return false;
    
    return canUser(action, {
      workspaceRole: currentWorkspace.role,
      isOwner: context?.isOwner,
      ...context
    });
  };

  const checkDocumentPermission = (
    action: DocumentAction, 
    documentRole?: string,
    isDocumentOwner?: boolean
  ) => {
    if (!user) return false;
    
    return canUser(action, {
      documentRole: documentRole as any,
      isDocumentOwner
    });
  };

  return {
    checkWorkspacePermission,
    checkDocumentPermission,
    canManageMembers: checkWorkspacePermission('manage_members'),
    canManageBrandKits: checkWorkspacePermission('manage_brand_kits'),
    canManageTemplates: checkWorkspacePermission('manage_templates'),
    canCreateDocuments: checkWorkspacePermission('create_documents'),
    canUploadMedia: checkWorkspacePermission('upload_media'),
    canDeleteWorkspace: checkWorkspacePermission('delete_workspace'),
    canUpdateWorkspace: checkWorkspacePermission('update_workspace'),
    currentRole: currentWorkspace?.role,
    isWorkspaceAdmin: ['owner', 'admin'].includes(currentWorkspace?.role || ''),
    isWorkspaceOwner: currentWorkspace?.role === 'owner'
  };
};