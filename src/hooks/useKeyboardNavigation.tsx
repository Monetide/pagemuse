import { useEffect, useCallback, useRef } from 'react'

interface KeyboardNavigationConfig {
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onEnter?: () => void
  onEscape?: () => void
  onTab?: (shift: boolean) => void
  onSpace?: () => void
  enabled?: boolean
}

export const useKeyboardNavigation = (config: KeyboardNavigationConfig) => {
  const {
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onEnter,
    onEscape,
    onTab,
    onSpace,
    enabled = true
  } = config

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    const { key, shiftKey, metaKey, ctrlKey, altKey } = event
    
    // Don't intercept when modifier keys are held (except shift for tab)
    if ((metaKey || ctrlKey || altKey) && !(key === 'Tab' && shiftKey)) {
      return
    }

    switch (key) {
      case 'ArrowUp':
        event.preventDefault()
        onArrowUp?.()
        break
      case 'ArrowDown':
        event.preventDefault()
        onArrowDown?.()
        break
      case 'ArrowLeft':
        event.preventDefault()
        onArrowLeft?.()
        break
      case 'ArrowRight':
        event.preventDefault()
        onArrowRight?.()
        break
      case 'Enter':
        event.preventDefault()
        onEnter?.()
        break
      case 'Escape':
        event.preventDefault()
        onEscape?.()
        break
      case 'Tab':
        if (onTab) {
          event.preventDefault()
          onTab(shiftKey)
        }
        break
      case ' ':
        // Only prevent default for space if we have a handler
        if (onSpace) {
          event.preventDefault()
          onSpace()
        }
        break
    }
  }, [enabled, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onEnter, onEscape, onTab, onSpace])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

export const useFocusManagement = () => {
  const focusableElements = useRef<HTMLElement[]>([])
  const currentFocusIndex = useRef(-1)

  const updateFocusableElements = useCallback((container: HTMLElement) => {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    focusableElements.current = Array.from(
      container.querySelectorAll(selectors)
    ) as HTMLElement[]
  }, [])

  const focusNext = useCallback(() => {
    if (focusableElements.current.length === 0) return

    currentFocusIndex.current = Math.min(
      currentFocusIndex.current + 1,
      focusableElements.current.length - 1
    )
    focusableElements.current[currentFocusIndex.current]?.focus()
  }, [])

  const focusPrevious = useCallback(() => {
    if (focusableElements.current.length === 0) return

    currentFocusIndex.current = Math.max(currentFocusIndex.current - 1, 0)
    focusableElements.current[currentFocusIndex.current]?.focus()
  }, [])

  const focusFirst = useCallback(() => {
    if (focusableElements.current.length === 0) return
    
    currentFocusIndex.current = 0
    focusableElements.current[0]?.focus()
  }, [])

  const focusLast = useCallback(() => {
    if (focusableElements.current.length === 0) return
    
    currentFocusIndex.current = focusableElements.current.length - 1
    focusableElements.current[currentFocusIndex.current]?.focus()
  }, [])

  const setCurrentFocusIndex = useCallback((index: number) => {
    currentFocusIndex.current = Math.max(0, Math.min(index, focusableElements.current.length - 1))
  }, [])

  return {
    updateFocusableElements,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    setCurrentFocusIndex,
    getFocusableElements: () => focusableElements.current,
    getCurrentFocusIndex: () => currentFocusIndex.current
  }
}