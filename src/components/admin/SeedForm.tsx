import { useState, useCallback } from 'react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { TypographySelector, type TypographyPairing } from '@/components/admin/TypographySelector'
import { ColorwaySelector, type Colorway } from '@/components/admin/ColorwaySelector'
import { MotifSelector, type MotifSelection, type MotifAsset } from '@/components/admin/MotifSelector'
import { PageMasterSelector, type PageMasterSelection } from '@/components/admin/PageMasterSelector'
import { ObjectStyleSelector, type ObjectStyleSelection } from '@/components/admin/ObjectStyleSelector'
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { 
  Upload, 
  Image as ImageIcon, 
  Palette, 
  Sparkles,
  X,
  Check
} from 'lucide-react'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

const seedFormSchema = z.object({
  brandName: z.string().min(2, 'Brand name must be at least 2 characters').max(50, 'Brand name must be less than 50 characters'),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Please enter a valid hex color'),
  vibes: z.array(z.string()).min(1, 'Please select at least one vibe').max(3, 'Please select no more than 3 vibes'),
  usage: z.enum(['ebook', 'whitepaper', 'casestudy'], {
    required_error: 'Please select a usage type',
  }),
  typography: z.object({
    id: z.string(),
    name: z.string(),
    sans: z.object({
      name: z.string(),
      family: z.string(),
    }),
    serif: z.object({
      name: z.string(), 
      family: z.string(),
    }),
  }).optional(),
  colorway: z.object({
    id: z.string(),
    name: z.string(),
    colors: z.object({
      brand: z.string(),
      brandSecondary: z.string(),
      brandAccent: z.string(),
      textBody: z.string(),
      textMuted: z.string(),
      bgPage: z.string(),
      bgSection: z.string(),
      borderSubtle: z.string(),
    }),
    isCompliant: z.boolean(),
  }).optional(),
  motifs: z.object({
    selection: z.object({
      'body-bg': z.string(),
      'divider': z.string(),
      'cover-shape': z.string(),
    }),
    assets: z.array(z.any()),
  }).optional(),
  pageMasters: z.object({
    cover: z.string().nullable(),
    body: z.string().nullable(),
  }).optional(),
  objectStyles: z.object({
    styles: z.record(z.any()).optional(),
    snippets: z.array(z.string()).optional(),
  }).optional(),
  logo: z.any().optional(),
  referenceImage: z.any().optional(),
})

type SeedFormData = z.infer<typeof seedFormSchema>

const vibeOptions = [
  { id: 'modern', label: 'Modern', description: 'Clean, contemporary design' },
  { id: 'classic', label: 'Classic', description: 'Timeless, traditional elegance' },
  { id: 'editorial', label: 'Editorial', description: 'Magazine-style layouts' },
  { id: 'bold', label: 'Bold', description: 'Strong, impactful visuals' },
  { id: 'minimal', label: 'Minimal', description: 'Simple, focused approach' },
]

const usageOptions = [
  { 
    id: 'ebook', 
    label: 'E-book', 
    description: 'Long-form digital publication with chapters and sections'
  },
  { 
    id: 'whitepaper', 
    label: 'White Paper', 
    description: 'Authoritative report or guide on a specific topic'
  },
  { 
    id: 'casestudy', 
    label: 'Case Study', 
    description: 'Detailed analysis of a project or business scenario'
  },
]

interface SeedFormProps {
  onValidChange: (isValid: boolean, data?: SeedFormData) => void
}

export type { SeedFormData }

export function SeedForm({ onValidChange }: SeedFormProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [referencePreview, setReferencePreview] = useState<string | null>(null)

  const form = useForm<SeedFormData>({
    resolver: zodResolver(seedFormSchema),
    defaultValues: {
      brandName: '',
      primaryColor: '#8B5CF6', // Default to our primary purple
      vibes: [],
      usage: 'ebook',
      typography: {
        id: 'inter-source',
        name: 'Inter × Source Serif',
        sans: { name: 'Inter', family: 'font-inter' },
        serif: { name: 'Source Serif 4', family: 'font-source-serif' }
      },
      colorway: undefined,
      motifs: undefined,
      logo: undefined,
      referenceImage: undefined,
    },
    mode: 'onChange',
  })

  const { watch, setValue, formState } = form

  // Watch form changes to validate
  const watchedValues = watch()
  
  // Notify parent of validation state changes
  React.useEffect(() => {
    if (formState.isValid) {
      onValidChange(true, watchedValues)
    } else {
      onValidChange(false)
    }
  }, [formState.isValid, watchedValues, onValidChange])

  const handleFileUpload = useCallback((
    file: File,
    type: 'logo' | 'referenceImage'
  ) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, WebP)')
      return
    }
    
    if (file.size > MAX_FILE_SIZE) {
      alert('File size must be less than 10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (type === 'logo') {
        setLogoPreview(result)
        setValue('logo', file)
      } else {
        setReferencePreview(result)
        setValue('referenceImage', file)
      }
    }
    reader.readAsDataURL(file)
  }, [setValue])

  const handleVibeToggle = (vibeId: string) => {
    const currentVibes = watch('vibes')
    const newVibes = currentVibes.includes(vibeId)
      ? currentVibes.filter(v => v !== vibeId)
      : [...currentVibes, vibeId].slice(0, 3) // Max 3 vibes
    
    setValue('vibes', newVibes, { shouldValidate: true })
  }

  const handleTypographyChange = (pairing: TypographyPairing) => {
    setValue('typography', {
      id: pairing.id,
      name: pairing.name,
      sans: {
        name: pairing.sans.name,
        family: pairing.sans.family,
      },
      serif: {
        name: pairing.serif.name,
        family: pairing.serif.family,
      },
    }, { shouldValidate: true })
  }

  const handleColorwayChange = (colorway: Colorway) => {
    setValue('colorway', {
      id: colorway.id,
      name: colorway.name,
      colors: colorway.colors,
      isCompliant: colorway.isCompliant,
    }, { shouldValidate: true })
  }

  const handleMotifChange = (selection: MotifSelection, assets: MotifAsset[]) => {
    setValue('motifs', {
      selection,
      assets
    }, { shouldValidate: true })
  }

  const handlePageMasterChange = (selection: PageMasterSelection) => {
    setValue('pageMasters', selection, { shouldValidate: true })
  }

  const handleObjectStyleChange = (selection: ObjectStyleSelection) => {
    setValue('objectStyles', selection, { shouldValidate: true })
  }

  const removeFile = (type: 'logo' | 'referenceImage') => {
    if (type === 'logo') {
      setLogoPreview(null)
      setValue('logo', undefined)
    } else {
      setReferencePreview(null)
      setValue('referenceImage', undefined)
    }
  }

  return (
    <Form {...form}>
      <div className="space-y-8">
        {/* Brand Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Brand Information
            </CardTitle>
            <CardDescription>
              Define your brand identity and visual foundation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Brand Name */}
            <FormField
              control={form.control}
              name="brandName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your brand or company name" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    This will appear in headers and throughout your template
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Logo Upload */}
            <div className="space-y-3">
              <Label>Logo (Optional)</Label>
              <div className="space-y-4">
                {logoPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-16 w-auto border border-border rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => removeFile('logo')}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept={ACCEPTED_IMAGE_TYPES.join(',')}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'logo')
                      }}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload your logo
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, WebP up to 10MB
                      </p>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Primary Color */}
            <FormField
              control={form.control}
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Color *</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          {...field}
                          className="h-10 w-16 rounded-md border border-input cursor-pointer"
                        />
                        <Palette className="absolute inset-0 w-4 h-4 m-auto pointer-events-none text-white mix-blend-difference" />
                      </div>
                      <Input
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="#8B5CF6"
                        className="flex-1 max-w-32 font-mono"
                      />
                      <div 
                        className="h-10 w-16 rounded-md border border-input"
                        style={{ backgroundColor: field.value }}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    This will be used for headings, accents, and key design elements
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Design Vibes */}
        <Card>
          <CardHeader>
            <CardTitle>Design Vibes</CardTitle>
            <CardDescription>
              Select 1-3 design styles that match your brand personality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {vibeOptions.map((vibe) => {
                const isSelected = watch('vibes').includes(vibe.id)
                return (
                  <Button
                    key={vibe.id}
                    type="button"
                    variant="outline"
                    className={`h-auto p-4 justify-start text-left transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleVibeToggle(vibe.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}
                      `}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div>
                        <div className="font-medium">{vibe.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {vibe.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                )
              })}
            </div>
            {form.formState.errors.vibes && (
              <p className="text-sm font-medium text-destructive mt-2">
                {form.formState.errors.vibes.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Usage Type */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Type</CardTitle>
            <CardDescription>
              What type of document will this template be used for?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="usage"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 gap-4"
                    >
                      {usageOptions.map((option) => (
                        <FormItem key={option.id} className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={option.id} />
                          </FormControl>
                          <div className="flex-1">
                            <FormLabel className="font-medium">
                              {option.label}
                            </FormLabel>
                            <FormDescription className="mt-1">
                              {option.description}
                            </FormDescription>
                          </div>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Colorways */}
        <ColorwaySelector 
          brandColor={watch('primaryColor')}
          selectedColorway={watch('colorway')?.id}
          onSelectionChange={handleColorwayChange}
        />

        {/* SVG Motifs */}
        <MotifSelector 
          colors={watch('colorway') ? {
            brand: watch('colorway')!.colors.brand,
            brandSecondary: watch('colorway')!.colors.brandSecondary,
            borderSubtle: watch('colorway')!.colors.borderSubtle,
            textMuted: watch('colorway')!.colors.textMuted,
          } : undefined}
          selectedMotifs={watch('motifs')?.selection}
          onSelectionChange={handleMotifChange}
        />

        {/* Typography Pairing */}
        <TypographySelector 
          selectedPairing={watch('typography')?.id}
          onSelectionChange={handleTypographyChange}
        />

        {/* Page Masters */}
        <PageMasterSelector 
          selection={watch('pageMasters')}
          onSelectionChange={handlePageMasterChange}
        />

        {/* Object Styles & Snippets */}
        <ObjectStyleSelector 
          selection={watch('objectStyles')}
          onSelectionChange={handleObjectStyleChange}
        />

        {/* Reference Image */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              Reference Image (Optional)
            </CardTitle>
            <CardDescription>
              Upload an image to match the style and aesthetic you're looking for
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referencePreview ? (
              <div className="relative inline-block">
                <img
                  src={referencePreview}
                  alt="Reference preview"
                  className="max-h-48 w-auto border border-border rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => removeFile('referenceImage')}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'referenceImage')
                  }}
                  className="hidden"
                  id="reference-upload"
                />
                <label htmlFor="reference-upload" className="cursor-pointer">
                  <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">
                    Upload Reference Image
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">
                    Screenshots, designs, or inspiration images work great
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WebP up to 10MB
                  </p>
                </label>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Form>
  )
}