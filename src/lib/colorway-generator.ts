// Colorway generation with WCAG AA compliance

export interface ColorwayColors {
  // Brand colors
  brand: string
  brandSecondary: string
  brandAccent: string
  
  // Neutrals
  textBody: string
  textMuted: string
  bgPage: string
  bgSection: string
  borderSubtle: string
  
  // Contrast ratios for validation
  contrastRatios: {
    bodyOnPage: number
    bodyOnSection: number
    mutedOnPage: number
    mutedOnSection: number
  }
}

export interface Colorway {
  id: string
  name: string
  description: string
  colors: ColorwayColors
  isCompliant: boolean
}

// Convert hex to HSL
export function hexToHsl(hex: string): [number, number, number] {
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

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

// Convert HSL to hex
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x
  }

  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)

  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? "0" + hex : hex
  }).join("")
}

// Calculate relative luminance
export function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const gamma = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)

  return 0.2126 * gamma(r) + 0.7152 * gamma(g) + 0.0722 * gamma(b)
}

// Calculate contrast ratio
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  return (lighter + 0.05) / (darker + 0.05)
}

// Adjust luminance to meet AA standard (4.5:1)
export function adjustForAACompliance(textColor: string, bgColor: string, targetRatio = 4.5): string {
  let currentRatio = getContrastRatio(textColor, bgColor)
  if (currentRatio >= targetRatio) return textColor

  const [h, s, l] = hexToHsl(textColor)
  const bgLum = getLuminance(bgColor)
  
  // Determine if we need to go lighter or darker
  const shouldGoDarker = bgLum > 0.5
  
  let adjustedL = l
  let attempts = 0
  const maxAttempts = 50

  while (currentRatio < targetRatio && attempts < maxAttempts) {
    if (shouldGoDarker) {
      adjustedL = Math.max(0, adjustedL - 2)
    } else {
      adjustedL = Math.min(100, adjustedL + 2)
    }
    
    const adjustedColor = hslToHex(h, s, adjustedL)
    currentRatio = getContrastRatio(adjustedColor, bgColor)
    attempts++
  }

  return hslToHex(h, s, adjustedL)
}

// Generate colorway variations
export function generateColorways(brandHex: string, industryHints?: { neutrals: string; accentSaturation: string }): Colorway[] {
  const [h, s, l] = hexToHsl(brandHex)
  
  // Apply industry hints for neutral tone
  const neutralTone = industryHints?.neutrals === 'warm' ? 'warm' : 'cool'
  const accentSatLevel = industryHints?.accentSaturation || 'medium'
  
  // Adjust saturation based on industry hints
  const satMultiplier = accentSatLevel === 'high' ? 1.2 : accentSatLevel === 'low' ? 0.7 : 1.0
  const adjustedSaturation = Math.min(s * satMultiplier, 100)
  
  // Base neutrals - adjust based on industry tone preference
  const baseTextBody = neutralTone === 'warm' ? "#2C1810" : "#1a1a1a"
  const baseTextMuted = neutralTone === 'warm' ? "#8B6F47" : "#666666"
  const baseBgPage = "#ffffff"
  const baseBorderSubtle = neutralTone === 'warm' ? "#E8DDD2" : "#e5e5e5"

  const colorways: Colorway[] = [
    {
      id: 'primary',
      name: 'Primary',
      description: 'Original brand color with complementary tones',
      colors: {
        brand: brandHex,
        brandSecondary: hslToHex((h + 30) % 360, Math.max(20, adjustedSaturation - 20), Math.min(90, l + 10)),
        brandAccent: hslToHex(h, Math.min(100, adjustedSaturation + 10), Math.max(20, l - 15)),
        textBody: baseTextBody,
        textMuted: baseTextMuted,
        bgPage: baseBgPage,
        bgSection: hslToHex(h, Math.max(10, adjustedSaturation - 70), Math.min(98, l + 30)),
        borderSubtle: baseBorderSubtle,
        contrastRatios: { bodyOnPage: 0, bodyOnSection: 0, mutedOnPage: 0, mutedOnSection: 0 }
      },
      isCompliant: false
    },
    {
      id: 'warm',
      name: 'Warm',
      description: 'Warmer tones with orange undertones',
      colors: {
        brand: hslToHex((h + 15) % 360, adjustedSaturation, l),
        brandSecondary: hslToHex((h + 45) % 360, Math.max(20, adjustedSaturation - 15), Math.min(85, l + 15)),
        brandAccent: hslToHex((h + 30) % 360, Math.min(100, adjustedSaturation + 5), Math.max(25, l - 10)),
        textBody: baseTextBody,
        textMuted: baseTextMuted,
        bgPage: baseBgPage,
        bgSection: hslToHex((h + 15) % 360, Math.max(8, adjustedSaturation - 75), Math.min(97, l + 35)),
        borderSubtle: baseBorderSubtle,
        contrastRatios: { bodyOnPage: 0, bodyOnSection: 0, mutedOnPage: 0, mutedOnSection: 0 }
      },
      isCompliant: false
    },
    {
      id: 'cool',
      name: 'Cool',
      description: 'Cooler tones with blue undertones',
      colors: {
        brand: hslToHex((h - 20 + 360) % 360, adjustedSaturation, l),
        brandSecondary: hslToHex((h - 50 + 360) % 360, Math.max(25, adjustedSaturation - 10), Math.min(88, l + 12)),
        brandAccent: hslToHex((h - 35 + 360) % 360, Math.min(95, adjustedSaturation + 8), Math.max(22, l - 12)),
        textBody: baseTextBody,
        textMuted: baseTextMuted,
        bgPage: baseBgPage,
        bgSection: hslToHex((h - 20 + 360) % 360, Math.max(12, adjustedSaturation - 65), Math.min(96, l + 32)),
        borderSubtle: baseBorderSubtle,
        contrastRatios: { bodyOnPage: 0, bodyOnSection: 0, mutedOnPage: 0, mutedOnSection: 0 }
      },
      isCompliant: false
    }
  ]

  // Apply AA compliance adjustments
  return colorways.map(colorway => {
    const colors = { ...colorway.colors }
    
    // Adjust text colors for AA compliance
    colors.textBody = adjustForAACompliance(colors.textBody, colors.bgPage, 4.5)
    colors.textBody = adjustForAACompliance(colors.textBody, colors.bgSection, 4.5)
    colors.textMuted = adjustForAACompliance(colors.textMuted, colors.bgPage, 4.5)
    colors.textMuted = adjustForAACompliance(colors.textMuted, colors.bgSection, 4.5)
    
    // Calculate final contrast ratios
    colors.contrastRatios = {
      bodyOnPage: getContrastRatio(colors.textBody, colors.bgPage),
      bodyOnSection: getContrastRatio(colors.textBody, colors.bgSection),
      mutedOnPage: getContrastRatio(colors.textMuted, colors.bgPage),
      mutedOnSection: getContrastRatio(colors.textMuted, colors.bgSection)
    }
    
    // Check compliance
    const isCompliant = Object.values(colors.contrastRatios).every(ratio => ratio >= 4.5)
    
    return {
      ...colorway,
      colors,
      isCompliant
    }
  })
}