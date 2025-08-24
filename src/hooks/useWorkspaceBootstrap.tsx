import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useWorkspaceBootstrap = () => {
  const [loading, setLoading] = useState(false);

  const bootstrapWorkspace = async (): Promise<string | null> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('bootstrap-workspace');
      
      if (error) {
        console.error('Bootstrap error:', error);
        toast.error('Failed to create workspace');
        return null;
      }
      
      if (!data?.workspaceId) {
        console.error('No workspace ID returned');
        toast.error('Failed to create workspace');
        return null;
      }
      
      toast.success('Personal workspace created successfully');
      return data.workspaceId;
    } catch (err) {
      console.error('Bootstrap error:', err);
      toast.error('Failed to create workspace');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    bootstrapWorkspace,
    loading
  };
};