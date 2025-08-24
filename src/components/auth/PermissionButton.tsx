import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { WorkspaceAction } from '@/lib/permissions';

interface PermissionButtonProps {
  action: WorkspaceAction;
  children: ReactNode;
  isOwner?: boolean;
  fallback?: ReactNode;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onClick?: () => void;
  disabled?: boolean;
}

export const PermissionButton = ({
  action,
  children,
  isOwner,
  fallback = null,
  className,
  variant = 'default',
  size = 'default',
  onClick,
  disabled = false,
  ...props
}: PermissionButtonProps) => {
  const { checkWorkspacePermission } = usePermissions();
  
  const hasPermission = checkWorkspacePermission(action, { isOwner });
  
  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
};