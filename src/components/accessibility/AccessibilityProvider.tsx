import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface AccessibilityState {
  focusedSection: 'sidebar' | 'canvas' | 'inspector' | null
  selectedBlockId: string | null
  keyboardNavigationEnabled: boolean
  announcements: string[]
}

interface AccessibilityActions {
  setFocusedSection: (section: 'sidebar' | 'canvas' | 'inspector' | null) => void
  setSelectedBlockId: (id: string | null) => void
  setKeyboardNavigationEnabled: (enabled: boolean) => void
  announce: (message: string) => void
  clearAnnouncements: () => void
}

interface AccessibilityContextType extends AccessibilityState, AccessibilityActions {}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

interface AccessibilityProviderProps {
  children: ReactNode
}

export const AccessibilityProvider = ({ children }: AccessibilityProviderProps) => {
  const [state, setState] = useState<AccessibilityState>({
    focusedSection: null,
    selectedBlockId: null,
    keyboardNavigationEnabled: true,
    announcements: []
  })

  const setFocusedSection = useCallback((section: 'sidebar' | 'canvas' | 'inspector' | null) => {
    setState(prev => ({ ...prev, focusedSection: section }))
  }, [])

  const setSelectedBlockId = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedBlockId: id }))
  }, [])

  const setKeyboardNavigationEnabled = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, keyboardNavigationEnabled: enabled }))
  }, [])

  const announce = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      announcements: [...prev.announcements, message].slice(-10) // Keep last 10 announcements
    }))
    
    // Clear announcement after 5 seconds
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        announcements: prev.announcements.filter(a => a !== message)
      }))
    }, 5000)
  }, [])

  const clearAnnouncements = useCallback(() => {
    setState(prev => ({ ...prev, announcements: [] }))
  }, [])

  const contextValue: AccessibilityContextType = {
    ...state,
    setFocusedSection,
    setSelectedBlockId,
    setKeyboardNavigationEnabled,
    announce,
    clearAnnouncements
  }

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      
      {/* Screen Reader Announcements */}
      <div
        id="sr-announcements"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {state.announcements.map((announcement, index) => (
          <div key={`${announcement}-${index}`}>{announcement}</div>
        ))}
      </div>
    </AccessibilityContext.Provider>
  )
}

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}