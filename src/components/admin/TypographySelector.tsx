import { useState } from 'react'
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Type, Check } from 'lucide-react'

export interface TypographyPairing {
  id: string
  name: string
  description: string
  sans: {
    name: string
    family: string
    weights: string
  }
  serif: {
    name: string 
    family: string
    weights: string
  }
  preview: {
    sansSample: string
    serifSample: string
  }
}

const typographyPairings: TypographyPairing[] = [
  {
    id: 'inter-source-serif',
    name: 'Inter × Source Serif Pro',
    description: 'Clean modern sans with elegant serif',
    sans: {
      name: 'Inter',
      family: 'font-inter',
      weights: '400, 500, 600, 700'
    },
    serif: {
      name: 'Source Serif 4',
      family: 'font-source-serif', 
      weights: '400, 600, 700'
    },
    preview: {
      sansSample: 'Modern headings & UI',
      serifSample: 'Readable body text with character'
    }
  },
  {
    id: 'ibm-plex-lora',
    name: 'IBM Plex Sans × Lora',
    description: 'Technical precision meets warm readability',
    sans: {
      name: 'IBM Plex Sans',
      family: 'font-ibm-plex',
      weights: '400, 500, 600, 700'
    },
    serif: {
      name: 'Lora',
      family: 'font-lora',
      weights: '400, 500, 600, 700'
    },
    preview: {
      sansSample: 'Professional & structured',
      serifSample: 'Friendly serif with excellent legibility'
    }
  },
  {
    id: 'libre-franklin-crimson',
    name: 'Libre Franklin × Crimson Pro',
    description: 'Editorial style with academic authority',
    sans: {
      name: 'Libre Franklin',
      family: 'font-libre-franklin',
      weights: '400, 500, 600, 700'
    },
    serif: {
      name: 'Crimson Pro',
      family: 'font-crimson',
      weights: '400, 500, 600, 700'
    },
    preview: {
      sansSample: 'Editorial headlines & captions',
      serifSample: 'Academic text with scholarly feel'
    }
  },
  {
    id: 'source-sans-merriweather',
    name: 'Source Sans 3 × Merriweather',
    description: 'Clean utility font with traditional serif',
    sans: {
      name: 'Source Sans 3',
      family: 'font-source-sans-3',
      weights: '400, 500, 600, 700'
    },
    serif: {
      name: 'Merriweather',
      family: 'font-merriweather',
      weights: '400, 600, 700'
    },
    preview: {
      sansSample: 'Clear & functional headers',
      serifSample: 'Highly readable body text for long documents'
    }
  },
  {
    id: 'manrope-spectral',
    name: 'Manrope × Spectral',
    description: 'Geometric sans with optical serif design',
    sans: {
      name: 'Manrope',
      family: 'font-manrope',
      weights: '400, 500, 600, 700'
    },
    serif: {
      name: 'Spectral',
      family: 'font-spectral',
      weights: '400, 500, 600, 700'
    },
    preview: {
      sansSample: 'Geometric precision',
      serifSample: 'Optically optimized serif for digital reading'
    }
  },
  {
    id: 'plus-jakarta-lora',
    name: 'Plus Jakarta Sans × Lora',
    description: 'Contemporary rounded sans with warm serif',
    sans: {
      name: 'Plus Jakarta Sans',
      family: 'font-plus-jakarta',
      weights: '400, 500, 600, 700'
    },
    serif: {
      name: 'Lora',
      family: 'font-lora',
      weights: '400, 500, 600, 700'
    },
    preview: {
      sansSample: 'Modern & approachable',
      serifSample: 'Warm, calligraphic touch'
    }
  },
  {
    id: 'playfair-inter-editorial',
    name: 'Playfair Display × Inter',
    description: 'Dramatic serif headlines with clean sans body',
    sans: {
      name: 'Inter',
      family: 'font-inter',
      weights: '400, 500, 600, 700'
    },
    serif: {
      name: 'Playfair Display',
      family: 'font-playfair',
      weights: '400, 500, 600, 700'
    },
    preview: {
      sansSample: 'Clean, modern interface text',
      serifSample: 'Elegant display headlines with high contrast'
    }
  },
  {
    id: 'ibm-plex-merriweather',
    name: 'IBM Plex Sans × Merriweather',
    description: 'Industrial precision for manufacturing docs',
    sans: {
      name: 'IBM Plex Sans',
      family: 'font-ibm-plex',
      weights: '400, 500, 600, 700'
    },
    serif: {
      name: 'Merriweather',
      family: 'font-merriweather',
      weights: '400, 600, 700'
    },
    preview: {
      sansSample: 'Technical specifications',
      serifSample: 'Detailed technical documentation'
    }
  }
]

interface TypographySelectorProps {
  selectedPairing?: string
  onSelectionChange: (pairing: TypographyPairing) => void
  usageType?: string // Add usage type to determine default pairing
}

const TypographySelector = React.memo(function TypographySelector({ selectedPairing, onSelectionChange, usageType }: TypographySelectorProps) {
  
  // Get safe default pairing based on usage type
  const getDefaultPairing = (usage?: string): string => {
    switch (usage) {
      case 'white-paper':
      case 'case-study': 
        return 'playfair-inter-editorial' // Editorial style
      case 'report':
      case 'annual-report':
        return 'ibm-plex-merriweather' // Manufacturing/technical style
      case 'proposal':
        return 'source-sans-merriweather' // Professional style
      case 'ebook':
      default:
        return 'inter-source-serif' // Safe default
    }
  }

  const [activePairing, setActivePairing] = useState<string>(selectedPairing || getDefaultPairing(usageType))

  const handlePairingSelect = (pairing: TypographyPairing) => {
    setActivePairing(pairing.id)
    onSelectionChange(pairing)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="w-5 h-5 text-primary" />
          Typography Pairing
        </CardTitle>
        <CardDescription>
          Choose a curated font pairing for your template
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {typographyPairings.map((pairing) => {
            const isSelected = activePairing === pairing.id
            
            return (
              <Button
                key={pairing.id}
                variant="outline"
                className={`h-auto p-4 justify-start text-left transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handlePairingSelect(pairing)}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}
                      `}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div>
                        <div className="font-semibold text-base">{pairing.name}</div>
                        <div className="text-xs text-muted-foreground">{pairing.description}</div>
                      </div>
                    </div>

                    {/* Typography Samples */}
                    <div className="space-y-3 ml-8">
                      {/* Sans Sample */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">Sans</Badge>
                          <span className="text-xs font-medium text-muted-foreground">
                            {pairing.sans.name}
                          </span>
                        </div>
                        <div className={`${pairing.sans.family} text-template-h3 font-semibold`}>
                          {pairing.preview.sansSample}
                        </div>
                      </div>

                      {/* Serif Sample */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">Serif</Badge>
                          <span className="text-xs font-medium text-muted-foreground">
                            {pairing.serif.name}
                          </span>
                        </div>
                        <div className={`${pairing.serif.family} text-template-body`}>
                          {pairing.preview.serifSample}
                        </div>
                      </div>
                    </div>

                    {/* Typography Scale Preview */}
                    <div className="ml-8 pt-3 border-t border-border/50">
                      <div className="text-xs text-muted-foreground mb-2">Type Scale Preview</div>
                      <div className="space-y-2">
                        <div className={`${pairing.sans.family} text-template-h1 font-bold text-foreground`}>
                          H1 Heading
                        </div>
                        <div className={`${pairing.sans.family} text-template-h2 font-semibold text-foreground`}>
                          H2 Heading
                        </div>
                        <div className={`${pairing.sans.family} text-template-h3 font-medium text-foreground`}>
                          H3 Heading
                        </div>
                        <div className={`${pairing.serif.family} text-template-body text-muted-foreground`}>
                          Body text for comfortable reading with good line spacing and optimal character width for extended reading sessions.
                        </div>
                        <div className={`${pairing.serif.family} text-template-caption text-muted-foreground`}>
                          Caption text for small annotations
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
})

export { TypographySelector, typographyPairings }