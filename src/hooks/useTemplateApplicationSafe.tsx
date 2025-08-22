import { useState } from 'react'
import { Template } from './useSupabaseData'
import { SemanticDocument, Section, LayoutIntent } from '@/lib/document-model'
import { TemplateApplicationMode } from '@/components/template/ApplyTemplateWizard'
import { createDefaultThemeTokens, getActiveColorway } from '@/lib/template-model'

export interface TemplateWarning {
  title: string
  description: string
  suggestion?: string
  severity: 'low' | 'medium' | 'high'
}

export interface SectionMapping {
  sectionId: string
  sectionName: string
  currentLayoutIntent: LayoutIntent | null
  newLayoutIntent: LayoutIntent
  confidence: number
  blockCount: number
  flowCount: number
}

export interface ColorChange {
  name: string
  oldColor: string
  newColor: string
}

export interface LayoutChange {
  sectionName: string
  layoutIntent: LayoutIntent
  oldMargins: string
  newMargins: string
  oldColumns: number
  newColumns: number
  oldOrientation: string
  newOrientation: string
}

export interface TemplatePreviewData {
  changes: {
    preserved: number
    modified: number
  }
  warnings: TemplateWarning[]
  sectionMappings: SectionMapping[]
  colorChanges: ColorChange[]
  layoutChanges: LayoutChange[]
}

export function useTemplateApplicationSafe() {
  const [previewData, setPreviewData] = useState<TemplatePreviewData | null>(null)
  const [loading, setLoading] = useState(false)

  const generatePreview = async (
    template: Template,
    document: SemanticDocument,
    mode: TemplateApplicationMode
  ): Promise<void> => {
    setLoading(true)
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500))

      const templateTheme = createDefaultThemeTokens()
      const activeColorway = getActiveColorway(templateTheme)
      
      const warnings: TemplateWarning[] = []
      const sectionMappings: SectionMapping[] = []
      const colorChanges: ColorChange[] = []
      const layoutChanges: LayoutChange[] = []

      // Analyze sections and create mappings
      document.sections.forEach((section) => {
        const mapping = mapSectionToLayoutIntent(section, template)
        sectionMappings.push(mapping)

        // Add warnings for low confidence mappings
        if (mapping.confidence < 70) {
          warnings.push({
            title: `Low confidence mapping for "${section.name}"`,
            description: `This section will be mapped to "${mapping.newLayoutIntent}" with ${mapping.confidence}% confidence`,
            suggestion: 'Review the mapping after application to ensure it meets your needs',
            severity: 'medium'
          })
        }

        // Add layout changes if not styles-only
        if (mode !== 'styles-only') {
          layoutChanges.push(generateLayoutChange(section, mapping.newLayoutIntent))
        }
      })

      // Generate color changes
      if (activeColorway) {
        colorChanges.push(
          {
            name: 'Primary Color',
            oldColor: 'hsl(222, 84%, 5%)',
            newColor: activeColorway.palette.primary
          },
          {
            name: 'Accent Color',
            oldColor: 'hsl(210, 40%, 8%)',
            newColor: activeColorway.palette.accent
          },
          {
            name: 'Success Color',
            oldColor: 'hsl(142, 76%, 36%)',
            newColor: activeColorway.palette.success
          },
          {
            name: 'Warning Color',
            oldColor: 'hsl(38, 92%, 50%)',
            newColor: activeColorway.palette.warning
          }
        )
      }

      // Add mode-specific warnings
      if (mode === 'full-layout') {
        warnings.push({
          title: 'Document structure will be reorganized',
          description: 'Some sections may be restructured to match the template layout',
          suggestion: 'Review section organization after application',
          severity: 'high'
        })
      }

      // Check for potential issues
      const complexSections = document.sections.filter(s => s.flows.length > 3)
      if (complexSections.length > 0 && mode === 'full-layout') {
        warnings.push({
          title: 'Complex sections detected',
          description: `${complexSections.length} sections have multiple flows that may need manual review`,
          suggestion: 'Check section organization after template application',
          severity: 'medium'
        })
      }

      const totalBlocks = document.sections.reduce((acc, s) => 
        acc + s.flows.reduce((facc, f) => facc + f.blocks.length, 0), 0
      )

      setPreviewData({
        changes: {
          preserved: totalBlocks,
          modified: sectionMappings.length + colorChanges.length
        },
        warnings,
        sectionMappings,
        colorChanges,
        layoutChanges
      })
    } finally {
      setLoading(false)
    }
  }

  const applyTemplate = async (
    template: Template,
    document: SemanticDocument,
    mode: TemplateApplicationMode
  ): Promise<SemanticDocument> => {
    // This would implement the actual safe template application
    // For now, return the original document (safe fallback)
    
    // In a real implementation, this would:
    // 1. Apply styles according to the selected mode
    // 2. Update page masters if mode includes them
    // 3. Migrate layout intents if full-layout mode
    // 4. Preserve all content and structure
    // 5. Update cross-references and maintain semantic meaning
    
    return { ...document }
  }

  return {
    generatePreview,
    applyTemplate,
    previewData,
    loading
  }
}

/**
 * Map a section to the most appropriate layout intent based on content analysis
 */
function mapSectionToLayoutIntent(section: Section, template: Template): SectionMapping {
  let newLayoutIntent: LayoutIntent = 'body' // default
  let confidence = 80

  // Analyze section content to determine best layout intent
  const totalBlocks = section.flows.reduce((acc, f) => acc + f.blocks.length, 0)
  const hasMultipleFlows = section.flows.length > 1
  const blockTypes = section.flows.flatMap(f => f.blocks.map(b => b.type))
  
  // Detect section purpose based on name and content
  const sectionNameLower = section.name.toLowerCase()
  
  if (sectionNameLower.includes('cover') || sectionNameLower.includes('title')) {
    newLayoutIntent = 'cover'
    confidence = 95
  } else if (sectionNameLower.includes('summary') || sectionNameLower.includes('executive') || sectionNameLower.includes('overview')) {
    newLayoutIntent = 'executive-summary'
    confidence = 90
  } else if (blockTypes.includes('table') || blockTypes.includes('chart') || sectionNameLower.includes('data') || sectionNameLower.includes('appendix')) {
    newLayoutIntent = 'data-appendix'
    confidence = 85
  } else if (totalBlocks > 10 || hasMultipleFlows) {
    newLayoutIntent = 'body'
    confidence = 75
  }

  return {
    sectionId: section.id,
    sectionName: section.name,
    currentLayoutIntent: section.layoutIntent || null,
    newLayoutIntent,
    confidence,
    blockCount: totalBlocks,
    flowCount: section.flows.length
  }
}

/**
 * Generate layout change preview data
 */
function generateLayoutChange(section: Section, newLayoutIntent: LayoutIntent): LayoutChange {
  const currentMaster = section.pageMaster
  
  // Mock layout changes based on intent
  const layoutConfigs = {
    'cover': {
      margins: '2in all',
      columns: 1,
      orientation: 'portrait'
    },
    'executive-summary': {
      margins: '1.25in sides, 1in top/bottom',
      columns: 1,
      orientation: 'portrait'
    },
    'body': {
      margins: '0.75in all',
      columns: 2,
      orientation: 'portrait'
    },
    'data-appendix': {
      margins: '0.5in all',
      columns: 1,
      orientation: 'landscape'
    },
    'custom': {
      margins: '1in all',
      columns: 1,
      orientation: 'portrait'
    }
  }

  const oldConfig = layoutConfigs['body'] // default current
  const newConfig = layoutConfigs[newLayoutIntent]

  return {
    sectionName: section.name,
    layoutIntent: newLayoutIntent,
    oldMargins: oldConfig.margins,
    newMargins: newConfig.margins,
    oldColumns: oldConfig.columns,
    newColumns: newConfig.columns,
    oldOrientation: oldConfig.orientation,
    newOrientation: newConfig.orientation
  }
}