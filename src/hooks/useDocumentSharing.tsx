import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type DocumentRole = 'owner' | 'editor' | 'commenter' | 'viewer';

export interface DocumentShare {
  id: string;
  document_id: string;
  shared_with_user_id: string;
  shared_by_user_id: string;
  role: DocumentRole;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
  expires_at?: string;
  profile?: {
    display_name?: string;
  };
}

export interface ShareLink {
  id: string;
  document_id: string;
  token: string;
  role: DocumentRole;
  expires_at?: string;
  view_count: number;
  max_views?: number;
  is_active: boolean;
  allow_download: boolean;
  watermark_text?: string;
  created_at: string;
}

export interface DocumentActivity {
  id: string;
  document_id: string;
  user_id?: string;
  activity_type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
  profile?: {
    display_name?: string;
  };
}

export const useDocumentSharing = (documentId: string) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Invite user by email
  const inviteUser = useCallback(async (email: string, role: DocumentRole, message?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: { documentId, email, role, message }
      });

      if (error) throw error;

      toast({
        title: 'Invitation sent',
        description: `Invitation sent to ${email} successfully.`
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Failed to send invitation',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [documentId, toast]);

  // Create share link
  const createShareLink = useCallback(async (
    role: DocumentRole,
    options: {
      expiresAt?: Date;
      password?: string;
      maxViews?: number;
      allowDownload?: boolean;
      watermarkText?: string;
    } = {}
  ) => {
    setLoading(true);
    try {
      let passwordHash = null;
      if (options.password) {
        // Hash password on client side for security
        const encoder = new TextEncoder();
        const data = encoder.encode(options.password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      const { data, error } = await supabase
        .from('share_links')
        .insert({
          document_id: documentId,
          created_by_user_id: (await supabase.auth.getUser()).data.user?.id,
          role,
          expires_at: options.expiresAt?.toISOString(),
          password_hash: passwordHash,
          max_views: options.maxViews,
          allow_download: options.allowDownload || false,
          watermark_text: options.watermarkText
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Share link created',
        description: 'Share link created successfully.'
      });

      return data as ShareLink;
    } catch (error: any) {
      toast({
        title: 'Failed to create share link',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [documentId, toast]);

  // Get document shares
  const getShares = useCallback(async () => {
    const { data, error } = await supabase
      .from('document_shares')
      .select(`
        *,
        profile:profiles!document_shares_shared_with_user_id_fkey(display_name)
      `)
      .eq('document_id', documentId);

    if (error) throw error;
    return data as DocumentShare[];
  }, [documentId]);

  // Get share links
  const getShareLinks = useCallback(async () => {
    const { data, error } = await supabase
      .from('share_links')
      .select('*')
      .eq('document_id', documentId)
      .eq('is_active', true);

    if (error) throw error;
    return data as ShareLink[];
  }, [documentId]);

  // Get document activities
  const getActivities = useCallback(async (limit: number = 50) => {
    const { data, error } = await supabase
      .from('document_activities')
      .select(`
        *,
        profile:profiles(display_name)
      `)
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as DocumentActivity[];
  }, [documentId]);

  // Update share permissions
  const updateSharePermissions = useCallback(async (shareId: string, role: DocumentRole) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('document_shares')
        .update({ role })
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: 'Permissions updated',
        description: 'Share permissions updated successfully.'
      });
    } catch (error: any) {
      toast({
        title: 'Failed to update permissions',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Remove share
  const removeShare = useCallback(async (shareId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('document_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: 'Access removed',
        description: 'User access removed successfully.'
      });
    } catch (error: any) {
      toast({
        title: 'Failed to remove access',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Deactivate share link
  const deactivateShareLink = useCallback(async (linkId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('share_links')
        .update({ is_active: false })
        .eq('id', linkId);

      if (error) throw error;

      toast({
        title: 'Share link deactivated',
        description: 'Share link has been deactivated.'
      });
    } catch (error: any) {
      toast({
        title: 'Failed to deactivate link',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Publish document
  const publishDocument = useCallback(async (metadata?: Record<string, any>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('publish-document', {
        body: { documentId, metadata }
      });

      if (error) throw error;

      toast({
        title: 'Document published',
        description: 'Document has been published successfully.'
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Failed to publish document',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [documentId, toast]);

  return {
    loading,
    inviteUser,
    createShareLink,
    getShares,
    getShareLinks,
    getActivities,
    updateSharePermissions,
    removeShare,
    deactivateShareLink,
    publishDocument
  };
};