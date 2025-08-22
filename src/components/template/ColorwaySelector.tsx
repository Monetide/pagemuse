import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, Palette, ChevronDown } from 'lucide-react'
import { TemplateColorway, TemplateThemeTokens } from '@/lib/template-model'
import { cn } from '@/lib/utils'

interface ColorwaySelectorProps {
  themeTokens: TemplateThemeTokens
  selectedColorway: string
  onColorwayChange: (colorwayId: string) => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'button' | 'palette' | 'compact'
}

export function ColorwaySelector({ 
  themeTokens, 
  selectedColorway, 
  onColorwayChange,
  size = 'md',
  variant = 'button'
}: ColorwaySelectorProps) {
  const [open, setOpen] = useState(false)
  
  const activeColorway = themeTokens.colorways.find(c => c.id === selectedColorway) || themeTokens.colorways[0]

  const ColorPalette = ({ colorway, isSelected, size: paletteSize = 'md' }: { 
    colorway: TemplateColorway, 
    isSelected: boolean,
    size?: 'sm' | 'md' | 'lg'
  }) => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    }
    
    const colors = [
      colorway.palette.primary,
      colorway.palette.accent,
      colorway.palette.success,
      colorway.palette.warning
    ]

    return (
      <div className="flex items-center gap-1">
        {colors.map((color, index) => (
          <div 
            key={index}
            className={cn(
              'rounded-full border-2 border-white shadow-sm',
              sizeClasses[paletteSize],
              isSelected && 'ring-2 ring-primary ring-offset-1'
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'palette') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Color Theme</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {themeTokens.colorways.map((colorway) => (
            <Card 
              key={colorway.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                selectedColorway === colorway.id && "ring-2 ring-primary"
              )}
              onClick={() => onColorwayChange(colorway.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <ColorPalette colorway={colorway} isSelected={selectedColorway === colorway.id} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{colorway.name}</span>
                      {colorway.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{colorway.description}</p>
                  </div>
                  {selectedColorway === colorway.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 gap-2"
          >
            <ColorPalette colorway={activeColorway} isSelected={false} size="sm" />
            <span className="text-xs">{activeColorway.name}</span>
            <ChevronDown className="w-3 h-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="end">
          <div className="space-y-1">
            {themeTokens.colorways.map((colorway) => (
              <div
                key={colorway.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent",
                  selectedColorway === colorway.id && "bg-accent"
                )}
                onClick={() => {
                  onColorwayChange(colorway.id)
                  setOpen(false)
                }}
              >
                <ColorPalette colorway={colorway} isSelected={selectedColorway === colorway.id} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{colorway.name}</span>
                    {colorway.isDefault && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{colorway.description}</p>
                </div>
                {selectedColorway === colorway.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // Default button variant
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span>{activeColorway.name}</span>
          </div>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Choose Color Theme</h4>
            <p className="text-sm text-muted-foreground">
              Select a colorway to change the visual theme of your template
            </p>
          </div>
          <div className="space-y-2">
            {themeTokens.colorways.map((colorway) => (
              <Card 
                key={colorway.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  selectedColorway === colorway.id && "ring-2 ring-primary"
                )}
                onClick={() => {
                  onColorwayChange(colorway.id)
                  setOpen(false)
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <ColorPalette colorway={colorway} isSelected={selectedColorway === colorway.id} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{colorway.name}</span>
                        {colorway.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{colorway.description}</p>
                    </div>
                    {selectedColorway === colorway.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}