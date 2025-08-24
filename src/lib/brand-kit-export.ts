import { supabase } from '@/integrations/supabase/client';
import type { BrandKit } from '@/types/brandKit';

export interface BrandKitExport {
  version: string;
  exported_at: string;
  brand_kit: {
    name: string;
    palette: any;
    neutrals: any;
    fonts?: any;
    logo_primary_url?: string;
    logo_alt_url?: string;
  };
  logos: {
    primary?: {
      filename: string;
      data: string; // base64
      content_type: string;
    };
    alt?: {
      filename: string;
      data: string; // base64
      content_type: string;
    };
  };
  metadata: {
    exported_from_workspace: string;
    total_applications?: number;
    created_at: string;
  };
}

export interface ImportValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  accessibility_issues: AccessibilityIssue[];
}

export interface AccessibilityIssue {
  type: 'contrast' | 'color_blindness' | 'readability';
  severity: 'error' | 'warning';
  message: string;
  colors?: {
    foreground: string;
    background: string;
    contrast_ratio: number;
  };
}

/**
 * Export a brand kit as a portable JSON package with embedded logos
 */
export const exportBrandKit = async (brandKitId: string): Promise<BrandKitExport | null> => {
  try {
    // Get brand kit data
    const { data: brandKit, error: brandKitError } = await supabase
      .from('brand_kits')
      .select('*')
      .eq('id', brandKitId)
      .single();

    if (brandKitError) throw brandKitError;

    // Get workspace name for metadata
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name')
      .eq('id', brandKit.workspace_id)
      .single();

    // Get application count
    const { count: applicationCount } = await supabase
      .from('kit_applications')
      .select('*', { count: 'exact' })
      .eq('brand_kit_id', brandKitId);

    const exportData: BrandKitExport = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      brand_kit: {
        name: brandKit.name,
        palette: brandKit.palette,
        neutrals: brandKit.neutrals,
        fonts: brandKit.fonts,
        logo_primary_url: brandKit.logo_primary_url,
        logo_alt_url: brandKit.logo_alt_url,
      },
      logos: {},
      metadata: {
        exported_from_workspace: workspace?.name || 'Unknown Workspace',
        total_applications: applicationCount || 0,
        created_at: brandKit.created_at,
      },
    };

    // Download and embed logos as base64
    if (brandKit.logo_primary_url) {
      try {
        const logoData = await downloadAndEncodeFile(brandKit.logo_primary_url);
        if (logoData) {
          exportData.logos.primary = logoData;
        }
      } catch (error) {
        console.warn('Failed to download primary logo:', error);
      }
    }

    if (brandKit.logo_alt_url) {
      try {
        const logoData = await downloadAndEncodeFile(brandKit.logo_alt_url);
        if (logoData) {
          exportData.logos.alt = logoData;
        }
      } catch (error) {
        console.warn('Failed to download alt logo:', error);
      }
    }

    return exportData;
  } catch (error) {
    console.error('Error exporting brand kit:', error);
    return null;
  }
};

/**
 * Download a file and encode it as base64
 */
const downloadAndEncodeFile = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to download file');
    
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Extract filename from URL
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1] || 'logo';
    
    return {
      filename,
      data: base64,
      content_type: blob.type || 'image/png',
    };
  } catch (error) {
    console.error('Error downloading file:', error);
    return null;
  }
};

/**
 * Validate an imported brand kit for accessibility compliance
 */
export const validateBrandKitImport = (importData: BrandKitExport): ImportValidationResult => {
  const result: ImportValidationResult = {
    valid: true,
    warnings: [],
    errors: [],
    accessibility_issues: [],
  };

  // Basic structure validation
  if (!importData.version) {
    result.errors.push('Missing export version information');
    result.valid = false;
  }

  if (!importData.brand_kit) {
    result.errors.push('Missing brand kit data');
    result.valid = false;
    return result;
  }

  const { palette, neutrals } = importData.brand_kit;

  // Required fields validation
  if (!importData.brand_kit.name) {
    result.errors.push('Brand kit name is required');
    result.valid = false;
  }

  if (!palette || !neutrals) {
    result.errors.push('Both palette and neutrals colors are required');
    result.valid = false;
    return result;
  }

  // Accessibility validation
  const accessibilityIssues = checkAccessibilityCompliance(palette, neutrals);
  result.accessibility_issues = accessibilityIssues;

  // Check for AA compliance failures
  const aaFailures = accessibilityIssues.filter(issue => 
    issue.severity === 'error' && issue.type === 'contrast'
  );

  if (aaFailures.length > 0) {
    result.warnings.push(
      `${aaFailures.length} color combination${aaFailures.length > 1 ? 's' : ''} fail WCAG AA contrast requirements`
    );
  }

  // Color blindness warnings
  const colorBlindnessIssues = accessibilityIssues.filter(issue => 
    issue.type === 'color_blindness'
  );

  if (colorBlindnessIssues.length > 0) {
    result.warnings.push(
      `${colorBlindnessIssues.length} potential color blindness accessibility issue${colorBlindnessIssues.length > 1 ? 's' : ''} detected`
    );
  }

  return result;
};

/**
 * Check color combinations for accessibility compliance
 */
const checkAccessibilityCompliance = (palette: any, neutrals: any): AccessibilityIssue[] => {
  const issues: AccessibilityIssue[] = [];

  // Common color combinations to check
  const combinations = [
    { fg: neutrals.textBody, bg: neutrals.bgPage, name: 'Body text on page background' },
    { fg: neutrals.textBody, bg: neutrals.bgSection, name: 'Body text on section background' },
    { fg: neutrals.textMuted, bg: neutrals.bgPage, name: 'Muted text on page background' },
    { fg: palette.primary, bg: neutrals.bgPage, name: 'Primary color on page background' },
    { fg: '#ffffff', bg: palette.primary, name: 'White text on primary color' },
    { fg: neutrals.textBody, bg: palette.accent, name: 'Body text on accent color' },
  ];

  combinations.forEach(({ fg, bg, name }) => {
    if (fg && bg) {
      const contrastRatio = calculateContrastRatio(fg, bg);
      
      // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
      if (contrastRatio < 4.5) {
        issues.push({
          type: 'contrast',
          severity: contrastRatio < 3 ? 'error' : 'warning',
          message: `${name}: Contrast ratio ${contrastRatio.toFixed(2)}:1 ${contrastRatio < 3 ? 'fails AA' : 'may fail AA for small text'}`,
          colors: {
            foreground: fg,
            background: bg,
            contrast_ratio: contrastRatio,
          },
        });
      }
    }
  });

  // Check for color blindness issues (simplified)
  const colors = [palette.primary, palette.secondary, palette.accent].filter(Boolean);
  const problematicCombinations = checkColorBlindnessFriendliness(colors);
  
  problematicCombinations.forEach(issue => {
    issues.push({
      type: 'color_blindness',
      severity: 'warning',
      message: issue,
    });
  });

  return issues;
};

/**
 * Calculate contrast ratio between two colors
 */
const calculateContrastRatio = (color1: string, color2: string): number => {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Get relative luminance of a color
 */
const getRelativeLuminance = (color: string): number => {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  // Apply gamma correction
  const gamma = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  
  return 0.2126 * gamma(r) + 0.7152 * gamma(g) + 0.0722 * gamma(b);
};

/**
 * Check for color blindness accessibility issues (simplified)
 */
const checkColorBlindnessFriendliness = (colors: string[]): string[] => {
  const issues: string[] = [];
  
  // Check for problematic red-green combinations
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const color1 = colors[i];
      const color2 = colors[j];
      
      if (areProblematicForColorBlindness(color1, color2)) {
        issues.push(`Colors ${color1} and ${color2} may be difficult to distinguish for color blind users`);
      }
    }
  }
  
  return issues;
};

/**
 * Check if two colors are problematic for color blindness (simplified heuristic)
 */
const areProblematicForColorBlindness = (color1: string, color2: string): boolean => {
  // This is a simplified check - in reality, you'd want more sophisticated color blindness simulation
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return false;
  
  // Check for red-green confusion (most common type of color blindness)
  const redDiff = Math.abs(rgb1.r - rgb2.r);
  const greenDiff = Math.abs(rgb1.g - rgb2.g);
  const blueDiff = Math.abs(rgb1.b - rgb2.b);
  
  // If colors differ mainly in red-green but not blue, they might be problematic
  return redDiff > 50 && greenDiff > 50 && blueDiff < 30;
};

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Download brand kit export as JSON file
 */
export const downloadBrandKitExport = (exportData: BrandKitExport, filename?: string) => {
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${exportData.brand_kit.name.replace(/\s+/g, '-').toLowerCase()}-brand-kit.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};