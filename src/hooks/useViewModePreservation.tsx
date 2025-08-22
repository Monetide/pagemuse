import { useEffect, useRef } from 'react'
import { useViewMode } from '@/contexts/ViewModeContext'

interface ViewModePreservationState {
  selectedBlockId?: string
  scrollPosition?: number
  focusedElement?: string
}

export const useViewModePreservation = (
  selectedBlockId?: string
) => {
  const { viewMode } = useViewMode()
  const preservationState = useRef<ViewModePreservationState>({})
  const previousViewMode = useRef(viewMode)

  useEffect(() => {
    // Save state when view mode is about to change
    if (previousViewMode.current !== viewMode) {
      preservationState.current = {
        selectedBlockId,
        scrollPosition: window.scrollY,
        focusedElement: document.activeElement?.id
      }
    }

    previousViewMode.current = viewMode
  }, [viewMode, selectedBlockId])

  useEffect(() => {
    // Restore state after view mode change
    if (preservationState.current.scrollPosition !== undefined) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        // Restore scroll position
        window.scrollTo({
          top: preservationState.current.scrollPosition!,
          behavior: 'smooth'
        })

        // Re-center on selected block if it exists
        if (preservationState.current.selectedBlockId) {
          const element = document.getElementById(`block-${preservationState.current.selectedBlockId}`)
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            })
          }
        }

        // Restore focus if possible
        if (preservationState.current.focusedElement) {
          const focusedElement = document.getElementById(preservationState.current.focusedElement)
          focusedElement?.focus()
        }

        // Clear preservation state
        preservationState.current = {}
      })
    }
  }, [viewMode])

  return {
    preserveState: () => {
      preservationState.current = {
        selectedBlockId,
        scrollPosition: window.scrollY,
        focusedElement: document.activeElement?.id
      }
    }
  }
}