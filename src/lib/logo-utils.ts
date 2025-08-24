import { LogoPlacementSettings } from '@/components/brand/LogoPlacementControls'

/**
 * Apply logo placement settings to document content during export
 */
export function applyLogoPlacement(
  content: any,
  logoSettings: LogoPlacementSettings,
  logoUrl?: string
): any {
  if (!logoUrl) return content

  const updatedContent = { ...content }

  // Apply cover logo
  if (logoSettings.coverLogo.enabled && updatedContent.cover) {
    updatedContent.cover = {
      ...updatedContent.cover,
      logo: {
        url: logoUrl,
        position: logoSettings.coverLogo.position,
        size: logoSettings.coverLogo.size,
        autoInvert: logoSettings.coverLogo.autoInvert,
        nudgeOnOverlap: logoSettings.coverLogo.nudgeOnOverlap
      }
    }
  }

  // Apply header/footer logos
  if (logoSettings.headerLogo.enabled || logoSettings.footerLogo.enabled) {
    updatedContent.layout = {
      ...updatedContent.layout,
      header: logoSettings.headerLogo.enabled ? {
        ...updatedContent.layout?.header,
        logo: {
          url: logoUrl,
          style: logoSettings.headerLogo.style
        }
      } : updatedContent.layout?.header,
      footer: logoSettings.footerLogo.enabled ? {
        ...updatedContent.layout?.footer,
        logo: {
          url: logoUrl,
          style: logoSettings.footerLogo.style
        }
      } : updatedContent.layout?.footer
    }
  }

  return updatedContent
}

/**
 * Generate CSS styles for logo positioning
 */
export function generateLogoCSS(settings: LogoPlacementSettings, logoUrl?: string): string {
  if (!logoUrl) return ''

  let css = ''

  // Cover logo styles
  if (settings.coverLogo.enabled) {
    const position = settings.coverLogo.position
    const size = settings.coverLogo.size

    const positionStyles = {
      'top-left': 'top: 2rem; left: 2rem;',
      'top-right': 'top: 2rem; right: 2rem;',
      'bottom-left': 'bottom: 2rem; left: 2rem;',
      'bottom-right': 'bottom: 2rem; right: 2rem;'
    }

    css += `
      .cover-logo {
        position: absolute;
        ${positionStyles[position]}
        width: ${size}%;
        height: auto;
        max-height: 4rem;
        object-fit: contain;
        z-index: 10;
        ${settings.coverLogo.autoInvert ? 'filter: invert(var(--logo-invert, 0));' : ''}
      }
      
      .cover-logo.nudge {
        transform: translateX(var(--logo-nudge-x, 0)) translateY(var(--logo-nudge-y, 0));
      }
    `
  }

  // Header logo styles
  if (settings.headerLogo.enabled) {
    css += `
      .header-logo {
        height: 2rem;
        width: auto;
        object-fit: contain;
        ${settings.headerLogo.style === 'grayscale' ? 'filter: grayscale(100%);' : ''}
      }
    `
  }

  // Footer logo styles
  if (settings.footerLogo.enabled) {
    css += `
      .footer-logo {
        height: 1.5rem;
        width: auto;
        object-fit: contain;
        ${settings.footerLogo.style === 'grayscale' ? 'filter: grayscale(100%);' : ''}
      }
    `
  }

  return css
}

/**
 * Check if logo overlaps with text and calculate nudge values
 */
export function calculateLogoNudge(
  logoPosition: LogoPlacementSettings['coverLogo']['position'],
  logoSize: number,
  textElements: Array<{ x: number; y: number; width: number; height: number }>
): { x: number; y: number } {
  // This is a simplified implementation
  // In a real implementation, you would analyze the actual layout
  const nudge = { x: 0, y: 0 }
  
  // Basic overlap detection and nudging logic
  textElements.forEach(element => {
    const logoRect = getLogoRect(logoPosition, logoSize)
    
    if (isOverlapping(logoRect, element)) {
      switch (logoPosition) {
        case 'top-left':
        case 'top-right':
          nudge.y = Math.max(nudge.y, element.height + 16)
          break
        case 'bottom-left':
        case 'bottom-right':
          nudge.y = Math.min(nudge.y, -(element.height + 16))
          break
      }
    }
  })

  return nudge
}

function getLogoRect(position: string, size: number) {
  // Simplified logo rectangle calculation
  const pageWidth = 1000 // Assume standard page width
  const logoWidth = (pageWidth * size) / 100
  const logoHeight = 64 // Assume max height

  switch (position) {
    case 'top-left':
      return { x: 32, y: 32, width: logoWidth, height: logoHeight }
    case 'top-right':
      return { x: pageWidth - logoWidth - 32, y: 32, width: logoWidth, height: logoHeight }
    case 'bottom-left':
      return { x: 32, y: 800 - logoHeight - 32, width: logoWidth, height: logoHeight }
    case 'bottom-right':
      return { x: pageWidth - logoWidth - 32, y: 800 - logoHeight - 32, width: logoWidth, height: logoHeight }
    default:
      return { x: 0, y: 0, width: logoWidth, height: logoHeight }
  }
}

function isOverlapping(rect1: any, rect2: any): boolean {
  return !(rect1.x + rect1.width < rect2.x || 
           rect2.x + rect2.width < rect1.x || 
           rect1.y + rect1.height < rect2.y || 
           rect2.y + rect2.height < rect1.y)
}