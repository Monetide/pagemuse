import { ValidationRule, ValidationIssue } from './validation-engine'
import { SemanticDocument } from './document-model'
import { BrandKit, LogoPlacementSettings } from '@/types/brandKit'

/**
 * Brand validation utilities for checking compliance with brand guidelines
 */

// Color utility functions
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
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

  return { h: h * 360, s: s * 100, l: l * 100 }
}

export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (hex: string) => {
    const rgb = [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16)
    ].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
  }

  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  
  return (lighter + 0.05) / (darker + 0.05)
}

export function findNearestBrandColor(targetColor: string, brandKit: BrandKit): string {
  const brandColors = [
    brandKit.palette.primary,
    brandKit.palette.secondary,
    brandKit.palette.accent,
    brandKit.neutrals.textBody,
    brandKit.neutrals.textMuted,
    brandKit.neutrals.bgPage,
    brandKit.neutrals.bgSection,
    brandKit.neutrals.borderSubtle
  ]

  const targetHsl = hexToHsl(targetColor)
  let nearestColor = brandColors[0]
  let minDistance = Infinity

  brandColors.forEach(brandColor => {
    const brandHsl = hexToHsl(brandColor)
    const distance = Math.sqrt(
      Math.pow(targetHsl.h - brandHsl.h, 2) +
      Math.pow(targetHsl.s - brandHsl.s, 2) +
      Math.pow(targetHsl.l - brandHsl.l, 2)
    )
    
    if (distance < minDistance) {
      minDistance = distance
      nearestColor = brandColor
    }
  })

  return nearestColor
}

export function extractColorsFromBlock(block: any): string[] {
  const colors: string[] = []
  
  // Extract from block styles
  if (block.styles) {
    block.styles.forEach((style: any) => {
      if (style.properties) {
        if (style.properties.color) colors.push(style.properties.color)
        if (style.properties.backgroundColor) colors.push(style.properties.backgroundColor)
        if (style.properties.borderColor) colors.push(style.properties.borderColor)
      }
    })
  }

  // Extract from metadata styling
  if (block.metadata?.styling) {
    if (block.metadata.styling.color) colors.push(block.metadata.styling.color)
    if (block.metadata.styling.backgroundColor) colors.push(block.metadata.styling.backgroundColor)
    if (block.metadata.styling.borderColor) colors.push(block.metadata.styling.borderColor)
  }

  return colors.filter(color => color && color.startsWith('#'))
}

export function isBackgroundDark(backgroundColor: string): boolean {
  const hsl = hexToHsl(backgroundColor)
  return hsl.l < 50 // Lightness less than 50% is considered dark
}

// Brand validation rules
export const nonTokenColorRule: ValidationRule = {
  id: 'non-token-color',
  name: 'Non-Token Color Used',
  severity: 'warning',
  enabled: true,
  validate: (document: SemanticDocument, layoutResults?: Map<string, any>, brandKit?: BrandKit) => {
    const issues: ValidationIssue[] = []
    
    if (!brandKit) return issues

    const brandColors = [
      brandKit.palette.primary,
      brandKit.palette.secondary,
      brandKit.palette.accent,
      brandKit.neutrals.textBody,
      brandKit.neutrals.textMuted,
      brandKit.neutrals.bgPage,
      brandKit.neutrals.bgSection,
      brandKit.neutrals.borderSubtle
    ]

    document.sections.forEach(section => {
      section.flows.forEach(flow => {
        flow.blocks.forEach(block => {
          const blockColors = extractColorsFromBlock(block)
          
          blockColors.forEach(color => {
            if (!brandColors.includes(color)) {
              const nearestBrandColor = findNearestBrandColor(color, brandKit)
              
              issues.push({
                id: `non-token-color-${block.id}-${color}`,
                ruleId: 'non-token-color',
                severity: 'warning',
                blockId: block.id,
                sectionId: section.id,
                message: `Non-brand color ${color} found`,
                description: `This color doesn't match your brand kit. Nearest brand color: ${nearestBrandColor}`,
                canFix: true,
                fixLabel: 'Replace with brand color',
                ignored: false,
                snippet: typeof block.content === 'string' ? block.content.substring(0, 50) : 'Block content'
              })
            }
          })
        })
      })
    })

    return issues
  },
  fix: (document: SemanticDocument, issue: ValidationIssue, brandKit?: BrandKit) => {
    if (!brandKit) return document

    const colorMatch = issue.message.match(/#[0-9a-fA-F]{6}/)
    if (!colorMatch) return document

    const oldColor = colorMatch[0]
    const newColor = findNearestBrandColor(oldColor, brandKit)

    const updatedDocument = { ...document }
    updatedDocument.sections = document.sections.map(section => {
      if (section.id === issue.sectionId) {
        return {
          ...section,
          flows: section.flows.map(flow => ({
            ...flow,
            blocks: flow.blocks.map(block => {
              if (block.id === issue.blockId) {
                const updatedBlock = { ...block }
                
                // Replace color in block styles
                if (updatedBlock.styles) {
                  updatedBlock.styles = updatedBlock.styles.map(style => ({
                    ...style,
                    properties: {
                      ...style.properties,
                      color: style.properties?.color === oldColor ? newColor : style.properties?.color,
                      backgroundColor: style.properties?.backgroundColor === oldColor ? newColor : style.properties?.backgroundColor,
                      borderColor: style.properties?.borderColor === oldColor ? newColor : style.properties?.borderColor
                    }
                  }))
                }

                // Replace color in metadata styling
                if (updatedBlock.metadata?.styling) {
                  updatedBlock.metadata = {
                    ...updatedBlock.metadata,
                    styling: {
                      ...updatedBlock.metadata.styling,
                      color: updatedBlock.metadata.styling.color === oldColor ? newColor : updatedBlock.metadata.styling.color,
                      backgroundColor: updatedBlock.metadata.styling.backgroundColor === oldColor ? newColor : updatedBlock.metadata.styling.backgroundColor,
                      borderColor: updatedBlock.metadata.styling.borderColor === oldColor ? newColor : updatedBlock.metadata.styling.borderColor
                    }
                  }
                }

                return updatedBlock
              }
              return block
            })
          }))
        }
      }
      return section
    })

    return updatedDocument
  }
}

export const lowContrastAfterBrandSwapRule: ValidationRule = {
  id: 'low-contrast-brand',
  name: 'Low Contrast After Brand Kit Application',
  severity: 'warning',
  enabled: true,
  validate: (document: SemanticDocument, layoutResults?: Map<string, any>, brandKit?: BrandKit) => {
    const issues: ValidationIssue[] = []
    
    if (!brandKit) return issues

    document.sections.forEach(section => {
      section.flows.forEach(flow => {
        flow.blocks.forEach(block => {
          if (block.type === 'heading' || block.type === 'paragraph') {
            // Get text and background colors from styles or metadata
            let textColor = brandKit.neutrals.textBody
            let backgroundColor = brandKit.neutrals.bgPage
            
            // Check block styles
            if (block.styles) {
              const colorStyle = block.styles.find(s => s.properties?.color)
              const bgStyle = block.styles.find(s => s.properties?.backgroundColor)
              if (colorStyle?.properties?.color) textColor = colorStyle.properties.color
              if (bgStyle?.properties?.backgroundColor) backgroundColor = bgStyle.properties.backgroundColor
            }
            
            // Check metadata styling
            if (block.metadata?.styling) {
              if (block.metadata.styling.color) textColor = block.metadata.styling.color
              if (block.metadata.styling.backgroundColor) backgroundColor = block.metadata.styling.backgroundColor
            }
            
            const contrast = getContrastRatio(textColor, backgroundColor)
            
            if (contrast < 4.5) { // WCAG AA standard
              issues.push({
                id: `low-contrast-brand-${block.id}`,
                ruleId: 'low-contrast-brand',
                severity: 'warning',
                blockId: block.id,
                sectionId: section.id,
                message: `Low contrast ratio: ${contrast.toFixed(2)} (minimum 4.5)`,
                description: 'Text may be difficult to read with current brand colors.',
                canFix: true,
                fixLabel: 'Improve contrast',
                ignored: false,
                snippet: typeof block.content === 'string' ? block.content.substring(0, 50) : 'Text content'
              })
            }
          }
        })
      })
    })

    return issues
  },
  fix: (document: SemanticDocument, issue: ValidationIssue, brandKit?: BrandKit) => {
    if (!brandKit) return document

    const updatedDocument = { ...document }
    updatedDocument.sections = document.sections.map(section => {
      if (section.id === issue.sectionId) {
        return {
          ...section,
          flows: section.flows.map(flow => ({
            ...flow,
            blocks: flow.blocks.map(block => {
              if (block.id === issue.blockId) {
                const updatedBlock = { ...block }
                
                // Update color in styles
                if (!updatedBlock.styles) {
                  updatedBlock.styles = []
                }
                
                // Find or create color style
                const colorStyleIndex = updatedBlock.styles.findIndex(s => s.properties?.color)
                if (colorStyleIndex >= 0) {
                  updatedBlock.styles[colorStyleIndex] = {
                    ...updatedBlock.styles[colorStyleIndex],
                    properties: {
                      ...updatedBlock.styles[colorStyleIndex].properties,
                      color: brandKit.neutrals.textBody
                    }
                  }
                } else {
                  updatedBlock.styles.push({
                    id: `color-${block.id}`,
                    name: 'Text Color',
                    category: 'color',
                    properties: { color: brandKit.neutrals.textBody }
                  })
                }
                
                return updatedBlock
              }
              return block
            })
          }))
        }
      }
      return section
    })

    return updatedDocument
  }
}

export const missingAltLogoRule: ValidationRule = {
  id: 'missing-alt-logo',
  name: 'Missing Alt Logo for Dark Background',
  severity: 'warning',
  enabled: true,
  validate: (document: SemanticDocument, layoutResults?: Map<string, any>, brandKit?: BrandKit, logoSettings?: LogoPlacementSettings) => {
    const issues: ValidationIssue[] = []
    
    if (!brandKit || !logoSettings || !brandKit.logo_primary_url) return issues

    document.sections.forEach(section => {
      section.flows.forEach(flow => {
        flow.blocks.forEach(block => {
          // Check blocks that could be cover-related
          if (section.layoutIntent === 'cover' || block.metadata?.type === 'cover') {
            // Get background color from section or block metadata
            let backgroundColor = section.metadata?.styling?.backgroundColor || 
                                block.metadata?.styling?.backgroundColor
            
            if (backgroundColor && isBackgroundDark(backgroundColor)) {
              const hasAltLogo = brandKit.logo_alt_url
              
              if (logoSettings.coverLogo.enabled && !hasAltLogo) {
                issues.push({
                  id: `missing-alt-logo-${block.id}`,
                  ruleId: 'missing-alt-logo',
                  severity: 'warning',
                  blockId: block.id,
                  sectionId: section.id,
                  message: 'Dark background detected but no alt logo available',
                  description: 'Consider uploading an alt logo (light version) for dark backgrounds.',
                  canFix: !!brandKit.logo_alt_url,
                  fixLabel: 'Switch to alt logo',
                  ignored: false,
                  snippet: 'Cover page'
                })
              }
            }
          }
        })
      })
    })

    return issues
  },
  fix: (document: SemanticDocument, issue: ValidationIssue, brandKit?: BrandKit) => {
    if (!brandKit?.logo_alt_url) return document

    // This would typically trigger a logo settings update
    // For now, we'll add metadata to indicate alt logo should be used
    const updatedDocument = { ...document }
    updatedDocument.sections = document.sections.map(section => {
      if (section.id === issue.sectionId) {
        return {
          ...section,
          metadata: {
            ...section.metadata,
            useAltLogo: true
          }
        }
      }
      return section
    })

    return updatedDocument
  }
}

export const brandValidationRules = [
  nonTokenColorRule,
  lowContrastAfterBrandSwapRule,
  missingAltLogoRule
]