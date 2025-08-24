import type { SeedFormData } from '@/components/admin/SeedForm'
import { generateMotifAssets } from './svg-motif-generator'

// Figma file structure interfaces
interface FigmaFile {
  name: string
  lastModified: string
  version: string
  document: FigmaDocument
}

interface FigmaDocument {
  id: string
  name: string
  type: 'DOCUMENT'
  children: FigmaPage[]
}

interface FigmaPage {
  id: string
  name: string
  type: 'CANVAS'
  children: FigmaNode[]
  backgroundColor: FigmaColor
}

interface FigmaNode {
  id: string
  name: string
  type: string
  children?: FigmaNode[]
  fills?: FigmaFill[]
  strokes?: FigmaStroke[]
  exportSettings?: FigmaExportSetting[]
  absoluteBoundingBox?: FigmaRectangle
  [key: string]: any
}

interface FigmaColor {
  r: number
  g: number
  b: number
  a: number
}

interface FigmaFill {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'IMAGE'
  color?: FigmaColor
  opacity?: number
}

interface FigmaStroke {
  type: 'SOLID'
  color: FigmaColor
}

interface FigmaExportSetting {
  suffix: string
  format: 'PNG' | 'JPG' | 'SVG' | 'PDF'
  constraint: {
    type: 'SCALE'
    value: number
  }
}

interface FigmaRectangle {
  x: number
  y: number
  width: number
  height: number
}

// Utility functions
function hexToFigmaColor(hex: string): FigmaColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { r: 0, g: 0, b: 0, a: 1 }
  
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
    a: 1
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function createColorTokensPage(seedData: SeedFormData): FigmaPage {
  const colors = seedData.colorway?.colors || {}
  const nodes: FigmaNode[] = []
  
  let yOffset = 0
  Object.entries(colors).forEach(([name, value], index) => {
    if (typeof value === 'string') {
      // Color swatch
      nodes.push({
        id: generateId(),
        name: name,
        type: 'RECTANGLE',
        absoluteBoundingBox: { x: 0, y: yOffset, width: 100, height: 100 },
        fills: [{
          type: 'SOLID',
          color: hexToFigmaColor(value)
        }]
      })
      
      // Color label
      nodes.push({
        id: generateId(),
        name: `${name} Label`,
        type: 'TEXT',
        absoluteBoundingBox: { x: 120, y: yOffset + 35, width: 200, height: 30 },
        characters: `${name}: ${value}`,
        style: {
          fontFamily: 'Inter',
          fontSize: 14,
          fontWeight: 400
        },
        fills: [{
          type: 'SOLID',
          color: { r: 0, g: 0, b: 0, a: 1 }
        }]
      })
      
      yOffset += 120
    }
  })

  return {
    id: generateId(),
    name: 'Tokens',
    type: 'CANVAS',
    backgroundColor: { r: 0.98, g: 0.98, b: 0.98, a: 1 },
    children: nodes
  }
}

function createPageMastersPage(seedData: SeedFormData): FigmaPage {
  const nodes: FigmaNode[] = []
  
  // Letter format page masters
  const letterMasters = [
    { name: 'body-2col-letter', width: 612, height: 792, columns: 2 },
    { name: 'body-1col-letter', width: 612, height: 792, columns: 1 },
    { name: 'cover-fullbleed-letter', width: 612, height: 792, columns: 1 }
  ]
  
  // A4 format page masters
  const a4Masters = [
    { name: 'body-2col-a4', width: 595, height: 842, columns: 2 },
    { name: 'body-1col-a4', width: 595, height: 842, columns: 1 },
    { name: 'cover-fullbleed-a4', width: 595, height: 842, columns: 1 }
  ]
  
  let xOffset = 0
  const scale = 0.3 // Scale down for overview
  
  const allMasters = [...letterMasters, ...a4Masters]
  allMasters.forEach((master, index) => {
    // Page frame
    const frameNode: FigmaNode = {
      id: generateId(),
      name: master.name,
      type: 'FRAME',
      absoluteBoundingBox: { 
        x: xOffset, 
        y: 0, 
        width: master.width * scale, 
        height: master.height * scale 
      },
      fills: [{
        type: 'SOLID',
        color: { r: 1, g: 1, b: 1, a: 1 }
      }],
      strokes: [{
        type: 'SOLID',
        color: { r: 0.8, g: 0.8, b: 0.8, a: 1 }
      }],
      children: []
    }
    
    // Add column guides if multi-column
    if (master.columns === 2) {
      const columnWidth = (master.width * scale - 20) / 2
      const gutter = 20
      
      for (let i = 0; i < master.columns; i++) {
        if (frameNode.children) {
          frameNode.children.push({
          id: generateId(),
          name: `Column ${i + 1}`,
          type: 'RECTANGLE',
          absoluteBoundingBox: {
            x: 10 + i * (columnWidth + gutter),
            y: 10,
            width: columnWidth,
            height: (master.height * scale) - 20
          },
          fills: [{
            type: 'SOLID',
            color: { r: 0.95, g: 0.95, b: 0.95, a: 0.5 }
          }]
          })
        }
      }
    }
    
    nodes.push(frameNode)
    
    // Label
    nodes.push({
      id: generateId(),
      name: `${master.name} Label`,
      type: 'TEXT',
      absoluteBoundingBox: { x: xOffset, y: (master.height * scale) + 10, width: master.width * scale, height: 20 },
      characters: master.name,
      style: {
        fontFamily: 'Inter',
        fontSize: 12,
        fontWeight: 500
      },
      fills: [{
        type: 'SOLID',
        color: { r: 0, g: 0, b: 0, a: 1 }
      }]
    })
    
    xOffset += (master.width * scale) + 50
  })

  return {
    id: generateId(),
    name: 'Page Masters',
    type: 'CANVAS',
    backgroundColor: { r: 0.98, g: 0.98, b: 0.98, a: 1 },
    children: nodes
  }
}

function createAssetsPage(seedData: SeedFormData): FigmaPage {
  const nodes: FigmaNode[] = []
  
  if (seedData.motifs?.assets) {
    let yOffset = 0
    
    seedData.motifs.assets.forEach((asset, index) => {
      const variant = asset.variants?.[0]
      if (variant?.svg) {
        // SVG preview frame
        nodes.push({
          id: generateId(),
          name: `${asset.type}.svg`,
          type: 'FRAME',
          absoluteBoundingBox: { x: 0, y: yOffset, width: 200, height: 100 },
          fills: [{
            type: 'SOLID',
            color: { r: 0.95, g: 0.95, b: 0.95, a: 1 }
          }],
          exportSettings: [{
            suffix: '',
            format: 'SVG',
            constraint: { type: 'SCALE', value: 1 }
          }]
        })
        
        // Asset label
        nodes.push({
          id: generateId(),
          name: `${asset.type} Label`,
          type: 'TEXT',
          absoluteBoundingBox: { x: 220, y: yOffset + 35, width: 200, height: 30 },
          characters: `${asset.type}.svg`,
          style: {
            fontFamily: 'Inter',
            fontSize: 14,
            fontWeight: 400
          },
          fills: [{
            type: 'SOLID',
            color: { r: 0, g: 0, b: 0, a: 1 }
          }]
        })
        
        yOffset += 120
      }
    })
  }

  return {
    id: generateId(),
    name: 'Assets',
    type: 'CANVAS',
    backgroundColor: { r: 0.98, g: 0.98, b: 0.98, a: 1 },
    children: nodes
  }
}

function createComponentsPage(seedData: SeedFormData): FigmaPage {
  const nodes: FigmaNode[] = []
  
  // Typography components
  const typography = seedData.typography
  if (typography) {
    let yOffset = 0
    
    const typeStyles = [
      { name: 'H1', size: 32, weight: 700 },
      { name: 'H2', size: 22, weight: 600 },
      { name: 'H3', size: 16, weight: 600 },
      { name: 'Body', size: 11, weight: 400 },
      { name: 'Caption', size: 9.5, weight: 400 }
    ]
    
    typeStyles.forEach((style, index) => {
      nodes.push({
        id: generateId(),
        name: style.name,
        type: 'TEXT',
        absoluteBoundingBox: { x: 0, y: yOffset, width: 400, height: style.size + 10 },
        characters: `${style.name} - ${typography.name}`,
        style: {
          fontFamily: style.name.startsWith('H') ? typography.serif?.name || 'Inter' : typography.sans?.name || 'Inter',
          fontSize: style.size,
          fontWeight: style.weight
        },
        fills: [{
          type: 'SOLID',
          color: hexToFigmaColor(seedData.colorway?.colors?.textBody || '#000000')
        }]
      })
      
      yOffset += style.size + 30
    })
  }

  return {
    id: generateId(),
    name: 'Components',
    type: 'CANVAS',
    backgroundColor: { r: 0.98, g: 0.98, b: 0.98, a: 1 },
    children: nodes
  }
}

function createPreviewsPage(seedData: SeedFormData): FigmaPage {
  const nodes: FigmaNode[] = []
  
  // Mock preview frames
  const previews = [
    { name: 'cover.png', width: 612, height: 792 },
    { name: 'body-2col.png', width: 612, height: 792 },
    { name: 'data.png', width: 612, height: 792 }
  ]
  
  let xOffset = 0
  const scale = 0.25
  
  previews.forEach((preview, index) => {
    nodes.push({
      id: generateId(),
      name: preview.name,
      type: 'FRAME',
      absoluteBoundingBox: { 
        x: xOffset, 
        y: 0, 
        width: preview.width * scale, 
        height: preview.height * scale 
      },
      fills: [{
        type: 'SOLID',
        color: { r: 0.95, g: 0.95, b: 0.95, a: 1 }
      }],
      exportSettings: [{
        suffix: '',
        format: 'PNG',
        constraint: { type: 'SCALE', value: 2 }
      }]
    })
    
    // Preview label
    nodes.push({
      id: generateId(),
      name: `${preview.name} Label`,
      type: 'TEXT',
      absoluteBoundingBox: { x: xOffset, y: (preview.height * scale) + 10, width: preview.width * scale, height: 20 },
      characters: preview.name,
      style: {
        fontFamily: 'Inter',
        fontSize: 12,
        fontWeight: 500
      },
      fills: [{
        type: 'SOLID',
        color: { r: 0, g: 0, b: 0, a: 1 }
      }]
    })
    
    xOffset += (preview.width * scale) + 30
  })

  return {
    id: generateId(),
    name: 'Previews',
    type: 'CANVAS',
    backgroundColor: { r: 0.98, g: 0.98, b: 0.98, a: 1 },
    children: nodes
  }
}

export async function exportToFigma(
  seedData: SeedFormData,
  templateName: string
): Promise<Blob> {
  const figmaFile: FigmaFile = {
    name: templateName,
    lastModified: new Date().toISOString(),
    version: '1.0.0',
    document: {
      id: generateId(),
      name: templateName,
      type: 'DOCUMENT',
      children: [
        createColorTokensPage(seedData),
        createPageMastersPage(seedData),
        createComponentsPage(seedData),
        createAssetsPage(seedData),
        createPreviewsPage(seedData)
      ]
    }
  }
  
  // Convert to JSON and create blob
  const figmaJson = JSON.stringify(figmaFile, null, 2)
  
  // Create a blob with .fig extension (actually JSON for this implementation)
  return new Blob([figmaJson], { type: 'application/json' })
}