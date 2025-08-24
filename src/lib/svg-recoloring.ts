// SVG Recoloring Pipeline - Token-based SVG color management

export interface TokenMap {
  [key: string]: string;
}

/**
 * Normalize SVG by tagging fills and strokes with token keys
 * This converts regular colors to data-token attributes for later recoloring
 */
export function normalizeSvg(svgString: string, colorTokenMap?: Record<string, string>): string {
  // If no token map provided, return as-is (assuming already normalized)
  if (!colorTokenMap) return svgString;
  
  let normalizedSvg = svgString;
  
  // Replace known colors with data-token attributes
  Object.entries(colorTokenMap).forEach(([color, token]) => {
    // Replace fill attributes
    normalizedSvg = normalizedSvg.replace(
      new RegExp(`fill="${color}"`, 'gi'),
      `fill="currentColor" data-token="${token}"`
    );
    
    // Replace stroke attributes
    normalizedSvg = normalizedSvg.replace(
      new RegExp(`stroke="${color}"`, 'gi'),
      `stroke="currentColor" data-token="${token}"`
    );
    
    // Replace CSS fill properties
    normalizedSvg = normalizedSvg.replace(
      new RegExp(`fill:\\s*${color}`, 'gi'),
      `fill: var(--${token}, ${color})`
    );
    
    // Replace CSS stroke properties
    normalizedSvg = normalizedSvg.replace(
      new RegExp(`stroke:\\s*${color}`, 'gi'),
      `stroke: var(--${token}, ${color})`
    );
  });
  
  return normalizedSvg;
}

/**
 * Recolor SVG using token map - pure function
 * Takes an SVG string with data-token attributes and applies colors from token map
 */
export function recolorSvg(svgString: string, tokenMap: TokenMap): string {
  let recoloredSvg = svgString;
  
  // Method 1: Replace data-token attributes
  Object.entries(tokenMap).forEach(([token, color]) => {
    // Find elements with data-token attributes and update their fill/stroke
    const tokenRegex = new RegExp(`(fill|stroke)="[^"]*"\\s+data-token="${token}"`, 'gi');
    recoloredSvg = recoloredSvg.replace(tokenRegex, `$1="${color}" data-token="${token}"`);
    
    // Also handle the reverse order (data-token first)
    const reverseTokenRegex = new RegExp(`data-token="${token}"\\s+(fill|stroke)="[^"]*"`, 'gi');
    recoloredSvg = recoloredSvg.replace(reverseTokenRegex, `data-token="${token}" $1="${color}"`);
  });
  
  // Method 2: Replace CSS variables
  Object.entries(tokenMap).forEach(([token, color]) => {
    const cssVarRegex = new RegExp(`var\\(--${token}[^)]*\\)`, 'gi');
    recoloredSvg = recoloredSvg.replace(cssVarRegex, color);
  });
  
  return recoloredSvg;
}

/**
 * Extract colors from SVG and suggest token mappings
 * Useful for auto-normalizing imported SVGs
 */
export function extractSvgColors(svgString: string): string[] {
  const colors = new Set<string>();
  
  // Extract fill colors
  const fillMatches = svgString.match(/fill=["']([^"']+)["']/gi);
  if (fillMatches) {
    fillMatches.forEach(match => {
      const color = match.match(/fill=["']([^"']+)["']/i)?.[1];
      if (color && color !== 'none' && color !== 'currentColor' && color !== 'transparent') {
        colors.add(color);
      }
    });
  }
  
  // Extract stroke colors
  const strokeMatches = svgString.match(/stroke=["']([^"']+)["']/gi);
  if (strokeMatches) {
    strokeMatches.forEach(match => {
      const color = match.match(/stroke=["']([^"']+)["']/i)?.[1];
      if (color && color !== 'none' && color !== 'currentColor' && color !== 'transparent') {
        colors.add(color);
      }
    });
  }
  
  // Extract CSS colors
  const cssColorMatches = svgString.match(/(fill|stroke):\s*([^;}\s]+)/gi);
  if (cssColorMatches) {
    cssColorMatches.forEach(match => {
      const color = match.match(/(fill|stroke):\s*([^;}\s]+)/i)?.[2];
      if (color && color !== 'none' && color !== 'currentColor' && color !== 'transparent') {
        colors.add(color);
      }
    });
  }
  
  return Array.from(colors);
}

/**
 * Generate token map from brand kit colors
 */
export function generateTokenMapFromBrandKit(brandKit: {
  palette: { primary: string; secondary: string; accent: string };
  neutrals: { textBody: string; textMuted: string; bgPage: string; bgSection: string; borderSubtle: string };
}): TokenMap {
  return {
    'brand/primary': brandKit.palette.primary,
    'brand/secondary': brandKit.palette.secondary,
    'brand/accent': brandKit.palette.accent,
    'text/body': brandKit.neutrals.textBody,
    'text/muted': brandKit.neutrals.textMuted,
    'bg/page': brandKit.neutrals.bgPage,
    'bg/section': brandKit.neutrals.bgSection,
    'border/subtle': brandKit.neutrals.borderSubtle,
  };
}

/**
 * Create SVG component from recolored SVG string
 */
export function createSvgComponent(svgString: string, className?: string): string {
  return svgString;
}