import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import { SemanticDocument } from '@/lib/document-model'
import { validationEngine, ValidationIssue, ValidationConfig } from '@/lib/validation-engine'
import { useBrandKits } from '@/hooks/useBrandKits'
import { LogoPlacementSettings } from '@/components/brand/LogoPlacementControls'

interface ValidationContextType {
  issues: ValidationIssue[]
  isValidating: boolean
  lastValidated: Date | null
  config: ValidationConfig
  
  // Actions
  runValidation: (document: any, brandKit?: string, logoSetting?: LogoPlacementSettings) => void
  fixIssue: (document: any, issue: ValidationIssue) => SemanticDocument | null
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
  
  // Brand validation context
  brandKitId?: string
  logoSettings?: LogoPlacementSettings
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
  const { brandKits } = useBrandKits()
  
  const [issues, setIssues] = useState<ValidationIssue[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [lastValidated, setLastValidated] = useState<Date | null>(null)
  const [config, setConfig] = useState<ValidationConfig>(validationEngine.getConfig())
  
  // UI state
  const [isValidationPanelOpen, setValidationPanelOpen] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<ValidationIssue | null>(null)
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all')
  const [brandKitId, setBrandKitId] = useState<string>()
  const [logoSettings, setLogoSettings] = useState<LogoPlacementSettings>()
  
  const currentBrandKit = brandKitId ? brandKits.find(kit => kit.id === brandKitId) : undefined
  const layoutResults = useMemo(() => new Map(), [])

  const runValidation = useCallback((doc: any, brandKit?: string, logoSetting?: LogoPlacementSettings) => {
    if (!doc) return
    
    setIsValidating(true)
    
    try {
      const currentKit = brandKit ? brandKits.find(kit => kit.id === brandKit) : currentBrandKit
      const validationIssues = validationEngine.validate(doc, layoutResults, currentKit, logoSetting || logoSettings)
      setIssues(validationIssues)
      setLastValidated(new Date())
      
      // Set brand kit context if provided
      if (brandKit) setBrandKitId(brandKit)
      if (logoSetting) setLogoSettings(logoSetting)
    } catch (error) {
      console.error('Validation failed:', error)
      setIssues([])
    } finally {
      setIsValidating(false)
    }
  }, [layoutResults, brandKits, currentBrandKit, logoSettings])

  const fixIssue = useCallback((doc: any, issue: ValidationIssue) => {
    const updatedDocument = validationEngine.fixIssue(doc, issue, currentBrandKit, logoSettings)
    if (updatedDocument) {
      // Remove the fixed issue from the current issues list
      setIssues(prev => prev.filter(i => i.id !== issue.id))
      // Re-run validation after fix
      runValidation(updatedDocument)
    }
    return updatedDocument
  }, [currentBrandKit, logoSettings, runValidation])

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
    setFilterSeverity,
    
    brandKitId,
    logoSettings
  }

  return (
    <ValidationContext.Provider value={value}>
      {children}
    </ValidationContext.Provider>
  )
}