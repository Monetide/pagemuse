import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type ViewMode = 'print' | 'screen'

interface ViewModeContextType {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  toggleViewMode: () => void
  preferences: {
    defaultMode: ViewMode
    stickyTOC: boolean
    screenFootnoteStyle: 'popover' | 'endnotes'
  }
  updatePreferences: (prefs: Partial<ViewModeContextType['preferences']>) => void
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined)

interface ViewModeProviderProps {
  children: ReactNode
  documentId?: string
}

const STORAGE_KEY = 'viewMode'
const PREFERENCES_KEY = 'viewModePreferences'

export const ViewModeProvider = ({ children, documentId }: ViewModeProviderProps) => {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    // Try to load from localStorage with document-specific key
    const key = documentId ? `${STORAGE_KEY}_${documentId}` : STORAGE_KEY
    const saved = localStorage.getItem(key)
    return (saved as ViewMode) || 'print'
  })

  const [preferences, setPreferencesState] = useState(() => {
    const saved = localStorage.getItem(PREFERENCES_KEY)
    return saved ? JSON.parse(saved) : {
      defaultMode: 'print' as ViewMode,
      stickyTOC: true,
      screenFootnoteStyle: 'popover' as 'popover' | 'endnotes'
    }
  })

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode)
    
    // Save to localStorage with document-specific key
    const key = documentId ? `${STORAGE_KEY}_${documentId}` : STORAGE_KEY
    localStorage.setItem(key, mode)
  }

  const toggleViewMode = () => {
    setViewMode(viewMode === 'print' ? 'screen' : 'print')
  }

  const updatePreferences = (prefs: Partial<ViewModeContextType['preferences']>) => {
    const newPrefs = { ...preferences, ...prefs }
    setPreferencesState(newPrefs)
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(newPrefs))
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+1 for Print mode
      if (e.altKey && e.key === '1') {
        e.preventDefault()
        setViewMode('print')
      }
      // Alt+2 for Screen mode
      else if (e.altKey && e.key === '2') {
        e.preventDefault()
        setViewMode('screen')
      }
      // Shift+V to toggle
      else if (e.shiftKey && e.key === 'V') {
        e.preventDefault()
        toggleViewMode()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [viewMode])

  return (
    <ViewModeContext.Provider value={{
      viewMode,
      setViewMode,
      toggleViewMode,
      preferences,
      updatePreferences
    }}>
      {children}
    </ViewModeContext.Provider>
  )
}

export const useViewMode = () => {
  const context = useContext(ViewModeContext)
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider')
  }
  return context
}