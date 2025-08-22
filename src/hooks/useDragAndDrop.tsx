import { useState, useCallback, useRef, useEffect } from 'react'
import { Block } from '@/lib/document-model'

export interface DragData {
  type: 'block-type' | 'existing-block'
  blockType?: Block['type']
  blockId?: string
  sourceElement?: HTMLElement
}

export interface DropTarget {
  sectionId: string
  flowId: string
  index: number
  position: 'before' | 'after' | 'append'
  element?: HTMLElement
}

export interface DragState {
  isDragging: boolean
  dragData: DragData | null
  dropTarget: DropTarget | null
  ghostPosition: { x: number; y: number } | null
  canDrop: boolean
  scrollDirection: 'up' | 'down' | null
}

const SCROLL_THRESHOLD = 50 // pixels from edge to start auto-scroll
const SCROLL_SPEED = 5 // pixels per frame

export const useDragAndDrop = () => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragData: null,
    dropTarget: null,
    ghostPosition: null,
    canDrop: false,
    scrollDirection: null
  })

  const scrollIntervalRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLElement | null>(null)

  // Start dragging
  const startDrag = useCallback((dragData: DragData, ghostPosition: { x: number; y: number }) => {
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      dragData,
      ghostPosition,
      canDrop: false
    }))
  }, [])

  // Update drag position and check for drop targets
  const updateDrag = useCallback((
    position: { x: number; y: number },
    dropTarget: DropTarget | null,
    canDrop: boolean
  ) => {
    setDragState(prev => ({
      ...prev,
      ghostPosition: position,
      dropTarget,
      canDrop
    }))

    // Check for auto-scroll
    if (containerRef.current && dropTarget) {
      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const distanceFromTop = position.y - rect.top
      const distanceFromBottom = rect.bottom - position.y

      let scrollDirection: 'up' | 'down' | null = null
      
      if (distanceFromTop < SCROLL_THRESHOLD && container.scrollTop > 0) {
        scrollDirection = 'up'
      } else if (distanceFromBottom < SCROLL_THRESHOLD) {
        scrollDirection = 'down'
      }

      setDragState(prev => ({ ...prev, scrollDirection }))

      // Start auto-scroll if needed
      if (scrollDirection && !scrollIntervalRef.current) {
        scrollIntervalRef.current = window.setInterval(() => {
          if (scrollDirection === 'up') {
            container.scrollTop = Math.max(0, container.scrollTop - SCROLL_SPEED)
          } else {
            container.scrollTop += SCROLL_SPEED
          }
        }, 16) // ~60fps
      } else if (!scrollDirection && scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
        scrollIntervalRef.current = null
      }
    }
  }, [])

  // End dragging
  const endDrag = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
      scrollIntervalRef.current = null
    }

    setDragState({
      isDragging: false,
      dragData: null,
      dropTarget: null,
      ghostPosition: null,
      canDrop: false,
      scrollDirection: null
    })
  }, [])

  // Set container reference for auto-scroll
  const setContainer = useCallback((element: HTMLElement | null) => {
    containerRef.current = element
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
      }
    }
  }, [])

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    setContainer
  }
}