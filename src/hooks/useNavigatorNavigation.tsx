import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Block, Section, Flow } from '@/lib/document-model'

interface NavigationTarget {
  type: 'section' | 'flow' | 'heading' | 'block'
  id: string
  sectionId?: string
  flowId?: string
}

export const useNavigatorNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [lastNavigatedTo, setLastNavigatedTo] = useState<string | null>(null)

  // Update URL hash when navigating
  const updateUrlHash = useCallback((target: NavigationTarget) => {
    let hash = ''
    switch (target.type) {
      case 'section':
        hash = `sec-${target.id}`
        break
      case 'flow':
        hash = `flow-${target.id}`
        break
      case 'heading':
      case 'block':
        hash = `block-${target.id}`
        break
    }
    
    if (hash) {
      const newPath = `${location.pathname}#${hash}`
      window.history.pushState(null, '', newPath)
      setLastNavigatedTo(target.id)
    }
  }, [location.pathname])

  // Jump to section - expand if collapsed, scroll to start, select section
  const jumpToSection = useCallback((sectionId: string, createMainFlowIfEmpty?: boolean) => {
    const sectionElement = document.getElementById(`section-${sectionId}`)
    
    if (sectionElement) {
      // Smooth scroll with offset for sticky header
      sectionElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
      
      // Add highlight effect
      sectionElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
      setTimeout(() => {
        sectionElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
      }, 2000)
      
      updateUrlHash({ type: 'section', id: sectionId })
      return true
    }
    
    return false
  }, [updateUrlHash])

  // Jump to flow - scroll to first block or insertion line
  const jumpToFlow = useCallback((flowId: string, sectionId: string) => {
    const flowElement = document.getElementById(`flow-${flowId}`)
    
    if (flowElement) {
      flowElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
      
      // Add highlight effect
      flowElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
      setTimeout(() => {
        flowElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
      }, 2000)
      
      updateUrlHash({ type: 'flow', id: flowId, sectionId })
      return true
    }
    
    return false
  }, [updateUrlHash])

  // Jump to heading - scroll with proper offset, select and focus for editing
  const jumpToHeading = useCallback((blockId: string, sectionId?: string, placeCaret: boolean = true) => {
    const targetElement = document.getElementById(`block-${blockId}`)
    
    if (targetElement) {
      // Calculate offset for sticky header (approximate)
      const headerHeight = 60
      const elementRect = targetElement.getBoundingClientRect()
      const absoluteElementTop = elementRect.top + window.pageYOffset
      const scrollToY = absoluteElementTop - headerHeight
      
      window.scrollTo({
        top: scrollToY,
        behavior: 'smooth'
      })
      
      // Add highlight effect
      targetElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
      setTimeout(() => {
        targetElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
      }, 2000)
      
      if (placeCaret) {
        // Focus the element for accessibility and caret placement
        if (targetElement.tabIndex === -1) {
          targetElement.tabIndex = 0
        }
        targetElement.focus()
        
        // If it's an editable text element, place caret at start
        const editableElement = targetElement.querySelector('[contenteditable]') as HTMLElement
        if (editableElement) {
          editableElement.focus()
          // Place caret at start
          const range = document.createRange()
          const selection = window.getSelection()
          range.setStart(editableElement, 0)
          range.collapse(true)
          selection?.removeAllRanges()
          selection?.addRange(range)
        }
      }
      
      updateUrlHash({ type: 'heading', id: blockId, sectionId })
      return true
    }
    
    return false
  }, [updateUrlHash])

  // Jump to block - different behavior based on block type
  const jumpToBlock = useCallback((blockId: string, blockType: string, sectionId?: string, placeCaret: boolean = true) => {
    const targetElement = document.getElementById(`block-${blockId}`)
    
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
      
      // Add highlight effect
      targetElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
      setTimeout(() => {
        targetElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
      }, 2000)
      
      if (placeCaret) {
        // For text blocks, place caret at start
        if (['paragraph', 'list-item', 'caption', 'quote'].includes(blockType)) {
          const editableElement = targetElement.querySelector('[contenteditable]') as HTMLElement
          if (editableElement) {
            editableElement.focus()
            const range = document.createRange()
            const selection = window.getSelection()
            range.setStart(editableElement, 0)
            range.collapse(true)
            selection?.removeAllRanges()
            selection?.addRange(range)
          }
        } else {
          // For non-text blocks, just select (no caret)
          targetElement.focus()
        }
      }
      
      updateUrlHash({ type: 'block', id: blockId, sectionId })
      return true
    }
    
    return false
  }, [updateUrlHash])

  // Handle keyboard navigation
  const handleKeyboardNavigation = useCallback((event: KeyboardEvent, currentSelection: string, navigationItems: any[]) => {
    if (!currentSelection || navigationItems.length === 0) return false
    
    const currentIndex = navigationItems.findIndex(item => 
      item.id === currentSelection || 
      item.sectionId === currentSelection
    )
    
    if (currentIndex === -1) return false
    
    let newIndex = currentIndex
    
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        newIndex = Math.max(0, currentIndex - 1)
        break
      case 'ArrowDown':
        event.preventDefault()
        newIndex = Math.min(navigationItems.length - 1, currentIndex + 1)
        break
      case 'Enter':
        event.preventDefault()
        const item = navigationItems[currentIndex]
        if (item) {
          const shouldPlaceCaret = !event.shiftKey
          switch (item.type) {
            case 'section':
              jumpToSection(item.id)
              break
            case 'flow':
              jumpToFlow(item.id, item.sectionId)
              break
            case 'heading':
              jumpToHeading(item.id, item.sectionId, shouldPlaceCaret)
              break
            case 'block':
              jumpToBlock(item.id, item.blockType, item.sectionId, shouldPlaceCaret)
              break
          }
        }
        return true
      default:
        return false
    }
    
    return true
  }, [jumpToSection, jumpToFlow, jumpToHeading, jumpToBlock])

  // Reveal in Navigator - called when canvas selection changes
  const revealInNavigator = useCallback((blockId: string, sectionId?: string) => {
    const navigatorElement = document.getElementById('navigator-panel')
    const targetNavItem = document.getElementById(`nav-item-${blockId}`)
    
    if (navigatorElement && targetNavItem) {
      // Scroll navigator to keep item in view
      const navRect = navigatorElement.getBoundingClientRect()
      const itemRect = targetNavItem.getBoundingClientRect()
      
      if (itemRect.top < navRect.top || itemRect.bottom > navRect.bottom) {
        targetNavItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
      }
    }
  }, [])

  // Handle URL hash on page load/navigation
  useEffect(() => {
    const hash = location.hash.slice(1) // Remove #
    if (hash && hash !== lastNavigatedTo) {
      setTimeout(() => {
        if (hash.startsWith('sec-')) {
          const sectionId = hash.replace('sec-', '')
          jumpToSection(sectionId)
        } else if (hash.startsWith('flow-')) {
          const flowId = hash.replace('flow-', '')
          const flowElement = document.getElementById(`flow-${flowId}`)
          if (flowElement) {
            jumpToFlow(flowId, '') // sectionId would need to be derived
          }
        } else if (hash.startsWith('block-')) {
          const blockId = hash.replace('block-', '')
          const blockElement = document.getElementById(`block-${blockId}`)
          if (blockElement) {
            jumpToHeading(blockId, '', false) // Don't place caret on hash navigation
          }
        }
      }, 100) // Small delay to ensure DOM is ready
    }
  }, [location.hash, lastNavigatedTo, jumpToSection, jumpToFlow, jumpToHeading])

  return {
    jumpToSection,
    jumpToFlow,
    jumpToHeading,
    jumpToBlock,
    handleKeyboardNavigation,
    revealInNavigator,
    updateUrlHash
  }
}
