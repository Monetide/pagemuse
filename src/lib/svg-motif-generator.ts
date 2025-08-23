// SVG Motif Generator - Brand-aware procedural vector assets

export interface MotifVariant {
  id: string
  name: string
  svg: string
  preview: string
}

export interface MotifAsset {
  type: 'body-bg' | 'divider' | 'cover-shape'
  variants: MotifVariant[]
}

export interface MotifColors {
  brand: string
  brandSecondary: string
  borderSubtle: string
  textMuted: string
}

// Generate body background SVGs - subtle large-scale geometry
export function generateBodyBackgrounds(colors: MotifColors): MotifVariant[] {
  const opacity = "0.1" // 10% opacity for subtlety
  const strokeWidth = "0.75"
  
  return [
    {
      id: 'geometric-grid',
      name: 'Geometric Grid',
      svg: `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="${colors.brand}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            <circle cx="40" cy="40" r="12" fill="none" stroke="${colors.brand}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
          </pattern>
        </defs>
        <rect width="400" height="400" fill="url(#grid)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid-p" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="${colors.brand}" stroke-width="0.5" opacity="0.3"/></pattern></defs><rect width="100" height="60" fill="url(#grid-p)"/></svg>`)}`
    },
    {
      id: 'diagonal-waves',
      name: 'Diagonal Waves',
      svg: `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="waves" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M0,60 Q30,20 60,60 T120,60" fill="none" stroke="${colors.brand}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            <path d="M0,0 Q30,40 60,0 T120,0" fill="none" stroke="${colors.brandSecondary}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            <path d="M0,120 Q30,80 60,120 T120,120" fill="none" stroke="${colors.brandSecondary}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
          </pattern>
        </defs>
        <rect width="400" height="400" fill="url(#waves)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="waves-p" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M0,15 Q7.5,5 15,15 T30,15" fill="none" stroke="${colors.brand}" stroke-width="0.5" opacity="0.3"/></pattern></defs><rect width="100" height="60" fill="url(#waves-p)"/></svg>`)}`
    },
    {
      id: 'hexagon-mesh',
      name: 'Hexagon Mesh',
      svg: `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexagons" width="100" height="87" patternUnits="userSpaceOnUse">
            <polygon points="50,4 86,25 86,68 50,87 14,68 14,25" fill="none" stroke="${colors.brand}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            <polygon points="0,47 36,68 36,111 0,130 -36,111 -36,68" fill="none" stroke="${colors.brandSecondary}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            <polygon points="100,47 136,68 136,111 100,130 64,111 64,68" fill="none" stroke="${colors.brandSecondary}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
          </pattern>
        </defs>
        <rect width="400" height="400" fill="url(#hexagons)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="hex-p" width="25" height="22" patternUnits="userSpaceOnUse"><polygon points="12.5,1 21.5,6 21.5,17 12.5,22 3.5,17 3.5,6" fill="none" stroke="${colors.brand}" stroke-width="0.4" opacity="0.3"/></pattern></defs><rect width="100" height="60" fill="url(#hex-p)"/></svg>`)}`
    }
  ]
}

// Generate divider SVGs - simple rules with optional patterns
export function generateDividers(colors: MotifColors): MotifVariant[] {
  const strokeWidth = "1"
  
  return [
    {
      id: 'solid-line',
      name: 'Solid Line',
      svg: `<svg width="400" height="4" viewBox="0 0 400 4" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="2" x2="400" y2="2" stroke="${colors.borderSubtle}" stroke-width="${strokeWidth}"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="4" viewBox="0 0 80 4" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="2" x2="80" y2="2" stroke="${colors.borderSubtle}" stroke-width="1"/></svg>`)}`
    },
    {
      id: 'dashed-line',
      name: 'Dashed Line',
      svg: `<svg width="400" height="4" viewBox="0 0 400 4" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="2" x2="400" y2="2" stroke="${colors.borderSubtle}" stroke-width="${strokeWidth}" stroke-dasharray="8,4"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="4" viewBox="0 0 80 4" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="2" x2="80" y2="2" stroke="${colors.borderSubtle}" stroke-width="1" stroke-dasharray="4,2"/></svg>`)}`
    },
    {
      id: 'dotted-line',
      name: 'Dotted Line',
      svg: `<svg width="400" height="4" viewBox="0 0 400 4" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="2" x2="400" y2="2" stroke="${colors.borderSubtle}" stroke-width="${strokeWidth}" stroke-dasharray="2,6"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="4" viewBox="0 0 80 4" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="2" x2="80" y2="2" stroke="${colors.borderSubtle}" stroke-width="1" stroke-dasharray="1,3"/></svg>`)}`
    }
  ]
}

// Generate cover shape SVGs - clean geometric heroes
export function generateCoverShapes(colors: MotifColors): MotifVariant[] {
  return [
    {
      id: 'circle-gradient',
      name: 'Circle Gradient',
      svg: `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="circleGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${colors.brand}" stop-opacity="1"/>
            <stop offset="100%" stop-color="${colors.brandSecondary}" stop-opacity="0.8"/>
          </radialGradient>
        </defs>
        <circle cx="200" cy="150" r="120" fill="url(#circleGrad)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="60" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="cg-p" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${colors.brand}"/><stop offset="100%" stop-color="${colors.brandSecondary}" stop-opacity="0.8"/></radialGradient></defs><circle cx="40" cy="30" r="24" fill="url(#cg-p)"/></svg>`)}`
    },
    {
      id: 'triangle-solid',
      name: 'Triangle Solid',
      svg: `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="triGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${colors.brand}"/>
            <stop offset="100%" stop-color="${colors.brandSecondary}"/>
          </linearGradient>
        </defs>
        <polygon points="200,50 350,250 50,250" fill="url(#triGrad)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="60" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="tg-p" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${colors.brand}"/><stop offset="100%" stop-color="${colors.brandSecondary}"/></linearGradient></defs><polygon points="40,10 70,50 10,50" fill="url(#tg-p)"/></svg>`)}`
    },
    {
      id: 'rounded-rect',
      name: 'Rounded Rectangle',
      svg: `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="rectGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${colors.brand}"/>
            <stop offset="100%" stop-color="${colors.brandSecondary}"/>
          </linearGradient>
        </defs>
        <rect x="80" y="75" width="240" height="150" rx="30" ry="30" fill="url(#rectGrad)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="60" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="rg-p" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="${colors.brand}"/><stop offset="100%" stop-color="${colors.brandSecondary}"/></linearGradient></defs><rect x="16" y="15" width="48" height="30" rx="6" ry="6" fill="url(#rg-p)"/></svg>`)}`
    }
  ]
}

// Generate all motif assets
export function generateMotifAssets(colors: MotifColors): MotifAsset[] {
  return [
    {
      type: 'body-bg',
      variants: generateBodyBackgrounds(colors)
    },
    {
      type: 'divider',
      variants: generateDividers(colors)
    },
    {
      type: 'cover-shape',
      variants: generateCoverShapes(colors)
    }
  ]
}

// Shuffle function to randomize variant selection
export function shuffleMotifs(assets: MotifAsset[]): { 'body-bg': string; 'divider': string; 'cover-shape': string } {
  const selection = {
    'body-bg': '',
    'divider': '',
    'cover-shape': ''
  }
  
  assets.forEach(asset => {
    const randomIndex = Math.floor(Math.random() * asset.variants.length)
    if (asset.type === 'body-bg' || asset.type === 'divider' || asset.type === 'cover-shape') {
      selection[asset.type] = asset.variants[randomIndex].id
    }
  })
  
  return selection
}