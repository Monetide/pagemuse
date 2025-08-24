import { supabase } from '@/integrations/supabase/client';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';

export const useWorkspaceActivity = () => {
  const { currentWorkspace } = useWorkspaceContext();

  const logActivity = async (
    activityType: string,
    description: string,
    metadata: any = {}
  ) => {
    if (!currentWorkspace) return;

    try {
      const { error } = await supabase
        .from('workspace_activities')
        .insert({
          workspace_id: currentWorkspace.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          activity_type: activityType,
          description,
          metadata
        });

      if (error) {
        console.error('Error logging activity:', error);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  return { logActivity };
};