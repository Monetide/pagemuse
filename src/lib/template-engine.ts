import { 
  Template,
  TemplateStarterContent 
} from './template-model'
import {
  SemanticDocument,
  Section,
  Flow,
  Block,
  PageMaster,
  createDocument,
  createSection,
  createFlow,
  createBlock,
  addSectionToDocument,
  addFlowToSection,
  addBlockToFlow
} from './document-model'
import { applyLayoutPreset } from './layout-presets'

/**
 * Template Application Engine
 * Applies templates to generate new documents
 */
export class TemplateEngine {
  /**
   * Apply a template to generate a new document
   */
  static async applyTemplate(
    template: Template,
    options: {
      title?: string
      replaceContent?: boolean
      preserveExisting?: boolean
    } = {}
  ): Promise<SemanticDocument> {
    const { title, replaceContent = true, preserveExisting = false } = options
    
    // Create new document with template metadata
    let document = createDocument(title || template.name)
    
      // Apply template metadata
      document.metadata = {
        ...document.metadata,
        templateId: template.id,
        templateVersion: template.version,
        themeTokens: template.themeTokens,
        objectStyles: template.objectStyles,
        behaviors: template.behaviors,
        numbering: template.numbering,
        validationPreset: template.validationPreset,
        tocDefaults: template.tocDefaults,
        exportDefaults: template.exportDefaults
      }
    
    // Apply starter content if provided
    if (template.starterContent && replaceContent) {
      document = await this.applyStarterContent(document, template.starterContent)
    }
    
    // Apply page masters
    this.applyPageMasters(document, template.pageMasters)
    
    return document
  }
  
  /**
   * Apply starter content to document
   */
  private static async applyStarterContent(
    document: SemanticDocument,
    starterContent: TemplateStarterContent
  ): Promise<SemanticDocument> {
    let workingDoc = document

    for (const sectionConfig of starterContent.sections) {
      let section = createSection(sectionConfig.name)

      // Apply layout intent
      if (sectionConfig.layoutIntent) {
        section.layoutIntent = sectionConfig.layoutIntent as any
        section.pageMaster = applyLayoutPreset(sectionConfig.layoutIntent)
      }

      // Add flows to section
      for (const flowConfig of sectionConfig.flows) {
        let flow = createFlow(flowConfig.name, flowConfig.type || 'linear')

        // Add blocks to flow
        flowConfig.blocks.forEach((blockConfig, index) => {
          const block = createBlock(
            blockConfig.type,
            blockConfig.content || this.getPlaceholderContent(blockConfig),
            index
          )

          // Mark as required if specified
          if (blockConfig.required) {
            block.metadata = {
              ...block.metadata,
              required: true,
              placeholder: blockConfig.placeholder
            }
          }

          flow = addBlockToFlow(flow, block)
        })

        section = addFlowToSection(section, flow)
      }

      workingDoc = addSectionToDocument(workingDoc, section)
    }

    return workingDoc
  }
  
  /**
   * Apply page masters from template
   */
  private static applyPageMasters(
    document: SemanticDocument,
    pageMasters: Record<string, PageMaster>
  ): void {
    // Apply page masters to sections that don't already have custom ones
    document.sections.forEach(section => {
      const masterKey = section.layoutIntent || 'default'
      if (pageMasters[masterKey]) {
        section.pageMaster = { ...pageMasters[masterKey] }
      }
    })
  }
  
  /**
   * Get placeholder content for a block
   */
  private static getPlaceholderContent(blockConfig: any): any {
    const placeholders: Record<string, any> = {
      heading: {
        level: 1,
        text: blockConfig.placeholder || 'Enter heading...',
        id: crypto.randomUUID()
      },
      paragraph: {
        text: blockConfig.placeholder || 'Enter your content here...',
        formatting: []
      },
      'unordered-list': {
        type: 'bulleted',
        items: [
          { text: blockConfig.placeholder || 'First item...' },
          { text: 'Second item...' },
          { text: 'Third item...' }
        ]
      },
      'ordered-list': {
        type: 'numbered',
        items: [
          { text: blockConfig.placeholder || 'First item...' },
          { text: 'Second item...' },
          { text: 'Third item...' }
        ]
      },
      table: {
        rows: 3,
        cols: 3,
        headers: true,
        data: [
          ['Header 1', 'Header 2', 'Header 3'],
          ['Cell 1,1', 'Cell 1,2', 'Cell 1,3'],
          ['Cell 2,1', 'Cell 2,2', 'Cell 2,3']
        ]
      },
      figure: {
        type: 'image',
        src: '',
        alt: blockConfig.placeholder || 'Add image description...',
        caption: 'Figure caption...'
      },
      callout: {
        type: 'info',
        title: 'Note',
        content: blockConfig.placeholder || 'Add your note here...'
      }
    }
    
    return placeholders[blockConfig.type] || { text: blockConfig.placeholder || 'Content...' }
  }
  
  /**
   * Apply template snippet to document
   */
  static applySnippet(
    document: SemanticDocument,
    template: Template,
    snippetId: string,
    targetSectionId?: string,
    targetFlowId?: string
  ): SemanticDocument {
    const snippet = template.snippets.find(s => s.id === snippetId)
    if (!snippet) {
      throw new Error(`Snippet with id ${snippetId} not found in template`)
    }
    
    const updatedDoc = { ...document }
    
    // Find target location
    let targetSection = targetSectionId 
      ? updatedDoc.sections.find(s => s.id === targetSectionId)
      : updatedDoc.sections[0]
    
    if (!targetSection) {
      // Create a default section if none exists
      targetSection = createSection('Main Content')
      addSectionToDocument(updatedDoc, targetSection)
    }
    
    let targetFlow = targetFlowId
      ? targetSection.flows.find(f => f.id === targetFlowId)
      : targetSection.flows[0]
    
    if (!targetFlow) {
        // Create a default flow if none exists
        targetFlow = createFlow('Main Flow', 'linear')
        addFlowToSection(targetSection, targetFlow)
      }
    
    // Add snippet blocks
    snippet.content.forEach(block => {
      const newBlock = { ...block, id: crypto.randomUUID() }
      addBlockToFlow(targetFlow, newBlock)
    })
    
    return updatedDoc
  }
  
  /**
   * Validate template structure
   */
  static validateTemplate(template: Template): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Basic validation
    if (!template.name?.trim()) {
      errors.push('Template name is required')
    }
    
    if (!template.id) {
      errors.push('Template ID is required')
    }
    
    // Validate sections in starter content
    if (template.starterContent?.sections) {
      template.starterContent.sections.forEach((section, index) => {
        if (!section.name?.trim()) {
          errors.push(`Section ${index + 1} must have a name`)
        }
        
        section.flows?.forEach((flow, flowIndex) => {
          if (!flow.name?.trim()) {
            warnings.push(`Flow ${flowIndex + 1} in section "${section.name}" should have a name`)
          }
        })
      })
    }
    
    // Validate snippets
    template.snippets?.forEach((snippet, index) => {
      if (!snippet.name?.trim()) {
        errors.push(`Snippet ${index + 1} must have a name`)
      }
      
      if (!snippet.content || snippet.content.length === 0) {
        warnings.push(`Snippet "${snippet.name}" has no content`)
      }
    })
    
    // Validate page masters
    if (template.pageMasters && Object.keys(template.pageMasters).length === 0) {
      warnings.push('Template has no page masters defined')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  /**
   * Create template from existing document
   */
  static createTemplateFromDocument(
    document: SemanticDocument,
    templateName: string,
    templateDescription: string = ''
  ): Template {
    const template: Template = {
      id: crypto.randomUUID(),
      name: templateName,
      description: templateDescription,
      tags: [],
      category: 'custom',
      version: '1.0.0',
      author: 'User',
      createdAt: new Date(),
      updatedAt: new Date(),
      
      sections: document.sections.map(section => ({ ...section })),
      pageMasters: this.extractPageMasters(document),
      layoutIntents: this.extractLayoutIntents(document),
      
      themeTokens: document.metadata?.themeTokens || this.getDefaultThemeTokens(),
      objectStyles: document.metadata?.objectStyles || this.getDefaultObjectStyles(),
      
      behaviors: document.metadata?.behaviors || this.getDefaultBehaviors(),
      numbering: document.metadata?.numbering || this.getDefaultNumbering(),
      validationPreset: document.metadata?.validationPreset || this.getDefaultValidationPreset(),
      tocDefaults: document.metadata?.tocDefaults || this.getDefaultTOCDefaults(),
      exportDefaults: document.metadata?.exportDefaults || this.getDefaultExportDefaults(),
      
      snippets: [],
      starterContent: this.createStarterContentFromDocument(document),
      
      metadata: {
        usageCount: 0,
        isPublic: false,
        permissions: []
      }
    }
    
    return template
  }
  
  /**
   * Extract page masters from document
   */
  private static extractPageMasters(document: SemanticDocument): Record<string, PageMaster> {
    const masters: Record<string, PageMaster> = {}
    
    document.sections.forEach(section => {
      const intentKey = section.layoutIntent || 'default'
      if (!masters[intentKey] && section.pageMaster) {
        masters[intentKey] = { ...section.pageMaster }
      }
    })
    
    return masters
  }
  
  /**
   * Extract layout intents from document
   */
  private static extractLayoutIntents(document: SemanticDocument): any[] {
    const intents = new Set<string>()
    
    document.sections.forEach(section => {
      if (section.layoutIntent) {
        intents.add(section.layoutIntent)
      }
    })
    
    return Array.from(intents)
  }
  
  /**
   * Create starter content from document
   */
  private static createStarterContentFromDocument(document: SemanticDocument): TemplateStarterContent {
    return {
      sections: document.sections.map(section => ({
        name: section.name,
        layoutIntent: section.layoutIntent || 'body',
        flows: section.flows.map(flow => ({
          name: flow.name,
          type: flow.type,
          blocks: flow.blocks.map(block => ({
            type: block.type,
            content: this.createPlaceholderFromContent(block),
            placeholder: this.generatePlaceholderText(block),
            required: false
          }))
        }))
      }))
    }
  }
  
  /**
   * Create placeholder from existing content
   */
  private static createPlaceholderFromContent(block: Block): any {
    // Create template placeholders based on block content
    switch (block.type) {
      case 'heading':
        return {
          level: block.content.level || 1,
          text: `[${block.content.text || 'Heading'}]`,
          id: crypto.randomUUID()
        }
      case 'paragraph':
        return {
          text: '[Enter paragraph content...]',
          formatting: []
        }
      case 'unordered-list':
      case 'ordered-list':
        return {
          type: block.type === 'ordered-list' ? 'numbered' : 'bulleted',
          items: [{ text: '[List item...]' }]
        }
      default:
        return block.content
    }
  }
  
  /**
   * Generate placeholder text for block type
   */
  private static generatePlaceholderText(block: Block): string {
    const placeholders: Record<string, string> = {
      heading: 'Enter heading text...',
      paragraph: 'Enter paragraph content...',
      'unordered-list': 'Add list items...',
      'ordered-list': 'Add numbered items...',
      table: 'Configure table data...',
      figure: 'Add image and caption...',
      callout: 'Add note content...'
    }
    
    return placeholders[block.type] || 'Add content...'
  }
  
  // Default getters (simplified versions)
  private static getDefaultThemeTokens(): any {
    return {
      colors: {
        primary: 'hsl(222, 84%, 5%)',
        secondary: 'hsl(210, 40%, 95%)',
        background: 'hsl(0, 0%, 100%)',
        foreground: 'hsl(222, 84%, 5%)'
      }
    }
  }
  
  private static getDefaultObjectStyles(): any {
    return {
      headings: {},
      paragraphs: {},
      lists: {},
      tables: {},
      figures: {},
      callouts: {}
    }
  }
  
  private static getDefaultBehaviors(): any {
    return {
      autoNumbering: { headings: false, figures: true, tables: true, equations: true },
      crossReferences: { enableAutoText: true, updateOnRename: true, showPageNumbers: true },
      validation: { requireAltText: true, checkSpelling: false, enforceStyles: false },
      collaboration: { allowComments: true, trackChanges: false, shareSettings: 'private' }
    }
  }
  
  private static getDefaultNumbering(): any {
    return {
      headings: { enabled: false, format: '1.1.1', startLevel: 1, separator: '.' },
      figures: { enabled: true, prefix: 'Figure', format: '{prefix} {n}' },
      tables: { enabled: true, prefix: 'Table', format: '{prefix} {n}' },
      equations: { enabled: true, prefix: 'Equation', format: '({n})' },
      footnotes: { enabled: true, format: 'numeric', restart: 'never' }
    }
  }
  
  private static getDefaultValidationPreset(): any {
    return {
      id: 'default',
      name: 'Standard Validation',
      rules: {
        typography: { minBodyFontSize: 10.5, minHeadingFontSize: 12 },
        accessibility: { minContrastRatio: 4.5, requireAltText: true },
        layout: { minMargins: 0.75, maxColumnsPerPage: 3 },
        content: { maxOrphans: 2, maxWidows: 2 },
        brand: { enforceColorPalette: false }
      }
    }
  }
  
  private static getDefaultTOCDefaults(): any {
    return {
      enabled: true,
      title: 'Table of Contents',
      includePageNumbers: true,
      levels: { min: 1, max: 3 }
    }
  }
  
  private static getDefaultExportDefaults(): any {
    return {
      pdf: { pageSize: 'Letter', margins: { top: 1, right: 1, bottom: 1, left: 1 }, includeMetadata: true, embedFonts: true, quality: 'standard' },
      docx: { compatibility: 'modern', includeComments: false, trackChanges: false },
      html: { includeCSS: true, embedImages: false, responsiveDesign: true }
    }
  }
}