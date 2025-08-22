import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { VersionTimeline } from './VersionTimeline'
import { VersionDiffViewer } from './VersionDiffViewer'
import { SnapshotCreator } from './SnapshotCreator'
import { useDocumentVersions, DocumentVersion } from '@/hooks/useDocumentVersions'
import { SemanticDocument } from '@/lib/document-model'
import { History, Camera, RotateCcw, X } from 'lucide-react'

interface VersionHistoryPanelProps {
  documentId: string
  currentDocument: SemanticDocument
  onRevertToVersion: (version: DocumentVersion) => void
  onClose?: () => void
  className?: string
}

export const VersionHistoryPanel = ({ 
  documentId, 
  currentDocument, 
  onRevertToVersion,
  onClose,
  className 
}: VersionHistoryPanelProps) => {
  const { 
    versions, 
    loading, 
    createSnapshot, 
    createSafetySnapshot, 
    deleteVersion, 
    getVersion 
  } = useDocumentVersions(documentId)
  
  const [selectedVersions, setSelectedVersions] = useState<[string, string] | null>(null)
  const [revertingVersion, setRevertingVersion] = useState<DocumentVersion | null>(null)
  const [activeTab, setActiveTab] = useState('timeline')

  const handleCreateSnapshot = async (name: string, description?: string) => {
    await createSnapshot(documentId, currentDocument, name)
  }

  const handleViewVersion = (versionId: string) => {
    // For now, just show in comparison with current
    const version = getVersion(versionId)
    if (version) {
      // Create a temporary current version for comparison
      const currentVersion: DocumentVersion = {
        id: 'current',
        document_id: documentId,
        version_number: 999999, // High number to show as latest
        title: currentDocument.title,
        content: currentDocument,
        version_type: 'manual',
        created_by: '',
        created_at: new Date().toISOString()
      }
      
      setSelectedVersions([versionId, 'current'])
      setActiveTab('comparison')
    }
  }

  const handleCompareVersions = (version1Id: string, version2Id: string) => {
    setSelectedVersions([version1Id, version2Id])
    setActiveTab('comparison')
  }

  const handleRevertRequest = (versionId: string) => {
    const version = getVersion(versionId)
    if (version) {
      setRevertingVersion(version)
    }
  }

  const handleConfirmRevert = async () => {
    if (!revertingVersion) return

    // Create safety snapshot before reverting
    await createSafetySnapshot(documentId, currentDocument)
    
    // Revert to the selected version
    onRevertToVersion(revertingVersion)
    
    setRevertingVersion(null)
  }

  const handleCancelRevert = () => {
    setRevertingVersion(null)
  }

  const version1 = selectedVersions ? getVersion(selectedVersions[0]) : null
  const version2 = selectedVersions ? getVersion(selectedVersions[1]) : null
  
  // Handle comparison with current document
  const comparisonVersion2 = version2 || (selectedVersions?.[1] === 'current' ? {
    id: 'current',
    document_id: documentId,
    version_number: 999999,
    title: currentDocument.title,
    content: currentDocument,
    version_type: 'manual' as const,
    created_by: '',
    created_at: new Date().toISOString()
  } : null)

  return (
    <>
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
          <div className="flex items-center gap-2">
            <SnapshotCreator 
              onCreateSnapshot={handleCreateSnapshot}
              disabled={loading}
            />
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="px-4 pb-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="comparison" disabled={!selectedVersions}>
                  Comparison
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="timeline" className="mt-0 h-full">
              <VersionTimeline
                versions={versions}
                onViewVersion={handleViewVersion}
                onRevertToVersion={handleRevertRequest}
                onDeleteVersion={deleteVersion}
                onCompareVersions={handleCompareVersions}
              />
            </TabsContent>
            
            <TabsContent value="comparison" className="mt-0 h-full">
              {version1 && comparisonVersion2 ? (
                <div className="h-full">
                  <div className="px-4 pb-2 flex items-center justify-between">
                    <h4 className="text-sm font-medium">Version Comparison</h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setSelectedVersions(null)
                        setActiveTab('timeline')
                      }}
                    >
                      Back to Timeline
                    </Button>
                  </div>
                  <VersionDiffViewer 
                    version1={version1} 
                    version2={comparisonVersion2}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Select two versions to compare</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Revert confirmation dialog */}
      <AlertDialog open={!!revertingVersion} onOpenChange={(open) => !open && setRevertingVersion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Revert to Version
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revert to version {revertingVersion?.version_number}? 
              This will replace your current document content with the selected version.
              
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="font-medium text-sm">Safety measure:</p>
                <p className="text-sm text-muted-foreground">
                  A safety snapshot of your current document will be created automatically 
                  before reverting, so you can restore it later if needed.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelRevert}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRevert}>
              Revert Document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}