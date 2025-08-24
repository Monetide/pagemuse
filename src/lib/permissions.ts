export type WorkspaceRole = 'owner' | 'admin' | 'member';
export type DocumentRole = 'owner' | 'editor' | 'commenter' | 'viewer';

export type WorkspaceAction = 
  | 'manage_members'
  | 'manage_brand_kits'
  | 'manage_templates'
  | 'create_documents'
  | 'edit_documents'
  | 'use_templates'
  | 'apply_brand_kit'
  | 'upload_media'
  | 'manage_media'
  | 'delete_workspace'
  | 'update_workspace';

export type DocumentAction = 
  | 'view'
  | 'edit'
  | 'comment'
  | 'share'
  | 'delete'
  | 'export';

export interface PermissionContext {
  workspaceRole?: WorkspaceRole;
  documentRole?: DocumentRole;
  isOwner?: boolean;
  isDocumentOwner?: boolean;
}

export const canUser = (
  action: WorkspaceAction | DocumentAction, 
  context: PermissionContext
): boolean => {
  const { workspaceRole, documentRole, isOwner, isDocumentOwner } = context;

  // Document-specific permissions
  if (['view', 'edit', 'comment', 'share', 'delete', 'export'].includes(action as DocumentAction)) {
    const docAction = action as DocumentAction;
    
    // Document owner can do everything
    if (isDocumentOwner) return true;
    
    // Check document role hierarchy
    switch (docAction) {
      case 'view':
        return ['viewer', 'commenter', 'editor', 'owner'].includes(documentRole || '');
      case 'comment':
        return ['commenter', 'editor', 'owner'].includes(documentRole || '');
      case 'edit':
        return ['editor', 'owner'].includes(documentRole || '');
      case 'share':
      case 'delete':
      case 'export':
        return documentRole === 'owner';
      default:
        return false;
    }
  }

  // Workspace-specific permissions
  const wsAction = action as WorkspaceAction;
  
  switch (wsAction) {
    // Owner/Admin only actions
    case 'manage_members':
    case 'manage_brand_kits':
    case 'manage_templates':
    case 'delete_workspace':
    case 'update_workspace':
      return ['owner', 'admin'].includes(workspaceRole || '');
    
    // All workspace members can do these
    case 'create_documents':
    case 'edit_documents':
    case 'use_templates':
    case 'apply_brand_kit':
    case 'upload_media':
      return ['owner', 'admin', 'member'].includes(workspaceRole || '');
    
    // Media management (owner of media can manage, admins can manage all)
    case 'manage_media':
      return isOwner || ['owner', 'admin'].includes(workspaceRole || '');
    
    default:
      return false;
  }
};

// Permission checking hooks
export const useWorkspacePermissions = (workspaceRole?: WorkspaceRole) => {
  return {
    canManageMembers: canUser('manage_members', { workspaceRole }),
    canManageBrandKits: canUser('manage_brand_kits', { workspaceRole }),
    canManageTemplates: canUser('manage_templates', { workspaceRole }),
    canCreateDocuments: canUser('create_documents', { workspaceRole }),
    canUploadMedia: canUser('upload_media', { workspaceRole }),
    canDeleteWorkspace: canUser('delete_workspace', { workspaceRole }),
    canUpdateWorkspace: canUser('update_workspace', { workspaceRole }),
  };
};

export const useDocumentPermissions = (
  documentRole?: DocumentRole, 
  isDocumentOwner?: boolean
) => {
  return {
    canView: canUser('view', { documentRole, isDocumentOwner }),
    canEdit: canUser('edit', { documentRole, isDocumentOwner }),
    canComment: canUser('comment', { documentRole, isDocumentOwner }),
    canShare: canUser('share', { documentRole, isDocumentOwner }),
    canDelete: canUser('delete', { documentRole, isDocumentOwner }),
    canExport: canUser('export', { documentRole, isDocumentOwner }),
  };
};