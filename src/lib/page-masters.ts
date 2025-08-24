import { PageMaster } from './document-model'

export interface PageMasterPreset {
  id: string
  name: string
  description: string
  pageSize: 'Letter' | 'A4'
  layoutType: 'cover-fullbleed' | 'body-1col' | 'body-2col' | 'body-1col-sidebar' | 'body-2col-sidebar'
  pageMaster: PageMaster
  sidebarConfig?: {
    width: number // Points
    position: 'left' | 'right'
    gap: number // Gap between main content and sidebar
  }
}

// Convert inches to points (1 inch = 72 points)
const INCH_TO_PT = 72
// Convert mm to points (1 mm = 2.834645669 points)
const MM_TO_PT = 2.834645669

export const PAGE_MASTER_PRESETS: PageMasterPreset[] = [
  // Letter Cover
  {
    id: 'cover-fullbleed-letter',
    name: 'Cover Fullbleed (Letter)',
    description: 'Full-page cover layout for Letter size',
    pageSize: 'Letter',
    layoutType: 'cover-fullbleed',
    pageMaster: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { 
        top: 1 * INCH_TO_PT, 
        right: 1 * INCH_TO_PT, 
        bottom: 1 * INCH_TO_PT, 
        left: 1 * INCH_TO_PT 
      },
      columns: 1,
      columnGap: 0,
      hasHeader: false,
      hasFooter: false,
      baselineGrid: true,
      gridSpacing: 12, // 12pt baseline
      allowTableRotation: false
    }
  },
  
  // A4 Cover
  {
    id: 'cover-fullbleed-a4',
    name: 'Cover Fullbleed (A4)', 
    description: 'Full-page cover layout for A4 size',
    pageSize: 'A4',
    layoutType: 'cover-fullbleed',
    pageMaster: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { 
        top: 25.4 * MM_TO_PT, 
        right: 25.4 * MM_TO_PT, 
        bottom: 25.4 * MM_TO_PT, 
        left: 25.4 * MM_TO_PT 
      },
      columns: 1,
      columnGap: 0,
      hasHeader: false,
      hasFooter: false,
      baselineGrid: true,
      gridSpacing: 12, // 12pt baseline
      allowTableRotation: false
    }
  },

  // Letter Body 1-column
  {
    id: 'body-1col-letter',
    name: 'Body 1-Column (Letter)',
    description: 'Single column body layout for Letter size',
    pageSize: 'Letter',
    layoutType: 'body-1col',
    pageMaster: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { 
        top: 1 * INCH_TO_PT, 
        right: 1 * INCH_TO_PT, 
        bottom: 1 * INCH_TO_PT, 
        left: 1 * INCH_TO_PT 
      },
      columns: 1,
      columnGap: 0,
      hasHeader: true,
      hasFooter: true,
      baselineGrid: true,
      gridSpacing: 12, // 12pt baseline
      allowTableRotation: false
    }
  },

  // A4 Body 1-column
  {
    id: 'body-1col-a4',
    name: 'Body 1-Column (A4)',
    description: 'Single column body layout for A4 size',
    pageSize: 'A4',
    layoutType: 'body-1col',
    pageMaster: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { 
        top: 25.4 * MM_TO_PT, 
        right: 25.4 * MM_TO_PT, 
        bottom: 25.4 * MM_TO_PT, 
        left: 25.4 * MM_TO_PT 
      },
      columns: 1,
      columnGap: 0,
      hasHeader: true,
      hasFooter: true,
      baselineGrid: true,
      gridSpacing: 12, // 12pt baseline
      allowTableRotation: false
    }
  },

  // Letter Body 2-column
  {
    id: 'body-2col-letter',
    name: 'Body 2-Column (Letter)',
    description: 'Two column body layout for Letter size',
    pageSize: 'Letter',
    layoutType: 'body-2col',
    pageMaster: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { 
        top: 1 * INCH_TO_PT, 
        right: 1 * INCH_TO_PT, 
        bottom: 1 * INCH_TO_PT, 
        left: 1 * INCH_TO_PT 
      },
      columns: 2,
      columnGap: 0.25 * INCH_TO_PT, // 0.25in gutter
      hasHeader: true,
      hasFooter: true,
      baselineGrid: true,
      gridSpacing: 12, // 12pt baseline
      allowTableRotation: false
    }
  },

  // A4 Body 2-column
  {
    id: 'body-2col-a4',
    name: 'Body 2-Column (A4)',
    description: 'Two column body layout for A4 size',
    pageSize: 'A4',
    layoutType: 'body-2col',
    pageMaster: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { 
        top: 25.4 * MM_TO_PT, 
        right: 25.4 * MM_TO_PT, 
        bottom: 25.4 * MM_TO_PT, 
        left: 25.4 * MM_TO_PT 
      },
      columns: 2,
      columnGap: 6.35 * MM_TO_PT, // ~0.25in equivalent in mm
      hasHeader: true,
      hasFooter: true,
      baselineGrid: true,
      gridSpacing: 12, // 12pt baseline
      allowTableRotation: false
    }
  },

  // Letter Body 1-column with Sidebar
  {
    id: 'body-1col-sidebar-letter',
    name: 'Body 1-Column + Sidebar (Letter)',
    description: 'Single column body layout with sidebar for Letter size',
    pageSize: 'Letter',
    layoutType: 'body-1col-sidebar',
    pageMaster: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { 
        top: 1 * INCH_TO_PT, 
        right: 1 * INCH_TO_PT, 
        bottom: 1 * INCH_TO_PT, 
        left: 1 * INCH_TO_PT 
      },
      columns: 1,
      columnGap: 0,
      hasHeader: true,
      hasFooter: true,
      baselineGrid: true,
      gridSpacing: 12, // 12pt baseline
      allowTableRotation: false
    },
    sidebarConfig: {
      width: 2 * INCH_TO_PT, // 2 inch sidebar
      position: 'right',
      gap: 0.25 * INCH_TO_PT // 0.25in gap
    }
  },

  // A4 Body 1-column with Sidebar
  {
    id: 'body-1col-sidebar-a4',
    name: 'Body 1-Column + Sidebar (A4)',
    description: 'Single column body layout with sidebar for A4 size',
    pageSize: 'A4',
    layoutType: 'body-1col-sidebar',
    pageMaster: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { 
        top: 25.4 * MM_TO_PT, 
        right: 25.4 * MM_TO_PT, 
        bottom: 25.4 * MM_TO_PT, 
        left: 25.4 * MM_TO_PT 
      },
      columns: 1,
      columnGap: 0,
      hasHeader: true,
      hasFooter: true,
      baselineGrid: true,
      gridSpacing: 12, // 12pt baseline
      allowTableRotation: false
    },
    sidebarConfig: {
      width: 50.8 * MM_TO_PT, // ~2 inch equivalent in mm
      position: 'right',
      gap: 6.35 * MM_TO_PT // ~0.25in equivalent in mm
    }
  }
]

export function getPageMasterPreset(id: string): PageMasterPreset | undefined {
  return PAGE_MASTER_PRESETS.find(preset => preset.id === id)
}

export function getPageMastersBySize(pageSize: 'Letter' | 'A4'): PageMasterPreset[] {
  return PAGE_MASTER_PRESETS.filter(preset => preset.pageSize === pageSize)
}

export function getPageMastersByType(layoutType: 'cover-fullbleed' | 'body-1col' | 'body-2col' | 'body-1col-sidebar' | 'body-2col-sidebar'): PageMasterPreset[] {
  return PAGE_MASTER_PRESETS.filter(preset => preset.layoutType === layoutType)
}