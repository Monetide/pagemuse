import { useState } from 'react'
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
} from 'lucide-react'

interface NavigatorProps {
  document: SemanticDocument
  selectedSectionId?: string
  onSectionSelect: (sectionId: string) => void
  onAddSection: (name: string) => void
  onAddFlow: (sectionId: string, name: string) => void
  onReorderSections: (sections: Section[]) => void
  onJumpToHeading?: (blockId: string) => void
}

interface SortableSectionProps {
  section: Section
  isSelected: boolean
  onSelect: () => void
  onAddFlow: (name: string) => void
  onJumpToHeading?: (blockId: string) => void
}

function SortableSection({ section, isSelected, onSelect, onAddFlow, onJumpToHeading }: SortableSectionProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [newFlowName, setNewFlowName] = useState('')
  const [showAddFlow, setShowAddFlow] = useState(false)
  
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

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <div 
        className={`group flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer ${
          isSelected ? 'bg-muted' : ''
        }`}
        onClick={onSelect}
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
        <span className="font-medium text-sm flex-1">{section.name}</span>
        <span className="text-xs text-muted-foreground">{section.flows.length}</span>
      </div>

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
                    onClick={() => onJumpToHeading?.(heading.id)}
                  >
                    <Hash className="w-3 h-3" />
                    <span className="truncate">
                      {typeof heading.content === 'string' 
                        ? heading.content 
                        : 'Heading'
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
  onSectionSelect, 
  onAddSection,
  onAddFlow,
  onReorderSections,
  onJumpToHeading
}: NavigatorProps) {
  const [newSectionName, setNewSectionName] = useState('')
  const [showAddSection, setShowAddSection] = useState(false)
  
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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Navigator</h3>
          <Dialog open={showAddSection} onOpenChange={setShowAddSection}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2">
                <Plus className="w-3 h-3 mr-1" />
                Section
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Section</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2">
                <Input
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="Section name"
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
            </DialogContent>
          </Dialog>
        </div>
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
              {document.sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  isSelected={selectedSectionId === section.id}
                  onSelect={() => onSectionSelect(section.id)}
                  onAddFlow={(name) => onAddFlow(section.id, name)}
                  onJumpToHeading={onJumpToHeading}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}