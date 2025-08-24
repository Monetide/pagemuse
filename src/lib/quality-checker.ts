// WCAG contrast ratio calculation
function getLuminance(color: string): number {
  // Convert hex to RGB
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16) / 255
  const g = parseInt(hex.substr(2, 2), 16) / 255
  const b = parseInt(hex.substr(4, 2), 16) / 255

  // Apply gamma correction
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  
  const rLinear = toLinear(r)
  const gLinear = toLinear(g)
  const bLinear = toLinear(b)

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
}

function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  return (lighter + 0.05) / (darker + 0.05)
}

// Color manipulation utilities
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }

  return [h * 360, s * 100, l * 100]
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360
  s /= 100
  l /= 100

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }

  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export interface QualityIssue {
  id: string
  type: 'error' | 'warning'
  category: 'contrast' | 'typography' | 'layout' | 'assets'
  title: string
  description: string
  currentValue?: string | number
  expectedValue?: string | number
  fixable: boolean
}

export interface QualityFix {
  issueId: string
  description: string
  changes: Record<string, any>
}

export interface QualityReport {
  issues: QualityIssue[]
  fixes: QualityFix[]
  score: number
  isPassing: boolean
}

export function checkTemplateQuality(seedData: any): QualityReport {
  const issues: QualityIssue[] = []
  const fixes: QualityFix[] = []

  const colors = seedData.colorway?.colors || {
    brand: seedData.primaryColor || '#8B5CF6',
    textBody: '#1a1a1a',
    textMuted: '#666666',
    bgPage: '#ffffff',
    bgSection: '#f8f9fa',
    borderSubtle: '#e5e5e5'
  }

  // Check contrast ratios
  const bodyContrast = getContrastRatio(colors.textBody, colors.bgPage)
  const bodySectionContrast = getContrastRatio(colors.textBody, colors.bgSection)
  const captionContrast = getContrastRatio(colors.textMuted, colors.bgPage)
  const captionSectionContrast = getContrastRatio(colors.textMuted, colors.bgSection)

  // Body text contrast checks
  if (bodyContrast < 4.5) {
    issues.push({
      id: 'body-contrast-page',
      type: 'error',
      category: 'contrast',
      title: 'Body text contrast insufficient on page background',
      description: 'Body text must have at least 4.5:1 contrast ratio for WCAG AA compliance',
      currentValue: bodyContrast.toFixed(2),
      expectedValue: '4.5',
      fixable: true
    })

    // Auto-fix: darken body text
    const [h, s, l] = hexToHsl(colors.textBody)
    const newL = Math.max(0, l - 10) // Darken by 10%
    const fixedColor = hslToHex(h, s, newL)
    
    fixes.push({
      issueId: 'body-contrast-page',
      description: 'Darken body text color to improve contrast',
      changes: {
        'colorway.colors.textBody': fixedColor
      }
    })
  }

  if (bodySectionContrast < 4.5) {
    issues.push({
      id: 'body-contrast-section',
      type: 'error',
      category: 'contrast',
      title: 'Body text contrast insufficient on section background',
      description: 'Body text must maintain contrast on tinted backgrounds',
      currentValue: bodySectionContrast.toFixed(2),
      expectedValue: '4.5',
      fixable: true
    })

    fixes.push({
      issueId: 'body-contrast-section',
      description: 'Lighten section background to improve text contrast',
      changes: {
        'colorway.colors.bgSection': '#fafafa'
      }
    })
  }

  // Caption text contrast checks
  if (captionContrast < 4.5) {
    issues.push({
      id: 'caption-contrast-page',
      type: 'error',
      category: 'contrast',
      title: 'Caption text contrast insufficient',
      description: 'Caption text must have sufficient contrast for accessibility',
      currentValue: captionContrast.toFixed(2),
      expectedValue: '4.5',
      fixable: true
    })

    const [h, s, l] = hexToHsl(colors.textMuted)
    const newL = Math.max(0, l - 15) // Darken more for captions
    const fixedColor = hslToHex(h, s, newL)
    
    fixes.push({
      issueId: 'caption-contrast-page',
      description: 'Darken caption text color for better readability',
      changes: {
        'colorway.colors.textMuted': fixedColor
      }
    })
  }

  // Font size checks (assuming 16px base = 12pt)
  const bodySize = 11 // pt - from design system
  const captionSize = 9.5 // pt - from design system

  if (bodySize < 10.5) {
    issues.push({
      id: 'body-font-size',
      type: 'error',
      category: 'typography',
      title: 'Body font size too small',
      description: 'Body text must be at least 10.5pt for readability',
      currentValue: `${bodySize}pt`,
      expectedValue: '10.5pt',
      fixable: true
    })

    fixes.push({
      issueId: 'body-font-size',
      description: 'Increase body font size to 11pt',
      changes: {
        'typography.bodySize': '11pt'
      }
    })
  }

  if (captionSize < 9) {
    issues.push({
      id: 'caption-font-size',
      type: 'error',
      category: 'typography', 
      title: 'Caption font size too small',
      description: 'Caption text must be at least 9pt for legibility',
      currentValue: `${captionSize}pt`,
      expectedValue: '9pt',
      fixable: true
    })

    fixes.push({
      issueId: 'caption-font-size',
      description: 'Increase caption font size to 9.5pt',
      changes: {
        'typography.captionSize': '9.5pt'
      }
    })
  }

  // Check pagination rules for headings
  const objectStyles = seedData.objectStyles?.styles || {}
  const hasKeepWithNext = Object.values(objectStyles).some((style: any) => 
    style.type === 'heading' && style.properties?.keepWithNext
  )

  if (!hasKeepWithNext) {
    issues.push({
      id: 'heading-pagination',
      type: 'warning',
      category: 'layout',
      title: 'Headings may become stranded',
      description: 'Headings should have keep-with-next rule to prevent orphaning',
      fixable: true
    })

    fixes.push({
      issueId: 'heading-pagination',
      description: 'Apply keep-with-next pagination rule to headings',
      changes: {
        'objectStyles.headingKeepWithNext': true
      }
    })
  }

  // Check table headers
  const tableStyle = objectStyles['table-default']
  if (tableStyle && !tableStyle.properties?.headerStyle) {
    issues.push({
      id: 'table-header',
      type: 'error',
      category: 'layout',
      title: 'Table missing header styling',
      description: 'Tables must have clearly defined headers for accessibility',
      fixable: true
    })

    fixes.push({
      issueId: 'table-header',
      description: 'Add header styling to table configuration',
      changes: {
        'objectStyles.styles.table-default.properties.headerStyle': 'caption-bold'
      }
    })
  }

  // Check SVG assets
  if (seedData.motifs?.assets) {
    seedData.motifs.assets.forEach((asset: any, index: number) => {
      asset.variants?.forEach((variant: any, vIndex: number) => {
        if (!variant.svg || !variant.svg.includes('<svg')) {
          issues.push({
            id: `svg-vector-${index}-${vIndex}`,
            type: 'error',
            category: 'assets',
            title: `Invalid SVG asset: ${asset.type}`,
            description: 'SVG assets must be valid vector graphics',
            fixable: false
          })
        }

        // Check for tight bounds (simple heuristic)
        if (variant.svg && !variant.svg.includes('viewBox')) {
          issues.push({
            id: `svg-bounds-${index}-${vIndex}`,
            type: 'warning',
            category: 'assets',
            title: `SVG missing viewBox: ${asset.type}`,
            description: 'SVGs should have tight bounds with proper viewBox',
            fixable: true
          })

          fixes.push({
            issueId: `svg-bounds-${index}-${vIndex}`,
            description: 'Add viewBox to SVG for proper scaling',
            changes: {
              [`motifs.assets.${index}.variants.${vIndex}.needsViewBox`]: true
            }
          })
        }
      })
    })
  }

  // Check divider opacity
  const dividerAsset = seedData.motifs?.assets?.find((a: any) => a.type === 'divider')
  if (dividerAsset) {
    const dividerVariant = dividerAsset.variants?.[0]
    if (dividerVariant?.svg && !dividerVariant.svg.includes('opacity')) {
      issues.push({
        id: 'divider-opacity',
        type: 'warning',
        category: 'assets',
        title: 'Divider may be too prominent',
        description: 'Dividers should be subtle to avoid visual disruption',
        fixable: true
      })

      fixes.push({
        issueId: 'divider-opacity',
        description: 'Reduce divider opacity for subtlety',
        changes: {
          'motifs.dividerOpacity': 0.3
        }
      })
    }
  }

  // Calculate quality score
  const totalChecks = 10 // Total number of possible issues
  const errorCount = issues.filter(i => i.type === 'error').length
  const warningCount = issues.filter(i => i.type === 'warning').length
  const score = Math.max(0, (totalChecks - errorCount * 2 - warningCount) / totalChecks * 100)
  const isPassing = errorCount === 0

  return {
    issues,
    fixes,
    score: Math.round(score),
    isPassing
  }
}

export function applyQualityFixes(seedData: any, fixes: QualityFix[]): any {
  const updatedData = { ...seedData }

  fixes.forEach(fix => {
    Object.entries(fix.changes).forEach(([path, value]) => {
      // Simple dot notation path setter
      const keys = path.split('.')
      let current = updatedData
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]
        if (!current[key]) current[key] = {}
        current = current[key]
      }
      
      current[keys[keys.length - 1]] = value
    })
  })

  return updatedData
}