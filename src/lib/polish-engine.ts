import { SemanticDocument, Block } from './document-model'
import { validationEngine, ValidationIssue } from './validation-engine'

export interface PolishAction {
  id: string
  type: 'fix' | 'manual'
  issueId: string
  ruleId: string
  description: string
  applied: boolean
  undoData?: any
}

export interface PolishReport {
  appliedFixes: PolishAction[]
  manualActions: PolishAction[]
  remainingIssues: ValidationIssue[]
  totalIssues: number
  fixedIssues: number
  success: boolean
}

export class PolishEngine {
  async runOneClickPolish(
    document: SemanticDocument,
    brandKit?: any,
    logoSettings?: any
  ): Promise<{ document: SemanticDocument; report: PolishReport }> {
    // First, run validation to get all issues
    const issues = validationEngine.validate(document, new Map(), brandKit, logoSettings)
    
    let currentDocument = { ...document }
    const appliedFixes: PolishAction[] = []
    const manualActions: PolishAction[] = []
    
    // Apply safe auto-fixes in priority order
    const autoFixableRules = [
      'table-without-header',
      'stranded-heading', 
      'figure-without-caption',
      'min-font-size',
      'low-contrast-auto',
      'excessive-hyphenation'
    ]
    
    for (const ruleId of autoFixableRules) {
      const ruleIssues = issues.filter(issue => 
        issue.ruleId === ruleId && issue.canFix && !issue.ignored
      )
      
      for (const issue of ruleIssues) {
        try {
          const fixedDocument = validationEngine.fixIssue(currentDocument, issue, brandKit, logoSettings)
          if (fixedDocument) {
            const undoData = this.createUndoData(currentDocument, issue)
            
            appliedFixes.push({
              id: `fix-${issue.id}`,
              type: 'fix',
              issueId: issue.id,
              ruleId: issue.ruleId,
              description: this.getFixDescription(issue),
              applied: true,
              undoData
            })
            
            currentDocument = fixedDocument
          }
        } catch (error) {
          console.error(`Failed to fix issue ${issue.id}:`, error)
        }
      }
    }
    
    // Identify issues that need manual attention
    const remainingIssues = validationEngine.validate(currentDocument, new Map(), brandKit, logoSettings)
    const manualIssues = remainingIssues.filter(issue => 
      issue.ruleId === 'missing-alt-text' || 
      !issue.canFix ||
      issue.severity === 'error'
    )
    
    manualIssues.forEach(issue => {
      manualActions.push({
        id: `manual-${issue.id}`,
        type: 'manual',
        issueId: issue.id,
        ruleId: issue.ruleId,
        description: this.getManualActionDescription(issue),
        applied: false
      })
    })
    
    const report: PolishReport = {
      appliedFixes,
      manualActions,
      remainingIssues,
      totalIssues: issues.length,
      fixedIssues: appliedFixes.length,
      success: remainingIssues.length === 0 || remainingIssues.every(issue => 
        issue.ruleId === 'missing-alt-text' || issue.severity === 'info'
      )
    }
    
    return { document: currentDocument, report }
  }
  
  private createUndoData(document: SemanticDocument, issue: ValidationIssue): any {
    // Find the block that was modified
    const section = document.sections.find(s => s.id === issue.sectionId)
    if (!section) return null
    
    for (const flow of section.flows) {
      const block = flow.blocks.find(b => b.id === issue.blockId)
      if (block) {
        return {
          blockId: issue.blockId,
          sectionId: issue.sectionId,
          originalBlock: JSON.parse(JSON.stringify(block))
        }
      }
    }
    
    return null
  }
  
  private getFixDescription(issue: ValidationIssue): string {
    switch (issue.ruleId) {
      case 'table-without-header':
        return 'Set first row as table header'
      case 'stranded-heading':
        return 'Applied keep-with-next to prevent orphaned heading'
      case 'figure-without-caption':
        return 'Added placeholder caption to figure'
      case 'min-font-size':
        return 'Increased font size to meet minimum requirements'
      case 'low-contrast-auto':
        return 'Adjusted colors to improve contrast ratio'
      case 'excessive-hyphenation':
        return 'Reduced hyphenation in paragraph'
      default:
        return `Applied automatic fix for ${issue.ruleId}`
    }
  }
  
  private getManualActionDescription(issue: ValidationIssue): string {
    switch (issue.ruleId) {
      case 'missing-alt-text':
        return 'Add meaningful alt text or mark as decorative'
      case 'broken-cross-reference':
        return 'Fix or remove broken cross-reference'
      case 'low-contrast':
        return 'Manual color adjustment needed for accessibility'
      default:
        return issue.description
    }
  }
  
  undoFix(document: SemanticDocument, action: PolishAction): SemanticDocument | null {
    if (!action.undoData || action.type !== 'fix') {
      return null
    }
    
    const { blockId, sectionId, originalBlock } = action.undoData
    
    const updatedDocument = { ...document }
    updatedDocument.sections = document.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          flows: section.flows.map(flow => ({
            ...flow,
            blocks: flow.blocks.map(block => {
              if (block.id === blockId) {
                return originalBlock
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

export const polishEngine = new PolishEngine()