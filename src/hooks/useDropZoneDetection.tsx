import { useCallback } from 'react'
import { DropTarget } from '@/hooks/useDragAndDrop'

interface HitTestResult {
  dropTarget: DropTarget | null
  canDrop: boolean
}

export const useDropZoneDetection = () => {
  const hitTestDropZone = useCallback((
    clientX: number,
    clientY: number,
    draggedBlockType?: string
  ): HitTestResult => {
    // Get element at pointer position
    const element = document.elementFromPoint(clientX, clientY) as HTMLElement
    if (!element) {
      return { dropTarget: null, canDrop: false }
    }

    // Check if we're over an invalid area (margins, header, footer, debug overlays)
    if (isInvalidDropZone(element)) {
      return { dropTarget: null, canDrop: false }
    }

    // Find the nearest block or flow container
    const blockElement = findNearestBlock(element)
    const flowElement = findNearestFlow(element)
    
    if (blockElement && flowElement) {
      const blockInfo = getBlockInfo(blockElement)
      const flowInfo = getFlowInfo(flowElement)
      
      if (blockInfo && flowInfo) {
        // Determine insertion position relative to the block
        const rect = blockElement.getBoundingClientRect()
        const midY = rect.top + rect.height / 2
        const position = clientY < midY ? 'before' : 'after'
        
        // Check if this block type can be dropped here
        const canDrop = canDropBlockType(draggedBlockType, blockElement, flowElement)
        
        return {
          dropTarget: {
            sectionId: flowInfo.sectionId,
            flowId: flowInfo.flowId,
            index: blockInfo.index,
            position,
            element: blockElement
          },
          canDrop
        }
      }
    } else if (flowElement) {
      // Dropping in empty area of a flow
      const flowInfo = getFlowInfo(flowElement)
      if (flowInfo) {
        const canDrop = canDropBlockType(draggedBlockType, null, flowElement)
        
        return {
          dropTarget: {
            sectionId: flowInfo.sectionId,
            flowId: flowInfo.flowId,
            index: flowInfo.blockCount,
            position: 'append',
            element: flowElement
          },
          canDrop
        }
      }
    }

    return { dropTarget: null, canDrop: false }
  }, [])

  return { hitTestDropZone }
}

// Helper functions
function isInvalidDropZone(element: HTMLElement): boolean {
  // Check for invalid drop zones
  const invalidSelectors = [
    '[data-drop-invalid]',
    '.document-header',
    '.document-footer', 
    '.debug-overlay',
    '.version-history-panel',
    '.inspector-panel'
  ]
  
  return invalidSelectors.some(selector => element.closest(selector))
}

function findNearestBlock(element: HTMLElement): HTMLElement | null {
  return element.closest('[data-block-id]') as HTMLElement
}

function findNearestFlow(element: HTMLElement): HTMLElement | null {
  return element.closest('[data-flow-id]') as HTMLElement
}

function getBlockInfo(blockElement: HTMLElement): { index: number; blockId: string } | null {
  const blockId = blockElement.getAttribute('data-block-id')
  const indexAttr = blockElement.getAttribute('data-block-index')
  
  if (!blockId || !indexAttr) return null
  
  return {
    blockId,
    index: parseInt(indexAttr, 10)
  }
}

function getFlowInfo(flowElement: HTMLElement): { 
  sectionId: string; 
  flowId: string; 
  blockCount: number 
} | null {
  const flowId = flowElement.getAttribute('data-flow-id')
  const sectionId = flowElement.getAttribute('data-section-id')
  const blocks = flowElement.querySelectorAll('[data-block-id]')
  
  if (!flowId || !sectionId) return null
  
  return {
    flowId,
    sectionId,
    blockCount: blocks.length
  }
}

function canDropBlockType(
  blockType?: string, 
  targetBlock?: HTMLElement | null, 
  targetFlow?: HTMLElement | null
): boolean {
  if (!blockType) return false
  
  // Check if target is a table cell
  if (targetBlock) {
    const tableElement = targetBlock.closest('[data-block-type="table"]')
    if (tableElement) {
      // Only allow text blocks in table cells
      const textBlocks = ['heading', 'paragraph', 'quote', 'unordered-list', 'ordered-list']
      return textBlocks.includes(blockType)
    }
  }
  
  // Atomic blocks (Figure, Table, etc.) have special rules
  const atomicBlocks = ['figure', 'table']
  if (atomicBlocks.includes(blockType)) {
    // Can't nest atomic blocks inside other atomic blocks
    if (targetBlock) {
      const targetBlockType = targetBlock.getAttribute('data-block-type')
      if (targetBlockType && atomicBlocks.includes(targetBlockType)) {
        return false
      }
    }
  }
  
  return true
}