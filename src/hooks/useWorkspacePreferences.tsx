import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const LAST_WORKSPACE_KEY = 'lastWorkspaceId';

interface WorkspacePreferences {
  lastWorkspaceId: string | null;
}

export const useWorkspacePreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<WorkspacePreferences>({
    lastWorkspaceId: null
  });
  const [loading, setLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    if (!user) {
      setPreferences({ lastWorkspaceId: null });
      setLoading(false);
      return;
    }

    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    try {
      // First try to get from localStorage for immediate availability
      const localLastWorkspace = localStorage.getItem(`${LAST_WORKSPACE_KEY}_${user?.id}`);
      if (localLastWorkspace) {
        setPreferences({ lastWorkspaceId: localLastWorkspace });
      }

      // TODO: Later we can store this in the database for cross-device sync
      // For now, just use localStorage
      setLoading(false);
    } catch (error) {
      console.error('Error loading workspace preferences:', error);
      setLoading(false);
    }
  };

  const setLastWorkspace = async (workspaceId: string) => {
    if (!user) return;

    try {
      // Update local state immediately
      setPreferences(prev => ({ ...prev, lastWorkspaceId: workspaceId }));

      // Store in localStorage for persistence
      localStorage.setItem(`${LAST_WORKSPACE_KEY}_${user.id}`, workspaceId);

      // TODO: Later we can also store in the database for cross-device sync
      // await supabase
      //   .from('user_preferences')
      //   .upsert({
      //     user_id: user.id,
      //     preferences: { lastWorkspaceId: workspaceId }
      //   });
    } catch (error) {
      console.error('Error saving workspace preference:', error);
    }
  };

  const clearLastWorkspace = async () => {
    if (!user) return;

    try {
      setPreferences(prev => ({ ...prev, lastWorkspaceId: null }));
      localStorage.removeItem(`${LAST_WORKSPACE_KEY}_${user.id}`);
    } catch (error) {
      console.error('Error clearing workspace preference:', error);
    }
  };

  return {
    preferences,
    loading,
    setLastWorkspace,
    clearLastWorkspace
  };
};