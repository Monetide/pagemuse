import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bug, 
  Eye, 
  Code, 
  X, 
  MinusSquare, 
  PlusSquare 
} from 'lucide-react'
import { IRPreviewDrawer } from './IRPreviewDrawer'
import { IRDocument } from '@/lib/ir-types'

interface DebugConsoleProps {
  // Optional IR document to preview
  currentIR?: IRDocument | null
  // Additional debug info
  debugInfo?: {
    lastOperation?: string
    processingTime?: number
    sourceType?: string
    errors?: string[]
  }
}

export const DebugConsole: React.FC<DebugConsoleProps> = ({
  currentIR,
  debugInfo
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showIRPreview, setShowIRPreview] = useState(false)

  // Only show debug console in development or when explicitly enabled
  const shouldShow = process.env.NODE_ENV === 'development' || 
                    localStorage.getItem('lovable-debug-enabled') === 'true'

  if (!shouldShow) return null

  const toggleExpanded = () => setIsExpanded(!isExpanded)

  const hasErrors = debugInfo?.errors && debugInfo.errors.length > 0

  return (
    <>
      {/* Debug Console */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className={`bg-background border rounded-lg shadow-lg transition-all duration-200 ${
          isExpanded ? 'w-80' : 'w-auto'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Debug</span>
              {hasErrors && (
                <Badge variant="destructive" className="text-xs px-1 py-0">
                  {debugInfo!.errors!.length}
                </Badge>
              )}
              {currentIR && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  IR Ready
                </Badge>
              )}
            </div>
            
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={toggleExpanded}
              >
                {isExpanded ? <MinusSquare className="h-3 w-3" /> : <PlusSquare className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="p-3 space-y-3">
              {/* Quick Info */}
              {debugInfo && (
                <div className="space-y-2">
                  {debugInfo.lastOperation && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Last:</span>{' '}
                      <span className="font-mono">{debugInfo.lastOperation}</span>
                    </div>
                  )}
                  
                  {debugInfo.processingTime && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Time:</span>{' '}
                      <span className="font-mono">{debugInfo.processingTime}ms</span>
                    </div>
                  )}
                  
                  {debugInfo.sourceType && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Type:</span>{' '}
                      <Badge variant="outline" className="text-xs h-4">
                        {debugInfo.sourceType}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Errors */}
              {hasErrors && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-destructive">Errors:</div>
                  {debugInfo!.errors!.map((error, index) => (
                    <div key={index} className="text-xs text-destructive font-mono bg-destructive/10 p-1 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {currentIR && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowIRPreview(true)}
                    className="flex-1 h-7 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View IR
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('Debug Info:', { currentIR, debugInfo })
                  }}
                  className="flex-1 h-7 text-xs"
                >
                  <Code className="h-3 w-3 mr-1" />
                  Log
                </Button>
              </div>

              {/* Toggle Debug Mode */}
              <div className="pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const isEnabled = localStorage.getItem('lovable-debug-enabled') === 'true'
                    localStorage.setItem('lovable-debug-enabled', (!isEnabled).toString())
                    window.location.reload()
                  }}
                  className="w-full h-6 text-xs text-muted-foreground"
                >
                  {localStorage.getItem('lovable-debug-enabled') === 'true' ? 'Disable' : 'Enable'} Debug Mode
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* IR Preview Drawer */}
      <IRPreviewDrawer
        isOpen={showIRPreview}
        onOpenChange={setShowIRPreview}
        irDocument={currentIR}
        sourceInfo={debugInfo ? {
          type: debugInfo.sourceType || 'unknown',
          size: 0,
          imageCount: 0
        } : undefined}
      />
    </>
  )
}

// Hook to enable debug mode easily
export const useDebugMode = () => {
  const [debugEnabled, setDebugEnabled] = useState(
    () => localStorage.getItem('lovable-debug-enabled') === 'true'
  )

  const toggleDebug = () => {
    const newValue = !debugEnabled
    setDebugEnabled(newValue)
    localStorage.setItem('lovable-debug-enabled', newValue.toString())
    if (newValue) {
      console.log('🐛 Debug mode enabled')
    }
  }

  const enableDebug = () => {
    setDebugEnabled(true)
    localStorage.setItem('lovable-debug-enabled', 'true')
    console.log('🐛 Debug mode enabled')
  }

  const disableDebug = () => {
    setDebugEnabled(false)
    localStorage.setItem('lovable-debug-enabled', 'false')
  }

  return {
    debugEnabled,
    toggleDebug,
    enableDebug,
    disableDebug
  }
}