import { supabase } from '@/integrations/supabase/client';
import { useWorkspaceActivity } from '@/hooks/useWorkspaceActivity';
import type { BrandKitExport, ImportValidationResult } from './brand-kit-export';
import type { CreateBrandKitData } from '@/types/brandKit';

export interface ImportOptions {
  overrideAccessibilityWarnings: boolean;
  newName?: string;
  importLogos: boolean;
}

export interface ImportResult {
  success: boolean;
  brandKitId?: string;
  errors: string[];
  warnings: string[];
  importedLogoUrls?: {
    primary?: string;
    alt?: string;
  };
}

/**
 * Import a brand kit from export data into the current workspace
 */
export const importBrandKit = async (
  exportData: BrandKitExport,
  workspaceId: string,
  userId: string,
  options: ImportOptions
): Promise<ImportResult> => {
  const result: ImportResult = {
    success: false,
    errors: [],
    warnings: [],
  };

  try {
    // Upload logos first if included
    const logoUrls: { primary?: string; alt?: string } = {};
    
    if (options.importLogos) {
      if (exportData.logos.primary) {
        const primaryUrl = await uploadLogoFromBase64(
          exportData.logos.primary,
          workspaceId,
          'primary'
        );
        if (primaryUrl) {
          logoUrls.primary = primaryUrl;
        } else {
          result.warnings.push('Failed to import primary logo');
        }
      }

      if (exportData.logos.alt) {
        const altUrl = await uploadLogoFromBase64(
          exportData.logos.alt,
          workspaceId,
          'alt'
        );
        if (altUrl) {
          logoUrls.alt = altUrl;
        } else {
          result.warnings.push('Failed to import alt logo');
        }
      }
    }

    // Create brand kit data
    const brandKitData: CreateBrandKitData = {
      workspace_id: workspaceId,
      name: options.newName || exportData.brand_kit.name,
      palette: exportData.brand_kit.palette,
      neutrals: exportData.brand_kit.neutrals,
      fonts: exportData.brand_kit.fonts,
      logo_primary_url: logoUrls.primary || undefined,
      logo_alt_url: logoUrls.alt || undefined,
    };

    // Insert brand kit
    const { data: newBrandKit, error: insertError } = await supabase
      .from('brand_kits')
      .insert({
        workspace_id: brandKitData.workspace_id,
        name: brandKitData.name,
        palette: brandKitData.palette as any,
        neutrals: brandKitData.neutrals as any,
        fonts: brandKitData.fonts as any,
        logo_primary_url: brandKitData.logo_primary_url,
        logo_alt_url: brandKitData.logo_alt_url,
        created_by: userId,
      })
      .select()
      .single();

    if (insertError) {
      result.errors.push(`Failed to create brand kit: ${insertError.message}`);
      return result;
    }

    // Generate brand kit maps
    await generateBrandKitMaps(newBrandKit.id, {
      ...exportData.brand_kit.palette,
      ...exportData.brand_kit.neutrals,
    });

    result.success = true;
    result.brandKitId = newBrandKit.id;
    result.importedLogoUrls = logoUrls;

    // Add success message with details
    const details = [];
    if (logoUrls.primary) details.push('primary logo');
    if (logoUrls.alt) details.push('alt logo');
    if (details.length > 0) {
      result.warnings.push(`Successfully imported ${details.join(' and ')}`);
    }

    return result;
  } catch (error) {
    console.error('Error importing brand kit:', error);
    result.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
};

/**
 * Upload a logo from base64 data to Supabase storage
 */
const uploadLogoFromBase64 = async (
  logoData: { filename: string; data: string; content_type: string },
  workspaceId: string,
  logoType: 'primary' | 'alt'
): Promise<string | null> => {
  try {
    // Convert base64 to blob
    const byteCharacters = atob(logoData.data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: logoData.content_type });

    // Generate unique filename
    const timestamp = Date.now();
    const extension = logoData.filename.split('.').pop() || 'png';
    const filename = `${workspaceId}/brand-kits/${logoType}-logo-${timestamp}.${extension}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('media')
      .upload(filename, blob, {
        contentType: logoData.content_type,
        upsert: false,
      });

    if (error) {
      console.error('Error uploading logo:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error processing logo upload:', error);
    return null;
  }
};

/**
 * Generate brand kit maps for the imported brand kit
 */
const generateBrandKitMaps = async (brandKitId: string, tokens: Record<string, string>) => {
  try {
    // Create maps
    const maps = Object.entries(tokens).map(([tokenName, hex]) => ({
      brand_kit_id: brandKitId,
      token_name: tokenName,
      hex,
    }));

    const { error } = await supabase
      .from('brand_kit_maps')
      .insert(maps);

    if (error) {
      console.error('Error generating brand kit maps:', error);
    }
  } catch (error) {
    console.error('Error generating brand kit maps:', error);
  }
};

/**
 * Parse and validate a brand kit import file
 */
export const parseImportFile = (file: File): Promise<{ data: BrandKitExport | null; error?: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as BrandKitExport;
        
        // Basic validation
        if (!data.brand_kit || !data.version) {
          resolve({ data: null, error: 'Invalid brand kit export file format' });
          return;
        }
        
        resolve({ data });
      } catch (error) {
        resolve({ data: null, error: 'Failed to parse JSON file' });
      }
    };
    
    reader.onerror = () => {
      resolve({ data: null, error: 'Failed to read file' });
    };
    
    reader.readAsText(file);
  });
};

/**
 * Check if a brand kit name already exists in the workspace
 */
export const checkBrandKitNameExists = async (name: string, workspaceId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('brand_kits')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('name', name)
      .limit(1);

    if (error) {
      console.error('Error checking brand kit name:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking brand kit name:', error);
    return false;
  }
};