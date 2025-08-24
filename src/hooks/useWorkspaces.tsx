import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useWorkspaceActivity } from './useWorkspaceActivity';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  default_brand_kit_id?: string | null;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export interface WorkspaceWithRole extends Workspace {
  role: 'owner' | 'admin' | 'member';
}

export const useWorkspaces = () => {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchWorkspaces = async () => {
    if (!user) {
      setWorkspaces([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          workspace_members!inner(role)
        `)
        .eq('workspace_members.user_id', user.id);

      if (error) throw error;

      const workspacesWithRole = data.map(workspace => ({
        ...workspace,
        role: workspace.workspace_members[0]?.role || 'member'
      }));

      setWorkspaces(workspacesWithRole);
    } catch (err) {
      console.error('Error fetching workspaces:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch workspaces');
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (name: string, slug?: string) => {
    if (!user) {
      toast.error('You must be logged in to create a workspace');
      return null;
    }

    try {
      // Generate slug if not provided
      const workspaceSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
      
      // First create the workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name,
          slug: workspaceSlug,
          created_by: user.id
        })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      // Then add the creator as owner
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      // Log workspace creation activity
      await supabase
        .from('workspace_activities')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          activity_type: 'workspace_created',
          description: `Created workspace "${name}"`,
          metadata: { workspace_name: name }
        });

      await fetchWorkspaces();
      toast.success('Workspace created successfully');
      return workspace;
    } catch (err) {
      console.error('Error creating workspace:', err);
      toast.error('Failed to create workspace');
      return null;
    }
  };

  const updateWorkspace = async (workspaceId: string, updates: Partial<Pick<Workspace, 'name' | 'slug' | 'default_brand_kit_id'>>) => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .update(updates)
        .eq('id', workspaceId);

      if (error) throw error;

      // Log workspace rename activity if name changed
      if (updates.name) {
        await supabase
          .from('workspace_activities')
          .insert({
            workspace_id: workspaceId,
            user_id: user?.id,
            activity_type: 'workspace_renamed',
            description: `Renamed workspace to "${updates.name}"`,
            metadata: { new_name: updates.name }
          });
      }

      await fetchWorkspaces();
      toast.success('Workspace updated successfully');
    } catch (err) {
      console.error('Error updating workspace:', err);
      toast.error('Failed to update workspace');
    }
  };

  const deleteWorkspace = async (workspaceId: string) => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);

      if (error) throw error;

      await fetchWorkspaces();
      toast.success('Workspace deleted successfully');
    } catch (err) {
      console.error('Error deleting workspace:', err);
      toast.error('Failed to delete workspace');
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [user]);

  return {
    workspaces,
    loading,
    error,
    refetch: fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace
  };
};