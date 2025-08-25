import { supabase } from '@/integrations/supabase/client'

const SUPABASE_URL = 'https://dbrzfjekbfkjathotjcj.supabase.co'

export type RegistryType = 'docType' | 'stylePack' | 'industry'

export interface DocTypeData {
  pageMasters: string[]
  sectionOrder: string[]
  tocDefaults: {
    depth: string[]
  }
  validationPreset: string
}

export interface StylePackData {
  fontPairing: string[]
  scale: {
    bodyPt: number
    h3Pt: number
    h2Pt: number
    h1Pt: number
    baselinePt: number
    lineHeights: {
      body: number
      caption: number
    }
  }
  divider: string
  callout: string
  chartDefaults: {
    grid: string
    legend: string
    numberFormat: string
  }
}

export interface IndustryData {
  paletteHints: {
    accentSaturation: string
    neutrals: string
  }
  motifs: {
    bg: string
    divider: string
    coverShape: string
  }
  snippets: any[]
}

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  
  if (!token) {
    throw new Error('No authentication token available')
  }
  
  return token
}

export async function listRegistryIds(type: RegistryType): Promise<string[]> {
  const token = await getAuthToken()
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/template-gen-registry-list/${type}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to list ${type} registry: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.ids || []
}

export async function ensureRegistryEntry(type: RegistryType, id: string): Promise<{
  success: boolean
  created: boolean
  id?: string
  data?: DocTypeData | StylePackData | IndustryData
  message?: string
}> {
  const token = await getAuthToken()
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/template-gen-registry-ensure`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type, id })
  })
  
  if (!response.ok) {
    throw new Error(`Failed to ensure ${type} registry entry: ${response.statusText}`)
  }
  
  return response.json()
}

export async function bootstrapRegistries(): Promise<{
  success: boolean
  bootstrapped: {
    docTypes: number
    stylePacks: number
    industries: number
  }
}> {
  const token = await getAuthToken()
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/template-gen-registry-bootstrap`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to bootstrap registries: ${response.statusText}`)
  }
  
  return response.json()
}

export async function getRegistryEntry<T = DocTypeData | StylePackData | IndustryData>(
  type: RegistryType, 
  id: string
): Promise<T | null> {
  let tableName: string
  
  switch (type) {
    case 'docType':
      tableName = 'template_registry_doc_types'
      break
    case 'stylePack':
      tableName = 'template_registry_style_packs'
      break
    case 'industry':      
      tableName = 'template_registry_industries'
      break
    default:
      throw new Error(`Invalid registry type: ${type}`)
  }
  
  const { data, error } = await supabase.rpc('get_registry_entry', {
    table_name: tableName,
    entry_id: id
  })
    
  if (error) {
    throw error
  }
  
  return data || null
}

// Constants for the baseline IDs
export const BASELINE_DOC_TYPES = [
  'white-paper', 'report', 'ebook', 'case-study', 'proposal', 'annual-report'
]

export const BASELINE_STYLE_PACKS = [
  'professional', 'editorial', 'minimal', 'bold', 'technical', 'friendly'
]

export const BASELINE_INDUSTRIES = [
  'finance', 'insurance', 'real-estate', 'healthcare', 
  'manufacturing', 'tech-saas', 'consumer-goods', 'public-sector'
]