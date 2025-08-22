import { useViewMode } from '@/contexts/ViewModeContext'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Monitor, FileText } from 'lucide-react'

export const ViewModeToggle = () => {
  const { viewMode, setViewMode } = useViewMode()

  return (
    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'print' | 'screen')}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="print" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Print
        </TabsTrigger>
        <TabsTrigger value="screen" className="flex items-center gap-2">
          <Monitor className="w-4 h-4" />
          Screen
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}