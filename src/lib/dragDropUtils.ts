import { Block } from '@/lib/document-model'
import { DropTarget } from '@/hooks/useDragAndDrop'

// Get default content for different block types
export function getDefaultBlockContent(blockType?: string): any {
  switch (blockType) {
    case 'heading':
      return { text: 'New Heading', level: 1 }
    case 'paragraph':
      return { text: 'Start typing...' }
    case 'quote':
      return { text: 'Add a quote here...', author: '' }
    case 'unordered-list':
    case 'ordered-list':
      return { items: ['New item'] }
    case 'figure':
      return {
        imageUrl: 'placeholder-image.jpg',
        caption: 'Add your caption here',
        number: 1,
        alt: 'Placeholder image'
      }
    case 'table':
      return {
        headers: ['Column 1', 'Column 2', 'Column 3'],
        rows: [
          ['Row 1, Cell 1', 'Row 1, Cell 2', 'Row 1, Cell 3'],
          ['Row 2, Cell 1', 'Row 2, Cell 2', 'Row 2, Cell 3'],
        ],
        caption: 'Table caption',
        number: 1
      }
    case 'cross-reference':
      return { text: 'Reference text', target: '' }
    case 'divider':
      return { style: 'solid' }
    case 'spacer':
      return { height: '1rem' }
    default:
      return { text: 'New block' }
  }
}

// Extract block ID from a drop target for insertion
export function getBlockIdFromDropTarget(dropTarget: DropTarget): string | null {
  if (!dropTarget.element) return null
  
  // Look for the nearest block element
  const blockElement = dropTarget.element.closest('[data-block-id]') as HTMLElement
  return blockElement?.getAttribute('data-block-id') || null
}

// Check if a block type is atomic (can't be nested)
export function isAtomicBlockType(blockType: string): boolean {
  const atomicBlocks = ['figure', 'table']
  return atomicBlocks.includes(blockType)
}

// Check if a block type is text-based (can be edited inline)
export function isTextBlockType(blockType: string): boolean {
  const textBlocks = ['heading', 'paragraph', 'quote', 'unordered-list', 'ordered-list']
  return textBlocks.includes(blockType)
}

// Get cursor style based on drop validity
export function getDropCursor(canDrop: boolean, isDragging: boolean): string {
  if (!isDragging) return 'default'
  return canDrop ? 'copy' : 'no-drop'
}