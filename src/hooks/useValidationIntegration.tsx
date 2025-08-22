import { useState, useEffect } from 'react'
import { TemplateValidationPreset } from '@/lib/template-model'
import { useToast } from '@/hooks/use-toast'

export interface ValidationIssue {
  id: string
  category: 'typography' | 'accessibility' | 'layout' | 'content' | 'brand'
  severity: 'error' | 'warning' | 'info'
  title: string
  description: string
  blockId?: string
  sectionId?: string
  autoFixAvailable: boolean
  suggestion?: string
}

export interface ValidationReport {
  documentId: string
  totalIssues: number
  errorCount: number
  warningCount: number
  infoCount: number
  issues: ValidationIssue[]
  lastUpdated: Date
  validationPreset: TemplateValidationPreset
}

export function useValidationIntegration(documentId: string) {
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null)
  const [activePreset, setActivePreset] = useState<TemplateValidationPreset | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const applyValidationPreset = async (preset: TemplateValidationPreset) => {
    setLoading(true)
    try {
      // In a real implementation, this would:
      // 1. Save the preset to the document metadata
      // 2. Re-run validation with the new rules
      // 3. Update the validation panel settings
      
      setActivePreset(preset)
      
      // Simulate validation run
      await runValidation(preset)
      
      toast({
        title: "Validation Preset Applied",
        description: `${preset.name} validation rules are now active for this document`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply validation preset",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const runValidation = async (preset: TemplateValidationPreset) => {
    // Mock validation - in real implementation, this would analyze the document
    const mockIssues: ValidationIssue[] = []
    
    // Typography issues
    if (preset.severity.typography !== 'info') {
      mockIssues.push({
        id: '1',
        category: 'typography',
        severity: preset.severity.typography,
        title: 'Font size below minimum',
        description: `Body text is 9pt, minimum required is ${preset.rules.typography.minBodyFontSize}pt`,
        blockId: 'block-1',
        autoFixAvailable: preset.autoFix.typography,
        suggestion: `Increase font size to ${preset.rules.typography.minBodyFontSize}pt or larger`
      })
    }

    // Accessibility issues
    if (preset.severity.accessibility !== 'info') {
      mockIssues.push({
        id: '2',
        category: 'accessibility',
        severity: preset.severity.accessibility,
        title: 'Low color contrast',
        description: `Contrast ratio is 3.2:1, minimum required is ${preset.rules.accessibility.minContrastRatio}:1`,
        blockId: 'block-2',
        autoFixAvailable: preset.autoFix.accessibility,
        suggestion: 'Use darker text or lighter background colors'
      })
    }

    // Layout issues
    if (preset.severity.layout !== 'info') {
      mockIssues.push({
        id: '3',
        category: 'layout',
        severity: preset.severity.layout,
        title: 'Margins too narrow',
        description: `Page margins are 0.5", minimum required is ${preset.rules.layout.minMargins}"`,
        sectionId: 'section-1',
        autoFixAvailable: preset.autoFix.layout,
        suggestion: `Increase margins to ${preset.rules.layout.minMargins}" or larger`
      })
    }

    const report: ValidationReport = {
      documentId,
      totalIssues: mockIssues.length,
      errorCount: mockIssues.filter(i => i.severity === 'error').length,
      warningCount: mockIssues.filter(i => i.severity === 'warning').length,
      infoCount: mockIssues.filter(i => i.severity === 'info').length,
      issues: mockIssues,
      lastUpdated: new Date(),
      validationPreset: preset
    }

    setValidationReport(report)
    return report
  }

  const autoFixIssues = async (categoryOrIssueIds?: string | string[]) => {
    if (!validationReport || !activePreset) return

    setLoading(true)
    try {
      let issuesToFix: ValidationIssue[]

      if (typeof categoryOrIssueIds === 'string') {
        // Fix all issues in a category
        issuesToFix = validationReport.issues.filter(
          issue => issue.category === categoryOrIssueIds && 
                   issue.autoFixAvailable &&
                   activePreset.autoFix[issue.category]
        )
      } else if (Array.isArray(categoryOrIssueIds)) {
        // Fix specific issues by ID
        issuesToFix = validationReport.issues.filter(
          issue => categoryOrIssueIds.includes(issue.id) && issue.autoFixAvailable
        )
      } else {
        // Fix all auto-fixable issues
        issuesToFix = validationReport.issues.filter(
          issue => issue.autoFixAvailable && activePreset.autoFix[issue.category]
        )
      }

      if (issuesToFix.length === 0) {
        toast({
          title: "No Auto-Fixable Issues",
          description: "No issues can be automatically fixed with current settings",
        })
        return
      }

      // Simulate fixing issues
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Remove fixed issues from report
      const updatedReport = {
        ...validationReport,
        issues: validationReport.issues.filter(
          issue => !issuesToFix.find(fixed => fixed.id === issue.id)
        ),
        lastUpdated: new Date()
      }

      updatedReport.totalIssues = updatedReport.issues.length
      updatedReport.errorCount = updatedReport.issues.filter(i => i.severity === 'error').length
      updatedReport.warningCount = updatedReport.issues.filter(i => i.severity === 'warning').length
      updatedReport.infoCount = updatedReport.issues.filter(i => i.severity === 'info').length

      setValidationReport(updatedReport)

      toast({
        title: "Issues Fixed",
        description: `${issuesToFix.length} issue${issuesToFix.length === 1 ? '' : 's'} automatically resolved`,
      })
    } catch (error) {
      toast({
        title: "Auto-Fix Failed",
        description: "Unable to automatically fix the selected issues",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const dismissIssue = (issueId: string) => {
    if (!validationReport) return

    const updatedReport = {
      ...validationReport,
      issues: validationReport.issues.filter(issue => issue.id !== issueId),
      lastUpdated: new Date()
    }

    updatedReport.totalIssues = updatedReport.issues.length
    updatedReport.errorCount = updatedReport.issues.filter(i => i.severity === 'error').length
    updatedReport.warningCount = updatedReport.issues.filter(i => i.severity === 'warning').length
    updatedReport.infoCount = updatedReport.issues.filter(i => i.severity === 'info').length

    setValidationReport(updatedReport)
  }

  return {
    validationReport,
    activePreset,
    loading,
    applyValidationPreset,
    runValidation,
    autoFixIssues,
    dismissIssue
  }
}