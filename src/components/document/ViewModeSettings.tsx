import { useViewMode } from '@/contexts/ViewModeContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Monitor, FileText, Settings } from 'lucide-react'

export const ViewModeSettings = () => {
  const { preferences, updatePreferences } = useViewMode()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          View Mode Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default view mode */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Default view when opening documents</Label>
          <Select
            value={preferences.defaultMode}
            onValueChange={(value: 'print' | 'screen') => 
              updatePreferences({ defaultMode: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="print">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Print Mode
                </div>
              </SelectItem>
              <SelectItem value="screen">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Screen Mode
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Screen mode settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Screen Mode Settings</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Sticky mini TOC</Label>
              <p className="text-xs text-muted-foreground">
                Show floating table of contents on wide screens
              </p>
            </div>
            <Switch
              checked={preferences.stickyTOC}
              onCheckedChange={(checked) => 
                updatePreferences({ stickyTOC: checked })
              }
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm">Footnote style</Label>
            <Select
              value={preferences.screenFootnoteStyle}
              onValueChange={(value: 'popover' | 'endnotes') => 
                updatePreferences({ screenFootnoteStyle: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popover">Popover on click</SelectItem>
                <SelectItem value="endnotes">Endnotes at section end</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Keyboard shortcuts info */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Keyboard Shortcuts</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Switch to Print mode:</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Alt + 1</kbd>
            </div>
            <div className="flex justify-between">
              <span>Switch to Screen mode:</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Alt + 2</kbd>
            </div>
            <div className="flex justify-between">
              <span>Toggle view mode:</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Shift + V</kbd>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}