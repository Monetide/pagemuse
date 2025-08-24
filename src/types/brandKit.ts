// Brand Kit Types
export interface BrandKitPalette {
  primary: string;
  secondary: string;
  accent: string;
}

export interface BrandKitNeutrals {
  textBody: string;
  textMuted: string;
  bgPage: string;
  bgSection: string;
  borderSubtle: string;
}

export interface BrandKitFonts {
  heading?: string;
  body?: string;
}

export interface BrandKit {
  id: string;
  workspace_id: string;
  name: string;
  logo_primary_url?: string;
  logo_alt_url?: string;
  palette: BrandKitPalette;
  neutrals: BrandKitNeutrals;
  fonts?: BrandKitFonts;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BrandKitMap {
  id: string;
  brand_kit_id: string;
  token_name: string;
  hex: string;
  created_at: string;
}

export interface KitApplication {
  id: string;
  target_type: 'template' | 'document';
  target_id: string;
  brand_kit_id: string;
  follow_updates: boolean;
  applied_by: string;
  applied_at: string;
  snapshot: any;
}

// Logo placement settings interface
export interface LogoPlacementSettings {
  coverLogo: {
    enabled: boolean
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    size: number // 8-14% of page width
    autoInvert: boolean
    nudgeOnOverlap: boolean
  }
  headerLogo: {
    enabled: boolean
    style: 'grayscale' | 'primary'
  }
  footerLogo: {
    enabled: boolean
    style: 'grayscale' | 'primary'
  }
}

export type CreateBrandKitData = Omit<BrandKit, 'id' | 'created_at' | 'updated_at' | 'created_by'>;
export type UpdateBrandKitData = Partial<Omit<BrandKit, 'id' | 'workspace_id' | 'created_by' | 'created_at' | 'updated_at'>>;
export type CreateKitApplicationData = Omit<KitApplication, 'id' | 'applied_at' | 'applied_by'>;