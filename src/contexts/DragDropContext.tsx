import { createContext, useContext, ReactNode } from 'react'
import { useDragAndDrop, DragData, DropTarget } from '@/hooks/useDragAndDrop'

interface DragDropContextType {
  dragState: ReturnType<typeof useDragAndDrop>['dragState']
  startDrag: (dragData: DragData, ghostPosition: { x: number; y: number }) => void
  updateDrag: (
    position: { x: number; y: number },
    dropTarget: DropTarget | null,
    canDrop: boolean
  ) => void
  endDrag: () => void
  setContainer: (element: HTMLElement | null) => void
}

const DragDropContext = createContext<DragDropContextType | null>(null)

interface DragDropProviderProps {
  children: ReactNode
}

export const DragDropProvider = ({ children }: DragDropProviderProps) => {
  const dragDropHook = useDragAndDrop()

  return (
    <DragDropContext.Provider value={dragDropHook}>
      {children}
    </DragDropContext.Provider>
  )
}

export const useDragDropContext = () => {
  const context = useContext(DragDropContext)
  if (!context) {
    throw new Error('useDragDropContext must be used within a DragDropProvider')
  }
  return context
}