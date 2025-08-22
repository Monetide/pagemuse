import { PageMaster, LayoutIntent } from './document-model'

export interface LayoutPreset {
  id: LayoutIntent
  name: string
  description: string
  icon: string
  pageMaster: PageMaster
  features: string[]
}

export const LAYOUT_PRESETS: Record<LayoutIntent, LayoutPreset> = {
  'cover': {
    id: 'cover',
    name: 'Cover Page',
    description: 'Full-page layout for document covers and title pages',
    icon: '📄',
    pageMaster: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 2, right: 1.5, bottom: 2, left: 1.5 },
      columns: 1,
      columnGap: 0,
      hasHeader: false,
      hasFooter: false,
      baselineGrid: false,
      gridSpacing: 0.125,
      allowTableRotation: false
    },
    features: [
      'Single column layout',
      'Large margins for visual impact',
      'No headers or footers',
      'Centered content alignment'
    ]
  },
  
  'executive-summary': {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'Single-column layout optimized for executive summaries and key findings',
    icon: '📋',
    pageMaster: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 1, right: 1.25, bottom: 1, left: 1.25 },
      columns: 1,
      columnGap: 0,
      hasHeader: true,
      hasFooter: true,
      baselineGrid: true,
      gridSpacing: 0.167, // 6 lines per inch
      allowTableRotation: false
    },
    features: [
      'Single column for readability',
      'Headers and footers enabled',
      'Baseline grid for consistency',
      'Optimal line length for scanning'
    ]
  },
  
  'body': {
    id: 'body',
    name: 'Body Content',
    description: 'Two-column layout for main document content and detailed discussions',
    icon: '📰',
    pageMaster: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
      columns: 2,
      columnGap: 0.375,
      hasHeader: true,
      hasFooter: true,
      baselineGrid: true,
      gridSpacing: 0.167,
      allowTableRotation: false
    },
    features: [
      'Two-column layout for efficiency',
      'Narrow margins for more content',
      'Professional spacing',
      'Optimized for text-heavy content'
    ]
  },
  
  'data-appendix': {
    id: 'data-appendix',
    name: 'Data Appendix',
    description: 'Landscape layout optimized for tables, charts, and data visualization',
    icon: '📊',
    pageMaster: {
      pageSize: 'Letter',
      orientation: 'landscape',
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      columns: 1,
      columnGap: 0,
      hasHeader: true,
      hasFooter: true,
      baselineGrid: false,
      gridSpacing: 0.125,
      allowTableRotation: true
    },
    features: [
      'Landscape orientation',
      'Minimal margins for data',
      'Table rotation enabled',
      'Optimized for wide content'
    ]
  },
  
  'custom': {
    id: 'custom',
    name: 'Custom Layout',
    description: 'Fully customizable layout with manual configuration',
    icon: '⚙️',
    pageMaster: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 1, right: 1, bottom: 1, left: 1 },
      columns: 1,
      columnGap: 0.25,
      hasHeader: false,
      hasFooter: false,
      baselineGrid: false,
      gridSpacing: 0.125,
      allowTableRotation: false
    },
    features: [
      'Fully customizable',
      'All options available',
      'No preset constraints',
      'Manual configuration'
    ]
  }
}

/**
 * Apply a layout preset to a page master
 */
export function applyLayoutPreset(intent: LayoutIntent): PageMaster {
  const preset = LAYOUT_PRESETS[intent]
  if (!preset) {
    throw new Error(`Unknown layout intent: ${intent}`)
  }
  
  return { ...preset.pageMaster }
}

/**
 * Get layout preset by intent
 */
export function getLayoutPreset(intent: LayoutIntent): LayoutPreset | null {
  return LAYOUT_PRESETS[intent] || null
}

/**
 * Get all available layout presets
 */
export function getAllLayoutPresets(): LayoutPreset[] {
  return Object.values(LAYOUT_PRESETS)
}

/**
 * Detect layout intent from page master configuration
 */
export function detectLayoutIntent(pageMaster: PageMaster): LayoutIntent {
  // Check each preset to see if it matches
  for (const [intent, preset] of Object.entries(LAYOUT_PRESETS)) {
    const pm = preset.pageMaster
    
    // Check key characteristics
    const matches = (
      pm.orientation === pageMaster.orientation &&
      pm.columns === pageMaster.columns &&
      Math.abs(pm.margins.top - pageMaster.margins.top) < 0.1 &&
      Math.abs(pm.margins.right - pageMaster.margins.right) < 0.1 &&
      pm.allowTableRotation === pageMaster.allowTableRotation
    )
    
    if (matches) {
      return intent as LayoutIntent
    }
  }
  
  return 'custom'
}