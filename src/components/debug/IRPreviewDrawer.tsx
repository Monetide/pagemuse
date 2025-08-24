import React, { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Copy, FileText, Image, Hash, Eye } from 'lucide-react'
import { IRDocument } from '@/lib/ir-types'

interface IRPreviewDrawerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  irDocument: IRDocument | null
  sourceInfo?: {
    type: string
    filename?: string
    size: number
    imageCount?: number
  }
}

export const IRPreviewDrawer: React.FC<IRPreviewDrawerProps> = ({
  isOpen,
  onOpenChange,
  irDocument,
  sourceInfo
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const { toast } = useToast()

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      toast({
        title: "Copied to clipboard",
        description: `${fieldName} copied successfully`
      })
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      })
    }
  }

  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2)
  }

  const getBlockTypeCounts = () => {
    if (!irDocument) return {}
    
    return irDocument.sections
      .flatMap(section => section.blocks)
      .reduce((acc, block) => {
        acc[block.type] = (acc[block.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
  }

  const totalBlocks = irDocument?.sections.reduce((sum, section) => sum + section.blocks.length, 0) || 0

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:w-[800px]" side="right">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            IR Preview (Debug)
          </SheetTitle>
          <SheetDescription>
            Inspect the parsed Intermediate Representation and source information
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Source Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Source Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Type</div>
                  <Badge variant="outline">{sourceInfo?.type || 'Unknown'}</Badge>
                </div>
                
                {sourceInfo?.filename && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Filename</div>
                    <div className="text-sm text-muted-foreground font-mono truncate">
                      {sourceInfo.filename}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-bold">{sourceInfo?.size.toLocaleString() || 0}</div>
                  <div className="text-xs text-muted-foreground">Characters</div>
                </div>
                
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-bold">{totalBlocks}</div>
                  <div className="text-xs text-muted-foreground">Blocks</div>
                </div>
                
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-bold">{sourceInfo?.imageCount || 0}</div>
                  <div className="text-xs text-muted-foreground">Images</div>
                </div>
              </div>

              {/* Block Type Breakdown */}
              {irDocument && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Block Types</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(getBlockTypeCounts()).map(([type, count]) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* IR Document Structure */}
          {irDocument && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  IR Document Structure
                </CardTitle>
                <CardDescription>
                  Parsed intermediate representation in JSON format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
                    <div className="font-bold text-blue-600 dark:text-blue-400">
                      {irDocument.sections.length}
                    </div>
                    <div className="text-xs text-blue-600/70 dark:text-blue-400/70">Sections</div>
                  </div>
                  
                  <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded">
                    <div className="font-bold text-green-600 dark:text-green-400">
                      {totalBlocks}
                    </div>
                    <div className="text-xs text-green-600/70 dark:text-green-400/70">Total Blocks</div>
                  </div>
                  
                  <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded">
                    <div className="font-bold text-purple-600 dark:text-purple-400">
                      {irDocument.assets?.length || 0}
                    </div>
                    <div className="text-xs text-purple-600/70 dark:text-purple-400/70">Assets</div>
                  </div>
                </div>

                <Separator />

                {/* Copy Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(formatJSON(irDocument), 'Full IR Document')}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copiedField === 'Full IR Document' ? 'Copied!' : 'Copy Full IR'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(formatJSON(irDocument.sections), 'Sections Only')}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copiedField === 'Sections Only' ? 'Copied!' : 'Copy Sections'}
                  </Button>
                </div>

                {/* JSON Display */}
                <div className="relative">
                  <ScrollArea className="h-[400px] w-full border rounded-md">
                    <pre className="p-4 text-xs font-mono leading-relaxed">
                      <code className="text-muted-foreground">
                        {formatJSON(irDocument)}
                      </code>
                    </pre>
                  </ScrollArea>
                  
                  {/* Floating Copy Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                    onClick={() => copyToClipboard(formatJSON(irDocument), 'IR JSON')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                {/* Individual Section Details */}
                <div className="space-y-3">
                  <div className="text-sm font-medium">Section Details</div>
                  {irDocument.sections.map((section, index) => (
                    <Card key={section.id || index} className="border-muted">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">
                            {section.title || `Section ${index + 1}`}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {section.blocks.length} blocks
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1">
                          {section.blocks.slice(0, 5).map((block, blockIndex) => (
                            <Badge key={blockIndex} variant="secondary" className="text-xs">
                              {block.type}
                            </Badge>
                          ))}
                          {section.blocks.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{section.blocks.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!irDocument && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No IR document available</p>
                <p className="text-sm">Parse some content to see the intermediate representation</p>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}