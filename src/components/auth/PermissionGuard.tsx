import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { WorkspaceAction, DocumentAction } from '@/lib/permissions';

interface PermissionGuardProps {
  children: ReactNode;
  action: WorkspaceAction | DocumentAction;
  fallback?: ReactNode;
  // For workspace actions
  isOwner?: boolean;
  // For document actions  
  documentRole?: string;
  isDocumentOwner?: boolean;
}

export const PermissionGuard = ({ 
  children, 
  action, 
  fallback = null,
  isOwner,
  documentRole,
  isDocumentOwner
}: PermissionGuardProps) => {
  const { checkWorkspacePermission, checkDocumentPermission } = usePermissions();

  // Check if this is a document action
  const isDocumentAction = ['view', 'edit', 'comment', 'share', 'delete', 'export'].includes(action);
  
  const hasPermission = isDocumentAction 
    ? checkDocumentPermission(action as DocumentAction, documentRole, isDocumentOwner)
    : checkWorkspacePermission(action as WorkspaceAction, { isOwner });

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};