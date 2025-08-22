import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Save, 
  X, 
  Check, 
  Clock,
  AlertCircle,
  Copy,
  FolderOpen,
  Edit3,
  MoreHorizontal,
  Share,
  Download,
  Settings,
  Command,
  Bug,
  History
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Toggle } from '@/components/ui/toggle'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { SaveStatus, DocumentMetadata } from '@/hooks/useDocumentPersistence'

interface DocumentHeaderProps {
  title: string
  saveStatus: SaveStatus
  documentMetadata: DocumentMetadata | null
  onTitleChange: (newTitle: string) => void
  onSaveAs: (newTitle: string) => void
  onClose: () => void
  debugMode?: boolean
  onDebugToggle?: (enabled: boolean) => void
  onToggleVersionHistory?: () => void
}

export function DocumentHeader({
  title,
  saveStatus,
  documentMetadata,
  onTitleChange,
  onSaveAs,
  onClose,
  debugMode = false,
  onDebugToggle,
  onToggleVersionHistory
}: DocumentHeaderProps) {
  const navigate = useNavigate()
  const { id } = useParams()
  const [isEditing, setIsEditing] = useState(false)
  const [editingTitle, setEditingTitle] = useState(title)
  const [saveAsTitle, setSaveAsTitle] = useState('')
  const [saveAsOpen, setSaveAsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditingTitle(title)
  }, [title])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleTitleSubmit = () => {
    const trimmedTitle = editingTitle.trim()
    if (trimmedTitle && trimmedTitle !== title) {
      onTitleChange(trimmedTitle)
    } else {
      setEditingTitle(title)
    }
    setIsEditing(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTitleSubmit()
    } else if (e.key === 'Escape') {
      setEditingTitle(title)
      setIsEditing(false)
    }
  }

  const handleSaveAs = () => {
    const trimmedTitle = saveAsTitle.trim()
    if (trimmedTitle) {
      onSaveAs(trimmedTitle)
      setSaveAsTitle('')
      setSaveAsOpen(false)
    }
  }

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Clock className="w-3 h-3 animate-spin" />
      case 'saved':
        return <Check className="w-3 h-3 text-green-600" />
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-600" />
      default:
        return null
    }
  }

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...'
      case 'saved':
        return 'Saved'
      case 'error':
        return 'Save failed'
      default:
        return ''
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="sticky top-0 z-10 bg-background border-b border-border">
      <div className="flex items-center justify-between p-4">
        {/* Title Section */}
        <div className="flex-1 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="shrink-0"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Library
          </Button>

          <div className="flex items-center gap-2 flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Input
                  ref={inputRef}
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={handleTitleKeyDown}
                  className="font-semibold"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleTitleSubmit}
                  disabled={!editingTitle.trim()}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingTitle(title)
                    setIsEditing(false)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <h1 className="text-xl font-semibold text-foreground truncate max-w-md">
                  {title || 'Untitled Document'}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="shrink-0"
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Status and Actions */}
        <div className="flex items-center gap-3">
          {/* Save Status */}
          {saveStatus !== 'idle' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {getSaveStatusIcon()}
              <span className="text-xs">{getSaveStatusText()}</span>
            </Badge>
          )}

          {/* Document Metadata */}
          {documentMetadata && (
            <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
              <span>Modified {formatDate(documentMetadata.updated_at)}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Toggle
              pressed={debugMode}
              onPressedChange={onDebugToggle}
              variant="outline"
              size="sm"
              title={debugMode ? "Disable Debug Mode" : "Enable Debug Mode"}
            >
              <Bug className="w-4 h-4" />
            </Toggle>
            
            {/* Version History Toggle */}
            {onToggleVersionHistory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleVersionHistory}
                title="Version History"
              >
                <History className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {/* TODO: Implement command palette */}}
              title="Command Palette"
            >
              <Command className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {/* TODO: Implement share */}}
              title="Share"
            >
              <Share className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {/* TODO: Implement export */}}
              title="Export"
            >
              <Download className="w-4 h-4" />
            </Button>
            
            {id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/documents/${id}/settings`)}
                title="Document Settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* More Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Dialog open={saveAsOpen} onOpenChange={setSaveAsOpen}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Copy className="w-4 h-4 mr-2" />
                    Save As...
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Document Copy</DialogTitle>
                    <DialogDescription>
                      Create a copy of this document with a new name.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="save-as-title">Document Title</Label>
                      <Input
                        id="save-as-title"
                        value={saveAsTitle}
                        onChange={(e) => setSaveAsTitle(e.target.value)}
                        placeholder={`Copy of ${title}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleSaveAs()
                          }
                        }}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setSaveAsOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveAs}
                      disabled={!saveAsTitle.trim()}
                    >
                      Save Copy
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <DropdownMenuSeparator />
              
              {documentMetadata && (
                <>
                  <DropdownMenuItem disabled>
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="font-medium">Document Info</span>
                      <span>Owner: {documentMetadata.owner}</span>
                      <span>Created: {formatDate(documentMetadata.created_at)}</span>
                      <span>Modified: {formatDate(documentMetadata.updated_at)}</span>
                    </div>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}