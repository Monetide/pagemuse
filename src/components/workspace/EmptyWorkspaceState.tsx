import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, RefreshCw } from 'lucide-react';
import { useWorkspaceBootstrap } from '@/hooks/useWorkspaceBootstrap';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { useNavigate } from 'react-router-dom';

export const EmptyWorkspaceState = () => {
  const { bootstrapWorkspace, loading } = useWorkspaceBootstrap();
  const { refetchWorkspaces } = useWorkspaceContext();
  const navigate = useNavigate();

  const handleCreateWorkspace = async () => {
    const workspaceId = await bootstrapWorkspace();
    if (workspaceId) {
      await refetchWorkspaces();
      navigate(`/w/${workspaceId}/dashboard`);
    }
  };

  const handleRefresh = () => {
    refetchWorkspaces();
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>No workspaces yet</CardTitle>
          <CardDescription>
            Create your first workspace to get started with organizing your documents and projects.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleCreateWorkspace} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            {loading ? 'Creating...' : 'Create your first workspace'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};