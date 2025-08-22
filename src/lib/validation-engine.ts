import { SemanticDocument, Block, Section } from './document-model'

export type ValidationSeverity = 'error' | 'warning' | 'info'

export interface ValidationIssue {
  id: string
  ruleId: string
  severity: ValidationSeverity
  blockId: string
  sectionId: string
  message: string
  description: string
  pageNumber?: number
  canFix: boolean
  fixLabel?: string
  ignored: boolean
  snippet?: string
}

export interface ValidationRule {
  id: string
  name: string
  severity: ValidationSeverity
  enabled: boolean
  validate: (document: SemanticDocument, layoutResults?: Map<string, any>) => ValidationIssue[]
  fix?: (document: SemanticDocument, issue: ValidationIssue) => SemanticDocument
}

export interface ValidationConfig {
  rules: Record<string, { enabled: boolean; severity: ValidationSeverity }>
  thresholds: {
    longHeadingLength: number
    hyphenationLimit: number
    contrastRatio: number
    orphanedCalloutLines: number
  }
  autoRunOnChanges: boolean
  ignoredIssues: string[] // Issue IDs
}

export const defaultValidationConfig: ValidationConfig = {
  rules: {
    'stranded-heading': { enabled: true, severity: 'warning' },
    'figure-without-caption': { enabled: true, severity: 'warning' },
    'table-without-header': { enabled: true, severity: 'warning' },
    'orphaned-callout': { enabled: true, severity: 'warning' },
    'low-contrast': { enabled: true, severity: 'warning' },
    'excessive-hyphenation': { enabled: true, severity: 'warning' },
    'missing-alt-text': { enabled: true, severity: 'error' },
    'broken-cross-reference': { enabled: true, severity: 'error' },
    'overflowing-text': { enabled: true, severity: 'error' },
    'long-heading': { enabled: true, severity: 'info' }
  },
  thresholds: {
    longHeadingLength: 85,
    hyphenationLimit: 2,
    contrastRatio: 4.5,
    orphanedCalloutLines: 2
  },
  autoRunOnChanges: true,
  ignoredIssues: []
}

// Validation Rules Implementation

const strandedHeadingRule: ValidationRule = {
  id: 'stranded-heading',
  name: 'Stranded Heading',
  severity: 'warning',
  enabled: true,
  validate: (document, layoutResults) => {
    const issues: ValidationIssue[] = []
    
    document.sections.forEach(section => {
      section.flows.forEach(flow => {
        flow.blocks.forEach((block, index) => {
          if (block.type === 'heading') {
            // Check if heading is at end of flow with no following content
            const nextBlock = flow.blocks[index + 1]
            const isLastInFlow = !nextBlock
            const hasMinimalFollowingContent = nextBlock && 
              (nextBlock.type === 'heading' || 
               (typeof nextBlock.content === 'string' && nextBlock.content.length < 50))

            if (isLastInFlow || hasMinimalFollowingContent) {
              issues.push({
                id: `stranded-${block.id}`,
                ruleId: 'stranded-heading',
                severity: 'warning',
                blockId: block.id,
                sectionId: section.id,
                message: 'Heading appears without sufficient following content',
                description: 'This heading may appear isolated at the end of a page or column.',
                canFix: true,
                fixLabel: 'Keep with next',
                ignored: false,
                snippet: typeof block.content === 'string' ? block.content.substring(0, 50) : 'Heading'
              })
            }
          }
        })
      })
    })
    
    return issues
  },
  fix: (document, issue) => {
    // Apply keep-with-next to the heading
    const updatedDocument = { ...document }
    updatedDocument.sections = document.sections.map(section => {
      if (section.id === issue.sectionId) {
        return {
          ...section,
          flows: section.flows.map(flow => ({
            ...flow,
            blocks: flow.blocks.map(block => {
              if (block.id === issue.blockId) {
                return {
                  ...block,
                  paginationRules: {
                    ...block.paginationRules,
                    keepWithNext: true
                  }
                }
              }
              return block
            })
          }))
        }
      }
      return section
    })
    return updatedDocument
  }
}

const figureWithoutCaptionRule: ValidationRule = {
  id: 'figure-without-caption',
  name: 'Figure Without Caption',
  severity: 'warning',
  enabled: true,
  validate: (document) => {
    const issues: ValidationIssue[] = []
    
    document.sections.forEach(section => {
      section.flows.forEach(flow => {
        flow.blocks.forEach(block => {
          if (block.type === 'figure') {
            const hasCaption = block.metadata?.caption && 
              typeof block.metadata.caption === 'string' && 
              block.metadata.caption.trim().length > 0
            
            if (!hasCaption) {
              issues.push({
                id: `no-caption-${block.id}`,
                ruleId: 'figure-without-caption',
                severity: 'warning',
                blockId: block.id,
                sectionId: section.id,
                message: 'Figure is missing a caption',
                description: 'Figures should have descriptive captions for accessibility and context.',
                canFix: true,
                fixLabel: 'Add caption',
                ignored: false,
                snippet: block.metadata?.altText || 'Figure'
              })
            }
          }
        })
      })
    })
    
    return issues
  },
  fix: (document, issue) => {
    const updatedDocument = { ...document }
    updatedDocument.sections = document.sections.map(section => {
      if (section.id === issue.sectionId) {
        return {
          ...section,
          flows: section.flows.map(flow => ({
            ...flow,
            blocks: flow.blocks.map(block => {
              if (block.id === issue.blockId) {
                return {
                  ...block,
                  metadata: {
                    ...block.metadata,
                    caption: 'Caption placeholder'
                  }
                }
              }
              return block
            })
          }))
        }
      }
      return section
    })
    return updatedDocument
  }
}

const tableWithoutHeaderRule: ValidationRule = {
  id: 'table-without-header',
  name: 'Table Without Header',
  severity: 'warning',
  enabled: true,
  validate: (document) => {
    const issues: ValidationIssue[] = []
    
    document.sections.forEach(section => {
      section.flows.forEach(flow => {
        flow.blocks.forEach(block => {
          if (block.type === 'table') {
            const hasHeaderRow = block.metadata?.headerRow === true
            
            if (!hasHeaderRow) {
              issues.push({
                id: `no-header-${block.id}`,
                ruleId: 'table-without-header',
                severity: 'warning',
                blockId: block.id,
                sectionId: section.id,
                message: 'Table is missing a header row',
                description: 'Tables should have header rows for accessibility and readability.',
                canFix: true,
                fixLabel: 'Set first row as header',
                ignored: false,
                snippet: 'Table'
              })
            }
          }
        })
      })
    })
    
    return issues
  },
  fix: (document, issue) => {
    const updatedDocument = { ...document }
    updatedDocument.sections = document.sections.map(section => {
      if (section.id === issue.sectionId) {
        return {
          ...section,
          flows: section.flows.map(flow => ({
            ...flow,
            blocks: flow.blocks.map(block => {
              if (block.id === issue.blockId) {
                return {
                  ...block,
                  metadata: {
                    ...block.metadata,
                    headerRow: true
                  }
                }
              }
              return block
            })
          }))
        }
      }
      return section
    })
    return updatedDocument
  }
}

const missingAltTextRule: ValidationRule = {
  id: 'missing-alt-text',
  name: 'Missing Alt Text',
  severity: 'error',
  enabled: true,
  validate: (document) => {
    const issues: ValidationIssue[] = []
    
    document.sections.forEach(section => {
      section.flows.forEach(flow => {
        flow.blocks.forEach(block => {
          if (block.type === 'figure' || block.type === 'chart') {
            const hasAltText = block.metadata?.altText && 
              typeof block.metadata.altText === 'string' && 
              block.metadata.altText.trim().length > 0
            const isDecorative = block.metadata?.decorative === true
            
            if (!hasAltText && !isDecorative) {
              issues.push({
                id: `no-alt-${block.id}`,
                ruleId: 'missing-alt-text',
                severity: 'error',
                blockId: block.id,
                sectionId: section.id,
                message: `${block.type === 'figure' ? 'Figure' : 'Chart'} is missing alt text`,
                description: 'Images and charts must have alt text for accessibility unless marked as decorative.',
                canFix: true,
                fixLabel: 'Add alt text',
                ignored: false,
                snippet: block.metadata?.caption || `${block.type === 'figure' ? 'Figure' : 'Chart'}`
              })
            }
          }
        })
      })
    })
    
    return issues
  },
  fix: (document, issue) => {
    const updatedDocument = { ...document }
    updatedDocument.sections = document.sections.map(section => {
      if (section.id === issue.sectionId) {
        return {
          ...section,
          flows: section.flows.map(flow => ({
            ...flow,
            blocks: flow.blocks.map(block => {
              if (block.id === issue.blockId) {
                return {
                  ...block,
                  metadata: {
                    ...block.metadata,
                    altText: 'Alt text placeholder'
                  }
                }
              }
              return block
            })
          }))
        }
      }
      return section
    })
    return updatedDocument
  }
}

const longHeadingRule: ValidationRule = {
  id: 'long-heading',
  name: 'Long Heading',
  severity: 'info',
  enabled: true,
  validate: (document, layoutResults) => {
    const issues: ValidationIssue[] = []
    const threshold = defaultValidationConfig.thresholds.longHeadingLength
    
    document.sections.forEach(section => {
      section.flows.forEach(flow => {
        flow.blocks.forEach(block => {
          if (block.type === 'heading') {
            const content = typeof block.content === 'string' ? block.content : block.content?.text || ''
            if (content.length > threshold) {
              issues.push({
                id: `long-heading-${block.id}`,
                ruleId: 'long-heading',
                severity: 'info',
                blockId: block.id,
                sectionId: section.id,
                message: `Heading exceeds ${threshold} characters (${content.length})`,
                description: 'Long headings may be difficult to scan and might cause layout issues.',
                canFix: false,
                ignored: false,
                snippet: content.substring(0, 50) + (content.length > 50 ? '...' : '')
              })
            }
          }
        })
      })
    })
    
    return issues
  }
}

export const validationRules: ValidationRule[] = [
  strandedHeadingRule,
  figureWithoutCaptionRule,
  tableWithoutHeaderRule,
  missingAltTextRule,
  longHeadingRule
]

export class ValidationEngine {
  private config: ValidationConfig = defaultValidationConfig

  setConfig(config: Partial<ValidationConfig>) {
    this.config = { ...this.config, ...config }
  }

  getConfig(): ValidationConfig {
    return this.config
  }

  validate(document: SemanticDocument, layoutResults?: Map<string, any>): ValidationIssue[] {
    const allIssues: ValidationIssue[] = []
    
    validationRules.forEach(rule => {
      const ruleConfig = this.config.rules[rule.id]
      if (ruleConfig?.enabled) {
        const issues = rule.validate(document, layoutResults)
        // Apply configured severity
        const adjustedIssues = issues.map(issue => ({
          ...issue,
          severity: ruleConfig.severity,
          ignored: this.config.ignoredIssues.includes(issue.id)
        }))
        allIssues.push(...adjustedIssues)
      }
    })
    
    return allIssues.filter(issue => !issue.ignored)
  }

  fixIssue(document: SemanticDocument, issue: ValidationIssue): SemanticDocument | null {
    const rule = validationRules.find(r => r.id === issue.ruleId)
    if (rule?.fix) {
      return rule.fix(document, issue)
    }
    return null
  }

  ignoreIssue(issueId: string) {
    if (!this.config.ignoredIssues.includes(issueId)) {
      this.config.ignoredIssues.push(issueId)
    }
  }

  unignoreIssue(issueId: string) {
    this.config.ignoredIssues = this.config.ignoredIssues.filter(id => id !== issueId)
  }

  ignoreRule(ruleId: string) {
    if (this.config.rules[ruleId]) {
      this.config.rules[ruleId].enabled = false
    }
  }
}

export const validationEngine = new ValidationEngine()
