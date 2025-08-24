import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { AlertTriangle, Users } from 'lucide-react';
import { useParams } from 'react-router-dom';

export const WorkspaceAccessDenied = () => {
  const { workspaceId } = useParams();
  const { workspaces } = useWorkspaces();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle>Not in this workspace</CardTitle>
          <CardDescription>
            You don't have access to this workspace or it doesn't exist.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Switch to one of your workspaces to continue:
            </p>
            <div className="flex justify-center">
              <WorkspaceSwitcher />
            </div>
          </div>

          {workspaces.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Your workspaces:</h4>
              <div className="space-y-2">
                {workspaces.slice(0, 3).map((workspace) => (
                  <div key={workspace.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{workspace.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {workspace.role}
                    </Badge>
                  </div>
                ))}
                {workspaces.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{workspaces.length - 3} more workspaces
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="text-center text-xs text-muted-foreground">
            Workspace ID: <code className="bg-muted px-1 rounded">{workspaceId}</code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};