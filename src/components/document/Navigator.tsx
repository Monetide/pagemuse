import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SemanticDocument, Section, Flow, Block } from '@/lib/document-model'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Plus,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Hash,
  FileText,
  Layers,
  MoreHorizontal,
  Trash2,
  ArrowDown,
  Info,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SectionContextMenu } from './SectionContextMenu'
import { useDragDropContext } from '@/contexts/DragDropContext'

interface NavigatorProps {
  document: SemanticDocument
  selectedSectionId?: string
  selectedSectionIds?: string[]
  selectedBlockId?: string
  focusedBlockId?: string
  onSectionSelect: (sectionId: string) => void
  onMultiSectionSelect?: (sectionIds: string[]) => void
  onAddSection: (name: string) => void
  onAddFlow: (sectionId: string, name: string) => void
  onReorderSections: (sections: Section[]) => void
  onJumpToHeading?: (blockId: string, blockType: string, sectionId?: string, event?: React.MouseEvent) => void
  onJumpToSection?: (sectionId: string) => void
  onJumpToFlow?: (flowId: string, sectionId: string) => void
  onJumpToBlock?: (blockId: string, blockType: string, sectionId?: string) => void
  onDeleteSections?: (sectionIds: string[]) => void
  onRenameSection?: (sectionId: string, newName: string) => void
  onDuplicateSection?: (sectionId: string) => void
  onMoveSectionUp?: (sectionId: string) => void
  onMoveSectionDown?: (sectionId: string) => void
  onBlockDrop?: (sectionId: string, flowId: string, blockType: string, position?: string) => void
  onCanvasSelectionChange?: (blockId: string, sectionId?: string) => void
}

interface SortableSectionProps {
  section: Section
  isSelected: boolean
  isMultiSelected: boolean
  sectionIndex: number
  totalSections: number
  selectedBlockId?: string
  focusedBlockId?: string
  onSelect: (event: React.MouseEvent) => void
  onSectionClick: (sectionId: string, event: React.MouseEvent) => void
  onFlowClick: (flowId: string, sectionId: string, event: React.MouseEvent) => void
  onAddFlow: (name: string) => void
  onJumpToHeading?: (blockId: string, blockType: string, sectionId?: string, event?: React.MouseEvent) => void
  onJumpToBlock?: (blockId: string, blockType: string, sectionId?: string, event?: React.MouseEvent) => void
  onDeleteSection?: () => void
  onRenameSection?: (newName: string) => void
  onDuplicateSection?: () => void
  onMoveSectionUp?: () => void
  onMoveSectionDown?: () => void
  onBlockDrop?: (flowId: string, blockType: string, position?: string) => void
  isDragOver?: boolean
  canAcceptDrop?: boolean
}

function SortableSection({ 
  section, 
  isSelected, 
  isMultiSelected,
  sectionIndex,
  totalSections,
  selectedBlockId,
  focusedBlockId,
  onSelect, 
  onSectionClick,
  onFlowClick,
  onAddFlow, 
  onJumpToHeading,
  onJumpToBlock,
  onDeleteSection,
  onRenameSection,
  onDuplicateSection,
  onMoveSectionUp,
  onMoveSectionDown,
  onBlockDrop,
  isDragOver = false,
  canAcceptDrop = false
}: SortableSectionProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [newFlowName, setNewFlowName] = useState('')
  const [showAddFlow, setShowAddFlow] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameName, setRenameName] = useState(section.name)
  const [showMenu, setShowMenu] = useState(false)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Get headings from all flows
  const headings = section.flows.flatMap(flow => 
    flow.blocks.filter(block => block.type === 'heading')
  )

  const handleAddFlow = () => {
    if (newFlowName.trim()) {
      onAddFlow(newFlowName.trim())
      setNewFlowName('')
      setShowAddFlow(false)
    }
  }

  const handleRename = () => {
    if (renameName.trim() && renameName !== section.name) {
      onRenameSection?.(renameName.trim())
    }
    setIsRenaming(false)
    setRenameName(section.name)
  }

  const canMoveUp = sectionIndex > 0
  const canMoveDown = sectionIndex < totalSections - 1
  const canDelete = totalSections > 1
  
  // Get the main flow (first flow) for drop hints
  const mainFlow = section.flows.find(flow => flow.name === 'Main') || section.flows[0]

  const handleSectionDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // For section drops, always redirect to main flow
    if (mainFlow && onBlockDrop) {
      onBlockDrop(mainFlow.id, 'paragraph', 'append')
    }
  }, [mainFlow, onBlockDrop])

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`mb-2 ${isDragOver && canAcceptDrop ? 'bg-primary/5 border-2 border-primary/30 border-dashed rounded-md' : ''}`}
      onDrop={handleSectionDrop}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <SectionContextMenu
        section={section}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        canDelete={canDelete}
        onRename={() => setIsRenaming(true)}
        onDuplicate={() => onDuplicateSection?.()}
        onMoveUp={() => onMoveSectionUp?.()}
        onMoveDown={() => onMoveSectionDown?.()}
        onDelete={() => onDeleteSection?.()}
      >
        <div 
          id={`section-${section.id}`}
          className={`group flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer ${
            isSelected ? 'bg-muted' : ''
          } ${isMultiSelected ? 'bg-primary/10 border border-primary/30' : ''} ${
            isDragOver && canAcceptDrop ? 'bg-primary/10' : ''
          }`}
          onClick={(e) => {
            // Handle different click behaviors
            if (e.detail === 2) {
              // Double-click: start rename
              setIsRenaming(true)
            } else {
              // Single click: select and potentially jump
              onSelect(e)
              if (!e.metaKey && !e.ctrlKey) {
                onSectionClick(section.id, e)
              }
            }
          }}
          onMouseEnter={() => setShowMenu(true)}
          onMouseLeave={() => setShowMenu(false)}
        >
          <div
            className="cursor-grab hover:text-primary"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-3 h-3" />
          </div>
          
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 hover:text-primary">
              {isOpen ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </CollapsibleTrigger>
          </Collapsible>
          
          <Layers className="w-4 h-4 text-primary" />
          
          {isRenaming ? (
            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename()
                } else if (e.key === 'Escape') {
                  setIsRenaming(false)
                  setRenameName(section.name)
                }
              }}
              onBlur={handleRename}
              className="h-6 text-sm flex-1"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
          <span className="font-medium text-sm flex-1">{section.name}</span>
          )}
          
          {/* Drop hint for section-level drops */}
          {isDragOver && canAcceptDrop && mainFlow && (
            <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
              <ArrowDown className="w-3 h-3 mr-1" />
              Insert into {mainFlow.name} flow
            </Badge>
          )}
          
          <span className="text-xs text-muted-foreground">{section.flows.length}</span>
          
          {(showMenu || isMultiSelected) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicateSection?.()}>
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onMoveSectionUp?.()} 
                  disabled={!canMoveUp}
                >
                  Move Up
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onMoveSectionDown?.()} 
                  disabled={!canMoveDown}
                >
                  Move Down
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDeleteSection?.()} 
                  disabled={!canDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete section...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </SectionContextMenu>

      <Collapsible open={isOpen}>
        <CollapsibleContent className="ml-6 mt-1 space-y-1">
          {/* Flows */}
          {section.flows.map(flow => (
            <div key={flow.id} className="space-y-1">
              <div className="flex items-center gap-2 p-1 text-sm text-muted-foreground">
                <FileText className="w-3 h-3" />
                <span>{flow.name}</span>
                <span className="text-xs">({flow.blocks.length})</span>
              </div>
              
              {/* Headings in this flow */}
              {flow.blocks
                .filter(block => block.type === 'heading')
                .map(heading => (
                  <div 
                    key={heading.id}
                    className="ml-4 flex items-center gap-2 p-1 text-xs hover:bg-muted/30 rounded cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      // Find the section this heading belongs to
                      const sectionId = section.id
                      onJumpToHeading?.(heading.id, 'heading', sectionId, e)
                    }}
                  >
                    <Hash className="w-3 h-3" />
                    <span className="truncate">
                      {typeof heading.content === 'string' 
                        ? heading.content 
                        : heading.content?.text || 'Heading'
                      }
                    </span>
                  </div>
                ))
              }
            </div>
          ))}
          
          {/* Add Flow Button */}
          <div className="mt-2">
            {!showAddFlow ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowAddFlow(true)
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Flow
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-xs">Add a new flow for different content types</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  placeholder="Flow name"
                  className="h-6 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddFlow()
                    } else if (e.key === 'Escape') {
                      setShowAddFlow(false)
                      setNewFlowName('')
                    }
                  }}
                  autoFocus
                />
                <Button
                  size="sm"
                  className="h-6 px-2"
                  onClick={handleAddFlow}
                  disabled={!newFlowName.trim()}
                >
                  Add
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export function Navigator({ 
  document,
  selectedSectionId,
  selectedSectionIds = [],
  selectedBlockId,
  focusedBlockId,
  onSectionSelect,
  onMultiSectionSelect,
  onAddSection,
  onAddFlow,
  onReorderSections,
  onJumpToHeading,
  onJumpToSection,
  onJumpToFlow,
  onJumpToBlock,
  onDeleteSections,
  onRenameSection,
  onDuplicateSection,
  onMoveSectionUp,
  onMoveSectionDown,
  onBlockDrop,
  onCanvasSelectionChange
}: NavigatorProps) {
  const [newSectionName, setNewSectionName] = useState('')
  const [showAddSection, setShowAddSection] = useState(false)
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1)
  
  // Drag and drop state
  const { dragState } = useDragDropContext()
  
  // Check if document is brand new (empty or very minimal content)
  const isNewDocument = document.sections.length === 0 || 
    (document.sections.length === 1 && 
     document.sections[0].flows.length <= 1 && 
     document.sections[0].flows[0]?.blocks.length === 0)
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = document.sections.findIndex(s => s.id === active.id)
      const newIndex = document.sections.findIndex(s => s.id === over.id)
      
      const reorderedSections = arrayMove(document.sections, oldIndex, newIndex)
      onReorderSections(reorderedSections)
    }
  }

  const handleAddSection = () => {
    if (newSectionName.trim()) {
      onAddSection(newSectionName.trim())
      setNewSectionName('')
      setShowAddSection(false)
    }
  }

  const handleSectionSelect = (sectionId: string, index: number, event: React.MouseEvent) => {
    if (event.shiftKey && onMultiSectionSelect && lastSelectedIndex >= 0) {
      // Shift+click for range selection
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)
      const rangeIds = document.sections.slice(start, end + 1).map(s => s.id)
      onMultiSectionSelect(rangeIds)
    } else if ((event.metaKey || event.ctrlKey) && onMultiSectionSelect) {
      // Cmd/Ctrl+click for multi-selection
      const newSelection = selectedSectionIds.includes(sectionId)
        ? selectedSectionIds.filter(id => id !== sectionId)
        : [...selectedSectionIds, sectionId]
      onMultiSectionSelect(newSelection)
    } else {
      // Regular click
      onSectionSelect(sectionId)
      onMultiSectionSelect?.([sectionId])
    }
    setLastSelectedIndex(index)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
        if (selectedSectionIds.length > 0) {
          onDeleteSections?.(selectedSectionIds)
        }
      }
    }

    globalThis.document.addEventListener('keydown', handleKeyDown)
    return () => globalThis.document.removeEventListener('keydown', handleKeyDown)
  }, [selectedSectionIds, onDeleteSections])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Navigator</h3>
          <Dialog open={showAddSection} onOpenChange={setShowAddSection}>
            <DialogTrigger asChild>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <Plus className="w-3 h-3 mr-1" />
                      Section
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs max-w-48">Add another section for a new chapter or major topic</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Section</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    placeholder="Section name (e.g., Introduction, Chapter 1)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSection()
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    onClick={handleAddSection}
                    disabled={!newSectionName.trim()}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sections help organize your document into chapters or major topics. Each section contains flows for different content types.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Helper text for new documents */}
        {isNewDocument && (
          <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Getting started:</p>
              <p>• Sections hold flows; flows hold blocks</p>
              <p>• Drop blocks onto section rows to insert into Main flow</p>
            </div>
          </div>
        )}
      </div>

      {/* Sections List */}
      <div className="flex-1 p-4 overflow-auto">
        {document.sections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No sections yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setShowAddSection(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add First Section
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={document.sections.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {document.sections.map((section, index) => {
                // Check if this section is being dragged over
                const isDragOver = dragState.isDragging && 
                  dragState.dragData?.type === 'block-type'
                
                const canAcceptDrop = isDragOver && !!dragState.dragData?.blockType
                
                return (
                  <SortableSection
                    key={section.id}
                    section={section}
                    isSelected={selectedSectionId === section.id}
                    isMultiSelected={selectedSectionIds.includes(section.id)}
                    selectedBlockId={selectedBlockId}
                    focusedBlockId={focusedBlockId}
                    sectionIndex={index}
                    totalSections={document.sections.length}
                    onSelect={(event) => handleSectionSelect(section.id, index, event)}
                    onSectionClick={(sectionId, event) => onJumpToSection?.(sectionId)}
                    onFlowClick={(flowId, sectionId, event) => onJumpToFlow?.(flowId, sectionId)}
                    onAddFlow={(name) => onAddFlow(section.id, name)}
                    onJumpToHeading={onJumpToHeading}
                    onJumpToBlock={onJumpToBlock}
                    onDeleteSection={() => onDeleteSections?.([section.id])}
                    onRenameSection={(newName) => onRenameSection?.(section.id, newName)}
                    onDuplicateSection={() => onDuplicateSection?.(section.id)}
                    onMoveSectionUp={() => onMoveSectionUp?.(section.id)}
                    onMoveSectionDown={() => onMoveSectionDown?.(section.id)}
                    onBlockDrop={(flowId, blockType, position) => 
                      onBlockDrop?.(section.id, flowId, blockType, position)
                    }
                    isDragOver={isDragOver}
                    canAcceptDrop={canAcceptDrop}
                  />
                )
              })}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}