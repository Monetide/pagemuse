import { useCallback } from 'react'

export const useTOCNavigation = () => {
  const jumpToHeading = useCallback((blockId: string, sectionId?: string) => {
    // Find the target element
    const targetElement = document.getElementById(`block-${blockId}`)
    
    if (targetElement) {
      // Smooth scroll to the element
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
      
      // Add a brief highlight effect
      targetElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
      
      // Remove highlight after animation
      setTimeout(() => {
        targetElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
      }, 2000)
      
      // Focus the element for accessibility
      if (targetElement.tabIndex === -1) {
        targetElement.tabIndex = 0
      }
      targetElement.focus()
      
      return true
    }
    
    return false
  }, [])

  return { jumpToHeading }
}