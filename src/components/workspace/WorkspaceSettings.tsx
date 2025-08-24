import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { PermissionButton } from '@/components/auth/PermissionButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Users, Crown, Shield, Palette } from 'lucide-react';

export const WorkspaceSettings = () => {
  const { 
    canManageMembers, 
    canDeleteWorkspace, 
    canUpdateWorkspace,
    currentRole,
    isWorkspaceAdmin,
    isWorkspaceOwner 
  } = usePermissions();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workspace Settings</h1>
          <p className="text-muted-foreground">
            Manage your workspace settings and permissions.
          </p>
        </div>
        <Badge variant={isWorkspaceOwner ? 'default' : 'secondary'} className="capitalize">
          {isWorkspaceOwner && <Crown className="mr-1 h-3 w-3" />}
          {currentRole}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Members Management */}
        <PermissionGuard action="manage_members">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <CardTitle>Members</CardTitle>
              </div>
              <CardDescription>
                Manage workspace members and their roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionButton 
                action="manage_members" 
                className="w-full"
                onClick={() => window.location.href = `/w/${window.location.pathname.split('/')[2]}/members`}
              >
                Manage Members
              </PermissionButton>
            </CardContent>
          </Card>
        </PermissionGuard>

        {/* Brand Kits Management */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <CardTitle>Brand</CardTitle>
            </div>
            <CardDescription>
              No Brand Kits yet. Add one after workspace setup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              disabled
              variant="outline"
            >
              Manage Brand Kits (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        {/* Template Management */}
        <PermissionGuard action="manage_templates">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <CardTitle>Templates</CardTitle>
              </div>
              <CardDescription>
                Manage workspace templates and layouts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionButton action="manage_templates" className="w-full">
                Manage Templates
              </PermissionButton>
            </CardContent>
          </Card>
        </PermissionGuard>

        {/* Workspace Settings */}
        <PermissionGuard action="update_workspace">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <CardTitle>General Settings</CardTitle>
              </div>
              <CardDescription>
                Update workspace name, description, and other settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionButton action="update_workspace" className="w-full">
                Edit Workspace
              </PermissionButton>
            </CardContent>
          </Card>
        </PermissionGuard>
      </div>

      {/* Danger Zone - Only for workspace owners */}
      <PermissionGuard action="delete_workspace">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Actions in this section are irreversible. Please proceed with caution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PermissionButton 
              action="delete_workspace" 
              variant="destructive"
              className="w-full"
            >
              Delete Workspace
            </PermissionButton>
          </CardContent>
        </Card>
      </PermissionGuard>

      {/* Permission Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Reference</CardTitle>
          <CardDescription>
            What you can do with your current role.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <h4 className="font-medium">Your current permissions:</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>✓ Create and edit documents</div>
              <div>✓ Use templates</div>
              <div>✓ Apply brand kit to your documents</div>
              <div>✓ Upload media</div>
              {isWorkspaceAdmin && (
                <>
                  <div>✓ Manage workspace members</div>
                  <div>✓ Manage brand kits</div>
                  <div>✓ Manage templates</div>
                  <div>✓ Update workspace settings</div>
                </>
              )}
              {isWorkspaceOwner && (
                <div>✓ Delete workspace</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};