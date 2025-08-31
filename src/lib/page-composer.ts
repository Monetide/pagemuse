/**
 * Page Composition and Rendering
 * Handles page-to-image conversion and template preview generation
 */

export interface PageComposition {
  id: 'cover' | 'body-1col' | 'body-2col' | 'data'
  name: string
  description: string
  content: any
}

export const defaultCompositions: PageComposition[] = [
  {
    id: 'cover',
    name: 'Cover Page',
    description: 'Title page with logo and document information',
    content: {
      template: 'cover-standard',
      elements: ['logo', 'title', 'subtitle', 'date', 'author']
    }
  },
  {
    id: 'body-1col',
    name: 'Single Column Body',
    description: 'Standard text layout with single column',
    content: {
      template: 'body-single-column',
      elements: ['header', 'body-text', 'footer']
    }
  },
  {
    id: 'body-2col',
    name: 'Two Column Body',
    description: 'Text layout with two columns for better readability',
    content: {
      template: 'body-two-column',
      elements: ['header', 'left-column', 'right-column', 'footer']
    }
  },
  {
    id: 'data',
    name: 'Data Visualization',
    description: 'Page optimized for charts, tables, and data presentation',
    content: {
      template: 'data-visualization',
      elements: ['header', 'chart-area', 'data-table', 'insights', 'footer']
    }
  }
]

export interface PageRenderOptions {
  scale?: number
  width?: number
  height?: number
  format?: 'png' | 'jpeg' | 'webp'
  quality?: number
}

export const renderPageToBlob = async (
  elementId: string,
  options: PageRenderOptions = {}
): Promise<Blob> => {
  if (typeof window === 'undefined') {
    throw new Error('Page rendering is only available in browser environment')
  }

  try {
    const html2canvas = await import('html2canvas')
    
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Element with id '${elementId}' not found`)
    }

    const {
      scale = 2,
      width,
      height,
      format = 'png',
      quality = 0.9
    } = options

    const canvas = await html2canvas.default(element, {
      scale,
      width,
      height,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null
    })

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to generate blob from canvas'))
          }
        },
        `image/${format}`,
        quality
      )
    })
  } catch (error) {
    console.error('Page rendering failed:', error)
    throw new Error(`Failed to render page: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Placeholder exports for backward compatibility
export interface LoremSeed {
  length?: number
  type?: 'sentences' | 'paragraphs' | 'words'
  paragraphs?: { length: number }
}

export const generateLoremContent = (seed: LoremSeed | number = {}) => {
  const normalizedSeed = typeof seed === 'number' ? { length: seed } : seed
  return {
    content: 'Lorem ipsum placeholder content',
    paragraphs: { length: normalizedSeed.length || 3 },
    ...normalizedSeed
  }
}

export const generatePageCompositions = (type: any, config?: any) => {
  return defaultCompositions
}

export const exportPageAsPNG = async (elementId: string, config?: any, options?: any) => {
  try {
    return await renderPageToBlob(elementId, { ...config, ...options, format: 'png' })
  } catch (error) {
    console.warn('PNG export failed, returning empty blob:', error)
    // Return a small transparent PNG blob as fallback
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob || new Blob([''], { type: 'image/png' }))
      }, 'image/png')
    })
  }
}

export const downloadBlob = (blob: Blob, filename: string) => {
  if (typeof window === 'undefined') {
    throw new Error('Download functionality is only available in browser environment')
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const generateTemplatePreviewsAndAssets = async (config?: any) => {
  try {
    // Generate preview for template elements if available
    const previewElements = document.querySelectorAll('[data-template-preview]')
    const previews = []

    for (const element of previewElements) {
      if (element.id) {
        try {
          const blob = await exportPageAsPNG(element.id)
          previews.push({
            elementId: element.id,
            blob,
            size: blob.size
          })
        } catch (error) {
          console.warn(`Failed to generate preview for ${element.id}:`, error)
        }
      }
    }

    return {
      previews,
      assets: {} // Empty assets object for compatibility
    }
  } catch (error) {
    console.warn('Template preview generation failed:', error)
    return {
      previews: [],
      assets: {}
    }
  }
}