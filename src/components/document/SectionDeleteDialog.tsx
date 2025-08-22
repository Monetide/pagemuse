import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Section } from '@/lib/document-model'
import { AlertTriangle, FileText, Image, Table2, Hash, Link } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface SectionDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sections: Section[]
  selectedSectionIds: string[]
  onDeleteSections: (
    sectionIds: string[], 
    contentAction: 'delete' | 'move',
    targetSectionId?: string,
    removeCrossRefs?: boolean
  ) => void
}

interface ContentSummary {
  blocks: number
  figures: number
  tables: number
  footnotes: number
  crossRefs: number
  hasTOC: boolean
}

export function SectionDeleteDialog({
  open,
  onOpenChange,
  sections,
  selectedSectionIds,
  onDeleteSections
}: SectionDeleteDialogProps) {
  const [contentAction, setContentAction] = useState<'delete' | 'move'>('delete')
  const [targetSectionId, setTargetSectionId] = useState<string>('')
  const [removeCrossRefs, setRemoveCrossRefs] = useState(true)
  const [moveTOC, setMoveTOC] = useState(true)

  const selectedSections = sections.filter(section => selectedSectionIds.includes(section.id))
  const isMultiSelect = selectedSectionIds.length > 1
  
  // Calculate content summary
  const contentSummary: ContentSummary = selectedSections.reduce((summary, section) => {
    const allBlocks = section.flows.flatMap(flow => flow.blocks)
    
    return {
      blocks: summary.blocks + allBlocks.length,
      figures: summary.figures + allBlocks.filter(block => block.type === 'figure').length,
      tables: summary.tables + allBlocks.filter(block => block.type === 'table').length,
      footnotes: summary.footnotes + allBlocks.filter(block => block.type === 'footnote').length,
      crossRefs: summary.crossRefs + allBlocks.filter(block => block.type === 'cross-reference').length,
      hasTOC: summary.hasTOC || allBlocks.some(block => block.type === 'table-of-contents')
    }
  }, { blocks: 0, figures: 0, tables: 0, footnotes: 0, crossRefs: 0, hasTOC: false })

  // Get available target sections (not being deleted)
  const availableTargetSections = sections.filter(section => 
    !selectedSectionIds.includes(section.id)
  )

  // Find adjacent sections for move options
  const firstSelectedIndex = sections.findIndex(s => s.id === selectedSectionIds[0])
  const previousSection = firstSelectedIndex > 0 ? sections[firstSelectedIndex - 1] : null
  const nextSection = firstSelectedIndex < sections.length - 1 ? sections[firstSelectedIndex + 1] : null

  const handleDelete = () => {
    if (contentAction === 'move' && !targetSectionId) {
      toast({
        title: "Target section required",
        description: "Please select where to move the content.",
        variant: "destructive"
      })
      return
    }

    onDeleteSections(
      selectedSectionIds,
      contentAction,
      contentAction === 'move' ? targetSectionId : undefined,
      removeCrossRefs
    )
    
    onOpenChange(false)
  }

  const getSectionTitle = () => {
    if (isMultiSelect) {
      return `Delete ${selectedSectionIds.length} sections?`
    }
    return `Delete section '${selectedSections[0]?.name}'?`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            {getSectionTitle()}
          </DialogTitle>
          <DialogDescription>
            This action will move the section{isMultiSelect ? 's' : ''} to trash where {isMultiSelect ? 'they' : 'it'} can be restored within 30 days.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Content Summary */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Content summary:</h4>
            <div className="flex flex-wrap gap-2">
              {contentSummary.blocks > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  {contentSummary.blocks} blocks
                </Badge>
              )}
              {contentSummary.figures > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Image className="w-3 h-3 mr-1" />
                  {contentSummary.figures} figures
                </Badge>
              )}
              {contentSummary.tables > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Table2 className="w-3 h-3 mr-1" />
                  {contentSummary.tables} tables
                </Badge>
              )}
              {contentSummary.footnotes > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Hash className="w-3 h-3 mr-1" />
                  {contentSummary.footnotes} footnotes
                </Badge>
              )}
              {contentSummary.crossRefs > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Link className="w-3 h-3 mr-1" />
                  {contentSummary.crossRefs} cross-refs target this
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Content Action Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">What to do with contents?</h4>
            
            <RadioGroup 
              value={contentAction} 
              onValueChange={(value: 'delete' | 'move') => setContentAction(value)}
              disabled={isMultiSelect}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delete" id="delete" />
                <Label htmlFor="delete" className="text-sm">
                  Delete contents {isMultiSelect && '(default for multi-select)'}
                </Label>
              </div>
              
              {!isMultiSelect && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="move" id="move" />
                  <Label htmlFor="move" className="text-sm">Move contents to...</Label>
                </div>
              )}
            </RadioGroup>

            {/* Target Section Selection */}
            {contentAction === 'move' && !isMultiSelect && (
              <div className="ml-6 space-y-2">
                <RadioGroup value={targetSectionId} onValueChange={setTargetSectionId}>
                  {previousSection && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={previousSection.id} id="previous" />
                      <Label htmlFor="previous" className="text-sm">
                        Previous section: "{previousSection.name}"
                      </Label>
                    </div>
                  )}
                  {nextSection && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={nextSection.id} id="next" />
                      <Label htmlFor="next" className="text-sm">
                        Next section: "{nextSection.name}"
                      </Label>
                    </div>
                  )}
                </RadioGroup>
              </div>
            )}
          </div>

          <Separator />

          {/* Cross-references Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remove-crossrefs"
              checked={removeCrossRefs}
              onCheckedChange={(checked) => setRemoveCrossRefs(checked as boolean)}
            />
            <Label htmlFor="remove-crossrefs" className="text-sm">
              Also remove cross-references pointing here (they become plain text)
            </Label>
          </div>

          {/* TOC Option */}
          {contentSummary.hasTOC && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="move-toc"
                checked={moveTOC}
                onCheckedChange={(checked) => setMoveTOC(checked as boolean)}
              />
              <Label htmlFor="move-toc" className="text-sm">
                Move TOC to the beginning of the document
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete {isMultiSelect ? 'Sections' : 'Section'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}