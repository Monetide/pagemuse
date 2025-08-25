// Registry Manager - Centralized access to all template generation registries

import { DocType, getDocType, getAllDocTypes, hasDocType, registerDocType } from './doc-type-registry'
import { StylePack, getStylePack, getAllStylePacks, hasStylePack, registerStylePack } from './style-pack-registry'
import { Industry, getIndustry, getAllIndustries, hasIndustry, registerIndustry } from './industry-registry'

export interface RegistryStatus {
  docTypes: {
    total: number
    autoCreated: number
  }
  stylePacks: {
    total: number
    autoCreated: number
  }
  industries: {
    total: number
    autoCreated: number
  }
}

// Track auto-created items for health reporting
const autoCreatedItems = {
  docTypes: new Set<string>(),
  stylePacks: new Set<string>(),
  industries: new Set<string>()
}

// Enhanced registry functions that track auto-creation
export function getDocTypeWithTracking(id: string): DocType {
  const existed = hasDocType(id)
  const docType = getDocType(id)
  
  if (!existed) {
    autoCreatedItems.docTypes.add(id)
  }
  
  return docType
}

export function getStylePackWithTracking(id: string): StylePack {
  const existed = hasStylePack(id)
  const stylePack = getStylePack(id)
  
  if (!existed) {
    autoCreatedItems.stylePacks.add(id)
  }
  
  return stylePack
}

export function getIndustryWithTracking(id: string): Industry {
  const existed = hasIndustry(id)
  const industry = getIndustry(id)
  
  if (!existed) {
    autoCreatedItems.industries.add(id)
  }
  
  return industry
}

// Registry status for health check
export function getRegistryStatus(): RegistryStatus {
  return {
    docTypes: {
      total: getAllDocTypes().length,
      autoCreated: autoCreatedItems.docTypes.size
    },
    stylePacks: {
      total: getAllStylePacks().length,
      autoCreated: autoCreatedItems.stylePacks.size
    },
    industries: {
      total: getAllIndustries().length,
      autoCreated: autoCreatedItems.industries.size
    }
  }
}

// Clear auto-created tracking (useful for tests)
export function clearAutoCreatedTracking(): void {
  autoCreatedItems.docTypes.clear()
  autoCreatedItems.stylePacks.clear()
  autoCreatedItems.industries.clear()
}

// Bulk registration functions
export function registerBulkDocTypes(docTypes: DocType[]): void {
  docTypes.forEach(registerDocType)
}

export function registerBulkStylePacks(stylePacks: StylePack[]): void {
  stylePacks.forEach(registerStylePack)
}

export function registerBulkIndustries(industries: Industry[]): void {
  industries.forEach(registerIndustry)
}

// Registry validation
export function validateRegistries(): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check minimum registrations
  if (getAllDocTypes().length === 0) {
    errors.push('No document types registered')
  }
  
  if (getAllStylePacks().length === 0) {
    errors.push('No style packs registered')
  }
  
  if (getAllIndustries().length === 0) {
    errors.push('No industries registered')
  }
  
  // Check for auto-created items
  if (autoCreatedItems.docTypes.size > 0) {
    warnings.push(`${autoCreatedItems.docTypes.size} document types were auto-created`)
  }
  
  if (autoCreatedItems.stylePacks.size > 0) {
    warnings.push(`${autoCreatedItems.stylePacks.size} style packs were auto-created`)
  }
  
  if (autoCreatedItems.industries.size > 0) {
    warnings.push(`${autoCreatedItems.industries.size} industries were auto-created`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Export all registry functions for convenience
export {
  // Doc Types
  getDocType,
  getAllDocTypes,
  hasDocType,
  registerDocType,
  
  // Style Packs
  getStylePack,
  getAllStylePacks,
  hasStylePack,
  registerStylePack,
  
  // Industries
  getIndustry,
  getAllIndustries,
  hasIndustry,
  registerIndustry
}

export type {
  DocType,
  StylePack,
  Industry
}