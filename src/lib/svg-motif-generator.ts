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
  const opacityNum = 0.08 // 8% opacity for subtlety
  const opacity = "0.08"
  const strokeWidth = "0.5"
  
  return [
    {
      id: 'isometric-grid-faint',
      name: 'Isometric Grid',
      svg: `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="iso-grid" width="60" height="52" patternUnits="userSpaceOnUse">
            <path d="M30,0 L60,17 L30,35 L0,17 Z" fill="none" stroke="${colors.brand}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            <path d="M0,17 L30,35 L30,70 L0,52 Z" fill="none" stroke="${colors.brandSecondary}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            <path d="M30,35 L60,17 L60,52 L30,70 Z" fill="none" stroke="${colors.brandSecondary}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
          </pattern>
        </defs>
        <rect width="400" height="400" fill="url(#iso-grid)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="iso-p" width="20" height="17" patternUnits="userSpaceOnUse"><path d="M10,0 L20,6 L10,12 L0,6 Z" fill="none" stroke="${colors.brand}" stroke-width="0.4" opacity="0.3"/></pattern></defs><rect width="100" height="60" fill="url(#iso-p)"/></svg>`)}`
    },
    {
      id: 'soft-waves-faint',
      name: 'Soft Waves',
      svg: `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="soft-waves" width="120" height="80" patternUnits="userSpaceOnUse">
            <path d="M0,40 Q30,20 60,40 T120,40" fill="none" stroke="${colors.brand}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            <path d="M0,0 Q30,20 60,0 T120,0" fill="none" stroke="${colors.brandSecondary}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            <path d="M0,80 Q30,60 60,80 T120,80" fill="none" stroke="${colors.brandSecondary}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
          </pattern>
        </defs>
        <rect width="400" height="400" fill="url(#soft-waves)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="sw-p" width="30" height="20" patternUnits="userSpaceOnUse"><path d="M0,10 Q7.5,5 15,10 T30,10" fill="none" stroke="${colors.brand}" stroke-width="0.4" opacity="0.3"/></pattern></defs><rect width="100" height="60" fill="url(#sw-p)"/></svg>`)}`
    },
    {
      id: 'fine-grid-lines',
      name: 'Fine Grid Lines',
      svg: `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="fine-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40,0 L0,0 L0,40" fill="none" stroke="${colors.borderSubtle}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
          </pattern>
        </defs>
        <rect width="400" height="400" fill="url(#fine-grid)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="fg-p" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10,0 L0,0 L0,10" fill="none" stroke="${colors.borderSubtle}" stroke-width="0.3" opacity="0.3"/></pattern></defs><rect width="100" height="60" fill="url(#fg-p)"/></svg>`)}`
    },
    {
      id: 'blueprint-hatch',
      name: 'Blueprint Hatch',
      svg: `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="blueprint" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M0,0 L20,20" stroke="${colors.brand}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            <path d="M0,20 L20,0" stroke="${colors.brandSecondary}" stroke-width="${strokeWidth}" opacity="${(opacityNum * 0.7).toFixed(3)}"/>
          </pattern>
        </defs>
        <rect width="400" height="400" fill="url(#blueprint)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="bp-p" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0,0 L8,8" stroke="${colors.brand}" stroke-width="0.3" opacity="0.3"/></pattern></defs><rect width="100" height="60" fill="url(#bp-p)"/></svg>`)}`
    },
    {
      id: 'rounded-blobs',
      name: 'Rounded Blobs',
      svg: `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="blobs" width="100" height="100" patternUnits="userSpaceOnUse">
            <circle cx="25" cy="25" r="8" fill="${colors.brand}" opacity="${opacity}"/>
            <ellipse cx="75" cy="75" rx="12" ry="8" fill="${colors.brandSecondary}" opacity="${opacity}"/>
            <circle cx="75" cy="25" r="6" fill="${colors.brand}" opacity="${(opacityNum * 0.8).toFixed(3)}"/>
            <ellipse cx="25" cy="75" rx="8" ry="10" fill="${colors.brandSecondary}" opacity="${(opacityNum * 0.8).toFixed(3)}"/>
          </pattern>
        </defs>
        <rect width="400" height="400" fill="url(#blobs)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="bl-p" width="25" height="25" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="2" fill="${colors.brand}" opacity="0.3"/><circle cx="19" cy="19" r="2" fill="${colors.brandSecondary}" opacity="0.3"/></pattern></defs><rect width="100" height="60" fill="url(#bl-p)"/></svg>`)}`
    },
    {
      id: 'city-grid-faint',
      name: 'City Grid',
      svg: `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="city-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="80" height="80" fill="none" stroke="${colors.borderSubtle}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            <rect x="20" y="20" width="40" height="40" fill="none" stroke="${colors.brand}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            <rect x="30" y="30" width="20" height="20" fill="${colors.brandSecondary}" opacity="${(opacityNum * 0.5).toFixed(3)}"/>
          </pattern>
        </defs>
        <rect width="400" height="400" fill="url(#city-grid)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="cg-p" width="20" height="20" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="20" height="20" fill="none" stroke="${colors.borderSubtle}" stroke-width="0.3" opacity="0.3"/><rect x="5" y="5" width="10" height="10" fill="none" stroke="${colors.brand}" stroke-width="0.3" opacity="0.3"/></pattern></defs><rect width="100" height="60" fill="url(#cg-p)"/></svg>`)}`
    },
    {
      id: 'diagonal-hatch-soft',
      name: 'Diagonal Hatch',
      svg: `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="diag-hatch" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="30" stroke="${colors.brand}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            <line x1="15" y1="0" x2="15" y2="30" stroke="${colors.brandSecondary}" stroke-width="${strokeWidth}" opacity="${(opacityNum * 0.7).toFixed(3)}"/>
          </pattern>
        </defs>
        <rect width="400" height="400" fill="url(#diag-hatch)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="dh-p" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="${colors.brand}" stroke-width="0.3" opacity="0.3"/></pattern></defs><rect width="100" height="60" fill="url(#dh-p)"/></svg>`)}`
    },
    {
      id: 'chevrons-faint',
      name: 'Chevrons',
      svg: `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="chevrons" width="60" height="40" patternUnits="userSpaceOnUse">
            <path d="M15,10 L30,20 L15,30" fill="none" stroke="${colors.brand}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            <path d="M45,10 L60,20 L45,30" fill="none" stroke="${colors.brandSecondary}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
          </pattern>
        </defs>
        <rect width="400" height="400" fill="url(#chevrons)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="ch-p" width="20" height="15" patternUnits="userSpaceOnUse"><path d="M5,5 L10,7.5 L5,10" fill="none" stroke="${colors.brand}" stroke-width="0.4" opacity="0.3"/></pattern></defs><rect width="100" height="60" fill="url(#ch-p)"/></svg>`)}`
    }
  ]
}

// Generate divider SVGs - clean rules with variation
export function generateDividers(colors: MotifColors): MotifVariant[] {
  return [
    {
      id: 'thin-rule',
      name: 'Thin Rule',
      svg: `<svg width="400" height="2" viewBox="0 0 400 2" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="1" x2="400" y2="1" stroke="${colors.borderSubtle}" stroke-width="0.5"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="2" viewBox="0 0 80 2" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="1" x2="80" y2="1" stroke="${colors.borderSubtle}" stroke-width="0.5"/></svg>`)}`
    },
    {
      id: 'double-hairline',
      name: 'Double Hairline',
      svg: `<svg width="400" height="6" viewBox="0 0 400 6" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="1.5" x2="400" y2="1.5" stroke="${colors.borderSubtle}" stroke-width="0.5"/>
        <line x1="0" y1="4.5" x2="400" y2="4.5" stroke="${colors.borderSubtle}" stroke-width="0.5"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="6" viewBox="0 0 80 6" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="1.5" x2="80" y2="1.5" stroke="${colors.borderSubtle}" stroke-width="0.5"/><line x1="0" y1="4.5" x2="80" y2="4.5" stroke="${colors.borderSubtle}" stroke-width="0.5"/></svg>`)}`
    },
    {
      id: 'dotted-rule',
      name: 'Dotted Rule',
      svg: `<svg width="400" height="4" viewBox="0 0 400 4" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="2" x2="400" y2="2" stroke="${colors.borderSubtle}" stroke-width="1" stroke-dasharray="2,4"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="4" viewBox="0 0 80 4" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="2" x2="80" y2="2" stroke="${colors.borderSubtle}" stroke-width="1" stroke-dasharray="1,2"/></svg>`)}`
    },
    {
      id: 'soft-rule',
      name: 'Soft Rule',
      svg: `<svg width="400" height="4" viewBox="0 0 400 4" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="soft-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${colors.borderSubtle}" stop-opacity="0"/>
            <stop offset="50%" stop-color="${colors.borderSubtle}" stop-opacity="1"/>
            <stop offset="100%" stop-color="${colors.borderSubtle}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <line x1="0" y1="2" x2="400" y2="2" stroke="url(#soft-grad)" stroke-width="1"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="4" viewBox="0 0 80 4" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sg-p" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${colors.borderSubtle}" stop-opacity="0"/><stop offset="50%" stop-color="${colors.borderSubtle}" stop-opacity="1"/><stop offset="100%" stop-color="${colors.borderSubtle}" stop-opacity="0"/></linearGradient></defs><line x1="0" y1="2" x2="80" y2="2" stroke="url(#sg-p)" stroke-width="1"/></svg>`)}`
    },
    {
      id: 'thick-accent',
      name: 'Thick Accent',
      svg: `<svg width="400" height="8" viewBox="0 0 400 8" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="4" x2="400" y2="4" stroke="${colors.brand}" stroke-width="3"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="8" viewBox="0 0 80 8" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="4" x2="80" y2="4" stroke="${colors.brand}" stroke-width="2"/></svg>`)}`
    },
    {
      id: 'hairline',
      name: 'Hairline',
      svg: `<svg width="400" height="1" viewBox="0 0 400 1" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="0.5" x2="400" y2="0.5" stroke="${colors.textMuted}" stroke-width="0.25"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="1" viewBox="0 0 80 1" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="0.5" x2="80" y2="0.5" stroke="${colors.textMuted}" stroke-width="0.25"/></svg>`)}`
    },
    {
      id: 'rule-with-subtle-cap',
      name: 'Rule with Subtle Cap',
      svg: `<svg width="400" height="6" viewBox="0 0 400 6" xmlns="http://www.w3.org/2000/svg">
        <line x1="20" y1="3" x2="380" y2="3" stroke="${colors.borderSubtle}" stroke-width="1"/>
        <circle cx="20" cy="3" r="2" fill="${colors.brand}" opacity="0.6"/>
        <circle cx="380" cy="3" r="2" fill="${colors.brand}" opacity="0.6"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="6" viewBox="0 0 80 6" xmlns="http://www.w3.org/2000/svg"><line x1="5" y1="3" x2="75" y2="3" stroke="${colors.borderSubtle}" stroke-width="0.8"/><circle cx="5" cy="3" r="1" fill="${colors.brand}" opacity="0.6"/><circle cx="75" cy="3" r="1" fill="${colors.brand}" opacity="0.6"/></svg>`)}`
    }
  ]
}

// Generate cover shape SVGs - geometric heroes with variety
export function generateCoverShapes(colors: MotifColors): MotifVariant[] {
  return [
    {
      id: 'tilted-ribbon',
      name: 'Tilted Ribbon',
      svg: `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ribbon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${colors.brand}"/>
            <stop offset="100%" stop-color="${colors.brandSecondary}"/>
          </linearGradient>
        </defs>
        <polygon points="80,100 320,50 320,150 80,200" fill="url(#ribbon-grad)" transform="rotate(-15 200 150)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="60" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="rg-1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${colors.brand}"/><stop offset="100%" stop-color="${colors.brandSecondary}"/></linearGradient></defs><polygon points="16,25 64,15 64,35 16,45" fill="url(#rg-1)" transform="rotate(-15 40 30)"/></svg>`)}`
    },
    {
      id: 'rounded-petal',
      name: 'Rounded Petal',
      svg: `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="petal-grad" cx="30%" cy="30%">
            <stop offset="0%" stop-color="${colors.brand}"/>
            <stop offset="100%" stop-color="${colors.brandSecondary}" stop-opacity="0.8"/>
          </radialGradient>
        </defs>
        <path d="M200,80 Q280,120 240,200 Q200,240 160,200 Q120,120 200,80 Z" fill="url(#petal-grad)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="60" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="pg-1" cx="30%" cy="30%"><stop offset="0%" stop-color="${colors.brand}"/><stop offset="100%" stop-color="${colors.brandSecondary}" stop-opacity="0.8"/></radialGradient></defs><path d="M40,16 Q56,24 48,40 Q40,48 32,40 Q24,24 40,16 Z" fill="url(#pg-1)"/></svg>`)}`
    },
    {
      id: 'angled-band',
      name: 'Angled Band',
      svg: `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="band-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${colors.brand}"/>
            <stop offset="100%" stop-color="${colors.brandSecondary}"/>
          </linearGradient>
        </defs>
        <polygon points="50,120 350,80 370,140 70,180" fill="url(#band-grad)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="60" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg-1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="${colors.brand}"/><stop offset="100%" stop-color="${colors.brandSecondary}"/></linearGradient></defs><polygon points="10,24 70,16 74,28 14,36" fill="url(#bg-1)"/></svg>`)}`
    },
    {
      id: 'gear-quarter',
      name: 'Gear Quarter',
      svg: `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="gear-grad" cx="50%" cy="50%">
            <stop offset="0%" stop-color="${colors.brand}"/>
            <stop offset="100%" stop-color="${colors.brandSecondary}"/>
          </radialGradient>
        </defs>
        <path d="M320,80 L360,100 L350,140 L320,160 L300,140 L280,120 L300,100 L320,80 Z" fill="url(#gear-grad)"/>
        <circle cx="320" cy="130" r="25" fill="${colors.brand}" opacity="0.8"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="60" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="gg-1" cx="50%" cy="50%"><stop offset="0%" stop-color="${colors.brand}"/><stop offset="100%" stop-color="${colors.brandSecondary}"/></radialGradient></defs><path d="M64,16 L72,20 L70,28 L64,32 L60,28 L56,24 L60,20 L64,16 Z" fill="url(#gg-1)"/><circle cx="64" cy="26" r="5" fill="${colors.brand}" opacity="0.8"/></svg>`)}`
    },
    {
      id: 'pill-stack',
      name: 'Pill Stack',
      svg: `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pill-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${colors.brand}"/>
            <stop offset="100%" stop-color="${colors.brandSecondary}"/>
          </linearGradient>
        </defs>
        <rect x="120" y="100" width="160" height="30" rx="15" fill="url(#pill-grad)"/>
        <rect x="140" y="140" width="120" height="25" rx="12.5" fill="${colors.brand}" opacity="0.7"/>
        <rect x="160" y="175" width="80" height="20" rx="10" fill="${colors.brandSecondary}" opacity="0.8"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="60" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="pg-pill" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${colors.brand}"/><stop offset="100%" stop-color="${colors.brandSecondary}"/></linearGradient></defs><rect x="24" y="20" width="32" height="6" rx="3" fill="url(#pg-pill)"/><rect x="28" y="28" width="24" height="5" rx="2.5" fill="${colors.brand}" opacity="0.7"/><rect x="32" y="35" width="16" height="4" rx="2" fill="${colors.brandSecondary}" opacity="0.8"/></svg>`)}`
    },
    {
      id: 'stepped-blocks',
      name: 'Stepped Blocks',
      svg: `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="step-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${colors.brand}"/>
            <stop offset="100%" stop-color="${colors.brandSecondary}"/>
          </linearGradient>
        </defs>
        <rect x="100" y="180" width="80" height="60" fill="url(#step-grad)"/>
        <rect x="160" y="140" width="80" height="100" fill="${colors.brand}" opacity="0.8"/>
        <rect x="220" y="100" width="80" height="140" fill="${colors.brandSecondary}" opacity="0.9"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="60" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sg-step" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${colors.brand}"/><stop offset="100%" stop-color="${colors.brandSecondary}"/></linearGradient></defs><rect x="20" y="36" width="16" height="12" fill="url(#sg-step)"/><rect x="32" y="28" width="16" height="20" fill="${colors.brand}" opacity="0.8"/><rect x="44" y="20" width="16" height="28" fill="${colors.brandSecondary}" opacity="0.9"/></svg>`)}`
    },
    {
      id: 'angled-chip',
      name: 'Angled Chip',
      svg: `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="chip-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${colors.brand}"/>
            <stop offset="100%" stop-color="${colors.brandSecondary}"/>
          </linearGradient>
        </defs>
        <polygon points="120,120 280,100 300,180 140,200" fill="url(#chip-grad)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="60" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="cg-chip" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${colors.brand}"/><stop offset="100%" stop-color="${colors.brandSecondary}"/></linearGradient></defs><polygon points="24,24 56,20 60,36 28,40" fill="url(#cg-chip)"/></svg>`)}`
    },
    {
      id: 'half-oval',
      name: 'Half Oval',
      svg: `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="oval-grad" cx="50%" cy="100%">
            <stop offset="0%" stop-color="${colors.brand}"/>
            <stop offset="100%" stop-color="${colors.brandSecondary}" stop-opacity="0.7"/>
          </radialGradient>
        </defs>
        <ellipse cx="200" cy="240" rx="120" ry="80" fill="url(#oval-grad)" clip-path="polygon(0% 0%, 100% 0%, 100% 100%)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="60" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="og-half" cx="50%" cy="100%"><stop offset="0%" stop-color="${colors.brand}"/><stop offset="100%" stop-color="${colors.brandSecondary}" stop-opacity="0.7"/></radialGradient></defs><ellipse cx="40" cy="48" rx="24" ry="16" fill="url(#og-half)" clip-path="polygon(0% 0%, 100% 0%, 100% 100%)"/></svg>`)}`
    },
    {
      id: 'chevron-tab',
      name: 'Chevron Tab',
      svg: `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="chevron-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${colors.brand}"/>
            <stop offset="100%" stop-color="${colors.brandSecondary}"/>
          </linearGradient>
        </defs>
        <polygon points="100,120 250,120 280,150 250,180 100,180" fill="url(#chevron-grad)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="60" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="cg-chev" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${colors.brand}"/><stop offset="100%" stop-color="${colors.brandSecondary}"/></linearGradient></defs><polygon points="20,24 50,24 56,30 50,36 20,36" fill="url(#cg-chev)"/></svg>`)}`
    },
    {
      id: 'flag-notch',
      name: 'Flag Notch',
      svg: `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="flag-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${colors.brand}"/>
            <stop offset="100%" stop-color="${colors.brandSecondary}"/>
          </linearGradient>
        </defs>
        <polygon points="100,110 280,110 260,150 280,190 100,190" fill="url(#flag-grad)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="60" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fg-flag" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${colors.brand}"/><stop offset="100%" stop-color="${colors.brandSecondary}"/></linearGradient></defs><polygon points="20,22 56,22 52,30 56,38 20,38" fill="url(#fg-flag)"/></svg>`)}`
    },
    {
      id: 'tall-arch',
      name: 'Tall Arch',
      svg: `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="arch-grad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="${colors.brand}"/>
            <stop offset="100%" stop-color="${colors.brandSecondary}"/>
          </linearGradient>
        </defs>
        <path d="M140,240 L140,120 Q140,80 180,80 L220,80 Q260,80 260,120 L260,240 Z" fill="url(#arch-grad)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="60" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ag-arch" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="${colors.brand}"/><stop offset="100%" stop-color="${colors.brandSecondary}"/></linearGradient></defs><path d="M28,48 L28,24 Q28,16 36,16 L44,16 Q52,16 52,24 L52,48 Z" fill="url(#ag-arch)"/></svg>`)}`
    },
    {
      id: 'corner-bracket',
      name: 'Corner Bracket',
      svg: `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bracket-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${colors.brand}"/>
            <stop offset="100%" stop-color="${colors.brandSecondary}"/>
          </linearGradient>
        </defs>
        <path d="M120,100 L120,80 L300,80 L300,100 L280,100 L280,220 L300,220 L300,240 L120,240 L120,220 L140,220 L140,100 Z" fill="url(#bracket-grad)"/>
      </svg>`,
      preview: `data:image/svg+xml,${encodeURIComponent(`<svg width="80" height="60" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg-bracket" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${colors.brand}"/><stop offset="100%" stop-color="${colors.brandSecondary}"/></linearGradient></defs><path d="M24,20 L24,16 L60,16 L60,20 L56,20 L56,44 L60,44 L60,48 L24,48 L24,44 L28,44 L28,20 Z" fill="url(#bg-bracket)"/></svg>`)}`
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