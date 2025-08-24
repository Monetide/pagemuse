import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspaceActivity } from './useWorkspaceActivity';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { BrandKit } from '@/types/brandKit';

interface BulkApplicationTarget {
  id: string;
  type: 'template' | 'document';
  name: string;
}

interface BulkApplicationResult {
  target: BulkApplicationTarget;
  success: boolean;
  error?: string;
}

export const useBulkBrandKitApplication = () => {
  const [loading, setLoading] = useState(false);
  const { logActivity } = useWorkspaceActivity();
  const { user } = useAuth();

  const bulkApplyBrandKit = async (
    brandKit: BrandKit,
    targets: BulkApplicationTarget[],
    followUpdates: boolean = true
  ): Promise<BulkApplicationResult[]> => {
    if (!user) {
      toast.error('User not authenticated');
      return [];
    }

    setLoading(true);
    const results: BulkApplicationResult[] = [];

    try {
      // Apply brand kit to each target
      for (const target of targets) {
        try {
          const { error } = await supabase
            .from('kit_applications')
            .upsert({
              target_type: target.type,
              target_id: target.id,
              brand_kit_id: brandKit.id,
              follow_updates: followUpdates,
              applied_by: user.id,
              snapshot: brandKit as any
            }, {
              onConflict: 'target_type,target_id',
              ignoreDuplicates: false
            });

          if (error) throw error;

          results.push({
            target,
            success: true
          });
        } catch (error) {
          console.error(`Failed to apply brand kit to ${target.type} ${target.id}:`, error);
          results.push({
            target,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Log bulk application activity
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      await logActivity(
        'brand_kit_bulk_apply',
        `Bulk applied brand kit "${brandKit.name}" to ${successful.length} items`,
        {
          brand_kit_id: brandKit.id,
          brand_kit_name: brandKit.name,
          targets_total: targets.length,
          targets_successful: successful.length,
          targets_failed: failed.length,
          follow_updates: followUpdates,
          successful_targets: successful.map(r => ({
            type: r.target.type,
            id: r.target.id,
            name: r.target.name
          })),
          failed_targets: failed.map(r => ({
            type: r.target.type,
            id: r.target.id,
            name: r.target.name,
            error: r.error
          }))
        }
      );

      if (successful.length > 0) {
        toast.success(`Successfully applied brand kit to ${successful.length} item${successful.length > 1 ? 's' : ''}`);
      }

      if (failed.length > 0) {
        toast.error(`Failed to apply brand kit to ${failed.length} item${failed.length > 1 ? 's' : ''}`);
      }

      return results;
    } catch (error) {
      console.error('Bulk application error:', error);
      toast.error('Failed to bulk apply brand kit');
      return results;
    } finally {
      setLoading(false);
    }
  };

  const bulkRemoveBrandKit = async (targets: BulkApplicationTarget[]): Promise<BulkApplicationResult[]> => {
    setLoading(true);
    const results: BulkApplicationResult[] = [];

    try {
      for (const target of targets) {
        try {
          // Get application details before deletion for logging
          const { data: applicationData } = await supabase
            .from('kit_applications')
            .select('*, brand_kits(name)')
            .eq('target_type', target.type)
            .eq('target_id', target.id)
            .single();

          const { error } = await supabase
            .from('kit_applications')
            .delete()
            .eq('target_type', target.type)
            .eq('target_id', target.id);

          if (error) throw error;

          results.push({
            target,
            success: true
          });

          // Log individual rollback
          if (applicationData) {
            await logActivity(
              'brand_kit_rollback',
              `Rolled back brand kit "${applicationData.brand_kits?.name || 'Unknown'}" from ${target.type} "${target.name}"`,
              {
                brand_kit_id: applicationData.brand_kit_id,
                target_type: target.type,
                target_id: target.id,
                target_name: target.name,
                application_id: applicationData.id,
                originally_applied: applicationData.applied_at,
                bulk_operation: true
              }
            );
          }
        } catch (error) {
          console.error(`Failed to remove brand kit from ${target.type} ${target.id}:`, error);
          results.push({
            target,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length > 0) {
        toast.success(`Successfully removed brand kit from ${successful.length} item${successful.length > 1 ? 's' : ''}`);
      }

      if (failed.length > 0) {
        toast.error(`Failed to remove brand kit from ${failed.length} item${failed.length > 1 ? 's' : ''}`);
      }

      return results;
    } catch (error) {
      console.error('Bulk removal error:', error);
      toast.error('Failed to bulk remove brand kit');
      return results;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    bulkApplyBrandKit,
    bulkRemoveBrandKit
  };
};