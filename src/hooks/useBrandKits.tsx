import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { useAuth } from './useAuth';
import { useWorkspaceActivity } from './useWorkspaceActivity';
import { toast } from 'sonner';
import type { 
  BrandKit, 
  BrandKitMap, 
  KitApplication, 
  CreateBrandKitData, 
  UpdateBrandKitData,
  CreateKitApplicationData 
} from '@/types/brandKit';

export const useBrandKits = () => {
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentWorkspace } = useWorkspaceContext();
  const { user } = useAuth();
  const { logActivity } = useWorkspaceActivity();

  const fetchBrandKits = async () => {
    if (!currentWorkspace) {
      setBrandKits([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBrandKits((data || []) as unknown as BrandKit[]);
    } catch (err) {
      console.error('Error fetching brand kits:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch brand kits');
    } finally {
      setLoading(false);
    }
  };

  const createBrandKit = async (data: CreateBrandKitData): Promise<BrandKit | null> => {
    if (!currentWorkspace || !user) {
      toast.error('No workspace or user available');
      return null;
    }

    try {
      const { data: brandKit, error } = await supabase
        .from('brand_kits')
        .insert({
          workspace_id: currentWorkspace.id,
          created_by: user.id,
          name: data.name,
          logo_primary_url: data.logo_primary_url,
          logo_alt_url: data.logo_alt_url,
          palette: data.palette as any,
          neutrals: data.neutrals as any,
          fonts: data.fonts as any
        })
        .select()
        .single();

      if (error) throw error;

      // Generate brand kit maps
      const brandKitData = brandKit as unknown as BrandKit;
      await generateBrandKitMaps(brandKitData.id, {
        ...brandKitData.palette,
        ...brandKitData.neutrals
      });

      // Log activity
      await logActivity(
        'brand_kit_created',
        `Created brand kit "${brandKitData.name}"`,
        {
          brand_kit_id: brandKitData.id,
          palette: brandKitData.palette,
          neutrals: brandKitData.neutrals,
          tokens_generated: Object.keys({...brandKitData.palette, ...brandKitData.neutrals}).length
        }
      );

      await fetchBrandKits();
      toast.success('Brand kit created successfully');
      return brandKitData;
    } catch (err) {
      console.error('Error creating brand kit:', err);
      toast.error('Failed to create brand kit');
      return null;
    }
  };

  const updateBrandKit = async (id: string, data: UpdateBrandKitData): Promise<BrandKit | null> => {
    try {
      // Get the original brand kit for diff
      const { data: originalBrandKit } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('id', id)
        .single();

      const updatePayload: any = {};
      if (data.name) updatePayload.name = data.name;
      if (data.logo_primary_url !== undefined) updatePayload.logo_primary_url = data.logo_primary_url;
      if (data.logo_alt_url !== undefined) updatePayload.logo_alt_url = data.logo_alt_url;
      if (data.palette) updatePayload.palette = data.palette;
      if (data.neutrals) updatePayload.neutrals = data.neutrals;
      if (data.fonts !== undefined) updatePayload.fonts = data.fonts;

      const { data: brandKit, error } = await supabase
        .from('brand_kits')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Regenerate brand kit maps if palette or neutrals changed
      if (data.palette || data.neutrals) {
        const { data: currentBrandKit } = await supabase
          .from('brand_kits')
          .select('palette, neutrals')
          .eq('id', id)
          .single();

        if (currentBrandKit) {
          const brandKitData = currentBrandKit as any;
          await generateBrandKitMaps(id, {
            ...brandKitData.palette,
            ...brandKitData.neutrals
          });
        }
      }

      // Log activity with diff
      const diff = generateBrandKitDiff(originalBrandKit, brandKit as any);
      await logActivity(
        'brand_kit_updated',
        `Updated brand kit "${brandKit.name || originalBrandKit?.name}"`,
        {
          brand_kit_id: id,
          changes: updatePayload,
          diff,
          tokens_updated: (data.palette || data.neutrals) ? Object.keys({...(data.palette || {}), ...(data.neutrals || {})}).length : 0
        }
      );

      await fetchBrandKits();
      toast.success('Brand kit updated successfully');
      return brandKit as unknown as BrandKit;
    } catch (err) {
      console.error('Error updating brand kit:', err);
      toast.error('Failed to update brand kit');
      return null;
    }
  };

  const deleteBrandKit = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('brand_kits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchBrandKits();
      toast.success('Brand kit deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting brand kit:', err);
      toast.error('Failed to delete brand kit');
      return false;
    }
  };

  const generateBrandKitMaps = async (brandKitId: string, tokens: Record<string, string>) => {
    try {
      // Delete existing maps
      await supabase
        .from('brand_kit_maps')
        .delete()
        .eq('brand_kit_id', brandKitId);

      // Create new maps
      const maps = Object.entries(tokens).map(([tokenName, hex]) => ({
        brand_kit_id: brandKitId,
        token_name: tokenName,
        hex
      }));

      const { error } = await supabase
        .from('brand_kit_maps')
        .insert(maps);

      if (error) throw error;
    } catch (err) {
      console.error('Error generating brand kit maps:', err);
    }
  };

  useEffect(() => {
    fetchBrandKits();
  }, [currentWorkspace]);

  return {
    brandKits,
    loading,
    error,
    createBrandKit,
    updateBrandKit,
    deleteBrandKit,
    refetch: fetchBrandKits
  };
};

export const useBrandKitMaps = (brandKitId?: string) => {
  const [maps, setMaps] = useState<BrandKitMap[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMaps = async () => {
    if (!brandKitId) {
      setMaps([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brand_kit_maps')
        .select('*')
        .eq('brand_kit_id', brandKitId)
        .order('token_name');

      if (error) throw error;
      setMaps(data || []);
    } catch (err) {
      console.error('Error fetching brand kit maps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaps();
  }, [brandKitId]);

  return { maps, loading, refetch: fetchMaps };
};

export const useKitApplications = () => {
  const [applications, setApplications] = useState<KitApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { logActivity } = useWorkspaceActivity();

  const fetchApplications = async (targetType?: 'template' | 'document', targetId?: string) => {
    try {
      setLoading(true);
      let query = supabase.from('kit_applications').select('*');
      
      if (targetType) {
        query = query.eq('target_type', targetType);
      }
      if (targetId) {
        query = query.eq('target_id', targetId);
      }

      const { data, error } = await query.order('applied_at', { ascending: false });

      if (error) throw error;
      setApplications((data || []) as unknown as KitApplication[]);
    } catch (err) {
      console.error('Error fetching kit applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyBrandKit = async (data: CreateKitApplicationData): Promise<KitApplication | null> => {
    if (!user) {
      toast.error('User not authenticated');
      return null;
    }

    try {
      // Get current brand kit data for snapshot
      const { data: brandKit, error: brandKitError } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('id', data.brand_kit_id)
        .single();

      if (brandKitError) throw brandKitError;

      const { data: application, error } = await supabase
        .from('kit_applications')
        .insert({
          ...data,
          applied_by: user.id,
          snapshot: brandKit
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await logActivity(
        'brand_kit_applied',
        `Applied brand kit "${brandKit.name}" to ${data.target_type}`,
        {
          brand_kit_id: data.brand_kit_id,
          target_type: data.target_type,
          target_id: data.target_id,
          follow_updates: data.follow_updates,
          brand_kit_name: brandKit.name,
          snapshot_created: true
        }
      );

      toast.success('Brand kit applied successfully');
      return application as unknown as KitApplication;
    } catch (err) {
      console.error('Error applying brand kit:', err);
      toast.error('Failed to apply brand kit');
      return null;
    }
  };

  const removeApplication = async (id: string): Promise<boolean> => {
    try {
      // Get application details before deletion
      const { data: applicationData } = await supabase
        .from('kit_applications')
        .select('*, brand_kits(name)')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('kit_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log activity
      if (applicationData) {
        await logActivity(
          'brand_kit_rollback',
          `Rolled back brand kit "${applicationData.brand_kits?.name || 'Unknown'}" from ${applicationData.target_type}`,
          {
            brand_kit_id: applicationData.brand_kit_id,
            target_type: applicationData.target_type,
            target_id: applicationData.target_id,
            application_id: id,
            originally_applied: applicationData.applied_at
          }
        );
      }

      toast.success('Brand kit application removed');
      return true;
    } catch (err) {
      console.error('Error removing application:', err);
      toast.error('Failed to remove application');
      return false;
    }
  };

  return {
    applications,
    loading,
    fetchApplications,
    applyBrandKit,
    removeApplication
  };
};

// Helper function to generate diff between brand kit versions
const generateBrandKitDiff = (before: any, after: any) => {
  const diff: any = {};
  
  // Compare palette colors
  if (before?.palette && after?.palette) {
    const paletteChanges: any = {};
    Object.keys({...before.palette, ...after.palette}).forEach(key => {
      if (before.palette[key] !== after.palette[key]) {
        paletteChanges[key] = {
          before: before.palette[key],
          after: after.palette[key]
        };
      }
    });
    if (Object.keys(paletteChanges).length > 0) {
      diff.palette = paletteChanges;
    }
  }

  // Compare neutral colors
  if (before?.neutrals && after?.neutrals) {
    const neutralsChanges: any = {};
    Object.keys({...before.neutrals, ...after.neutrals}).forEach(key => {
      if (before.neutrals[key] !== after.neutrals[key]) {
        neutralsChanges[key] = {
          before: before.neutrals[key],
          after: after.neutrals[key]
        };
      }
    });
    if (Object.keys(neutralsChanges).length > 0) {
      diff.neutrals = neutralsChanges;
    }
  }

  // Compare other fields
  ['name', 'logo_primary_url', 'logo_alt_url', 'fonts'].forEach(field => {
    if (before?.[field] !== after?.[field]) {
      diff[field] = {
        before: before?.[field],
        after: after?.[field]
      };
    }
  });

  return diff;
};