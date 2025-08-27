import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkspaceAdminGuard } from '@/components/auth/WorkspaceAdminGuard'
import { TemplateGalleryScoped } from '@/components/template/TemplateGalleryScoped'
import { useTemplateApprovalRequests } from '@/hooks/useTemplateApprovalRequests'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { ScopedTemplate } from '@/hooks/useTemplatesScoped'
import { Building2, Settings, Plus, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function WorkspaceTemplateGenerator() {
  const { currentWorkspace } = useWorkspaceContext()
  const { requests, approveRequest, rejectRequest } = useTemplateApprovalRequests()
  const [selectedTemplate, setSelectedTemplate] = useState<ScopedTemplate | null>(null)

  const pendingRequests = requests.filter(r => r.status === 'pending')

  const handleEditTemplate = (template: ScopedTemplate) => {
    console.log('Edit template:', template.name)
    // TODO: Navigate to template editor
  }

  const handlePromoteTemplate = (template: ScopedTemplate) => {
    console.log('Promote template:', template.name)
    // TODO: Implement promotion logic
  }

  const handleUseTemplate = (template: ScopedTemplate) => {
    console.log('Use template:', template.name)
    // TODO: Implement template usage
  }

  const handleApproveRequest = async (requestId: string) => {
    try {
      await approveRequest(requestId, 'Approved by workspace admin')
    } catch (error) {
      console.error('Error approving request:', error)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectRequest(requestId, 'Request denied by workspace admin')
    } catch (error) {
      console.error('Error rejecting request:', error)
    }
  }

  return (
    <WorkspaceAdminGuard>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Template Generator</h1>
                <Badge variant="secondary" className="mt-1">
                  <Building2 className="w-3 h-3 mr-1" />
                  {currentWorkspace?.name}
                </Badge>
              </div>
            </div>
            <p className="text-muted-foreground">
              Create and manage templates for your workspace
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button className="bg-gradient-primary hover:shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>

        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList>
            <TabsTrigger value="templates">My Templates</TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              Approval Requests
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            {/* Workspace Brand Kit Notice */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-900">Workspace Brand Kit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-800">
                  Templates created here will use your workspace's brand kit for previews and defaults.
                  Members can request template approval through the "Save as Template" feature.
                </p>
              </CardContent>
            </Card>

            {/* Template Gallery */}
            <TemplateGalleryScoped
              onUseTemplate={handleUseTemplate}
              onEditTemplate={handleEditTemplate}
              onPromoteTemplate={handlePromoteTemplate}
            />
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Template Approval Requests
                </CardTitle>
                <CardDescription>
                  Review and approve template requests from workspace members
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No pending template approval requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <Card key={request.id} className="border-l-4 border-l-orange-400">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{request.proposed_name}</CardTitle>
                            <Badge variant="outline">
                              {request.proposed_category || 'General'}
                            </Badge>
                          </div>
                          <CardDescription>
                            Requested by member • {new Date(request.created_at).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="text-sm text-muted-foreground">
                            <p>This member has packaged their document as a template and is requesting approval to make it available to the workspace.</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleApproveRequest(request.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRejectRequest(request.id)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </WorkspaceAdminGuard>
  )
}