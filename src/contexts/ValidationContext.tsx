import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { SemanticDocument } from '@/lib/document-model'
import { validationEngine, ValidationIssue, ValidationConfig } from '@/lib/validation-engine'

interface ValidationContextType {
  issues: ValidationIssue[]
  isValidating: boolean
  lastValidated: Date | null
  config: ValidationConfig
  
  // Actions
  runValidation: (document: SemanticDocument, layoutResults?: Map<string, any>) => void
  fixIssue: (document: SemanticDocument, issue: ValidationIssue) => SemanticDocument | null
  ignoreIssue: (issueId: string) => void
  unignoreIssue: (issueId: string) => void
  ignoreRule: (ruleId: string) => void
  updateConfig: (config: Partial<ValidationConfig>) => void
  
  // UI state
  isValidationPanelOpen: boolean
  setValidationPanelOpen: (open: boolean) => void
  selectedIssue: ValidationIssue | null
  setSelectedIssue: (issue: ValidationIssue | null) => void
  filterSeverity: 'all' | 'error' | 'warning' | 'info'
  setFilterSeverity: (severity: 'all' | 'error' | 'warning' | 'info') => void
}

const ValidationContext = createContext<ValidationContextType | null>(null)

export const useValidation = () => {
  const context = useContext(ValidationContext)
  if (!context) {
    throw new Error('useValidation must be used within a ValidationProvider')
  }
  return context
}

interface ValidationProviderProps {
  children: React.ReactNode
}

export const ValidationProvider = ({ children }: ValidationProviderProps) => {
  const [issues, setIssues] = useState<ValidationIssue[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [lastValidated, setLastValidated] = useState<Date | null>(null)
  const [config, setConfig] = useState<ValidationConfig>(validationEngine.getConfig())
  
  // UI state
  const [isValidationPanelOpen, setValidationPanelOpen] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<ValidationIssue | null>(null)
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all')

  const runValidation = useCallback(async (document: SemanticDocument, layoutResults?: Map<string, any>) => {
    setIsValidating(true)
    try {
      // Simulate async validation for better UX
      await new Promise(resolve => setTimeout(resolve, 100))
      const validationIssues = validationEngine.validate(document, layoutResults)
      setIssues(validationIssues)
      setLastValidated(new Date())
    } catch (error) {
      console.error('Validation failed:', error)
      setIssues([])
    } finally {
      setIsValidating(false)
    }
  }, [])

  const fixIssue = useCallback((document: SemanticDocument, issue: ValidationIssue) => {
    const updatedDocument = validationEngine.fixIssue(document, issue)
    if (updatedDocument) {
      // Remove the fixed issue from the current issues list
      setIssues(prev => prev.filter(i => i.id !== issue.id))
    }
    return updatedDocument
  }, [])

  const ignoreIssue = useCallback((issueId: string) => {
    validationEngine.ignoreIssue(issueId)
    setIssues(prev => prev.filter(issue => issue.id !== issueId))
    setConfig(validationEngine.getConfig())
  }, [])

  const unignoreIssue = useCallback((issueId: string) => {
    validationEngine.unignoreIssue(issueId)
    setConfig(validationEngine.getConfig())
  }, [])

  const ignoreRule = useCallback((ruleId: string) => {
    validationEngine.ignoreRule(ruleId)
    setIssues(prev => prev.filter(issue => issue.ruleId !== ruleId))
    setConfig(validationEngine.getConfig())
  }, [])

  const updateConfig = useCallback((newConfig: Partial<ValidationConfig>) => {
    validationEngine.setConfig(newConfig)
    setConfig(validationEngine.getConfig())
  }, [])

  // Auto-open validation panel when issues are found
  useEffect(() => {
    if (issues.length > 0 && issues.some(issue => issue.severity === 'error')) {
      setValidationPanelOpen(true)
    }
  }, [issues])

  const value: ValidationContextType = {
    issues,
    isValidating,
    lastValidated,
    config,
    
    runValidation,
    fixIssue,
    ignoreIssue,
    unignoreIssue,
    ignoreRule,
    updateConfig,
    
    isValidationPanelOpen,
    setValidationPanelOpen,
    selectedIssue,
    setSelectedIssue,
    filterSeverity,
    setFilterSeverity
  }

  return (
    <ValidationContext.Provider value={value}>
      {children}
    </ValidationContext.Provider>
  )
}