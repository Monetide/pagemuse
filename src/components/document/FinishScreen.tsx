import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Share, 
  Download, 
  Palette, 
  Save, 
  CheckCircle, 
  ArrowRight,
  FileText,
  Users,
  Link2,
  Wand2
} from 'lucide-react'
import { SemanticDocument } from '@/lib/document-model'
import { ShareDialog } from './ShareDialog'
import { ExportModal } from './ExportModal'
import { TemplateChooser } from './TemplateChooser'
import { TemplateSaver } from './TemplateSaver'

interface FinishScreenProps {
  isOpen: boolean
  onClose: () => void
  document: SemanticDocument
  onTemplateApply?: (templateId: string) => void
  onTemplateSaved?: (templateId: string) => void
}

export const FinishScreen = ({
  isOpen,
  onClose,
  document,
  onTemplateApply,
  onTemplateSaved
}: FinishScreenProps) => {
  const [activeAction, setActiveAction] = useState<'share' | 'export' | 'template' | 'save' | null>(null)

  const actions = [
    {
      id: 'share',
      title: 'Share Document',
      description: 'Invite collaborators or create shareable links',
      icon: Share,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      features: ['Email invitations', 'Role-based permissions', 'Public links', 'View tracking']
    },
    {
      id: 'export',
      title: 'Export Files',
      description: 'Download in professional formats',
      icon: Download,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      features: ['Tagged PDF', 'Native DOCX', 'Google Docs', 'Embedded fonts']
    },
    {
      id: 'template',
      title: 'Try Another Template',
      description: 'Re-style with different design templates',
      icon: Palette,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      features: ['Keep content', 'Preserve Brand Kit', 'One-click undo', 'Live preview']
    },
    {
      id: 'save',
      title: 'Save as Template',
      description: 'Create reusable template from current design',
      icon: Save,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      features: ['Capture styles', 'Page masters', 'Snippets', 'Brand tokens']
    }
  ]

  const handleActionClick = (actionId: string) => {
    setActiveAction(actionId as any)
  }

  const handleActionClose = () => {
    setActiveAction(null)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">Document Ready!</DialogTitle>
                <DialogDescription>
                  Your makeover is complete. Choose what you'd like to do next.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Document Summary */}
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{document.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {document.sections.length} sections • Ready for sharing and export
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Complete
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {actions.map((action) => (
                <Card 
                  key={action.id}
                  className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] group"
                  onClick={() => handleActionClick(action.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <action.icon className={`w-6 h-6 ${action.color}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{action.title}</CardTitle>
                        <CardDescription className="text-sm">{action.description}</CardDescription>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {action.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            {/* Quick Actions */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                You can access these options anytime from the document menu.
              </div>
              <Button variant="outline" onClick={onClose}>
                Continue Editing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Modals */}
      {activeAction === 'share' && (
        <ShareDialog
          open={true}
          onOpenChange={(open) => !open && handleActionClose()}
          document={document}
        />
      )}

      {activeAction === 'export' && (
        <ExportModal
          isOpen={true}
          onClose={handleActionClose}
          document={document}
          onExportComplete={() => {
            handleActionClose()
            // Keep finish screen open to allow multiple exports
          }}
        />
      )}

      {activeAction === 'template' && (
        <TemplateChooser
          isOpen={true}
          onClose={handleActionClose}
          document={document}
          onTemplateApply={(templateId) => {
            onTemplateApply?.(templateId)
            handleActionClose()
            onClose() // Close finish screen after template application
          }}
        />
      )}

      {activeAction === 'save' && (
        <TemplateSaver
          isOpen={true}
          onClose={handleActionClose}
          document={document}
          onTemplateSaved={(templateId) => {
            onTemplateSaved?.(templateId)
            handleActionClose()
          }}
        />
      )}
    </>
  )
}
