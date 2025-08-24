import React from 'react'
import { Section, Block } from '@/lib/document-model'
import { useChartSuggestions } from '@/hooks/useChartSuggestions'
import { ChartSuggestionPanel } from './ChartSuggestionPanel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, RefreshCw, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'

interface ChartSuggestionsManagerProps {
  sections: Section[]
  onInsertChart: (chartBlock: Block, afterBlockId: string) => void
  className?: string
}

export const ChartSuggestionsManager = ({
  sections,
  onInsertChart,
  className = ''
}: ChartSuggestionsManagerProps) => {
  const {
    suggestionsByTable,
    getSuggestionsForTable,
    dismissSuggestions,
    refreshSuggestions,
    createChart,
    getStats,
    hasSuggestions,
    getTablesWithSuggestions,
    isAnalyzing
  } = useChartSuggestions(sections)

  const stats = getStats()
  const tablesWithSuggestions = getTablesWithSuggestions()

  const handleInsertChart = async (
    tableId: string,
    suggestion: any,
    caption: string,
    altText: string
  ) => {
    try {
      // Find the source table block
      let sourceTable: Block | null = null
      
      for (const section of sections) {
        for (const flow of section.flows) {
          for (const block of flow.blocks) {
            if (block.id === tableId && block.type === 'table') {
              sourceTable = block
              break
            }
          }
          if (sourceTable) break
        }
        if (sourceTable) break
      }

      if (!sourceTable) {
        throw new Error('Source table not found')
      }

      const chartBlock = createChart(suggestion, sourceTable, caption, altText)
      onInsertChart(chartBlock, tableId)
      
      toast.success(`${suggestion.title} inserted successfully`)
    } catch (error) {
      console.error('Failed to insert chart:', error)
      toast.error('Failed to insert chart. Please try again.')
    }
  }

  if (stats.totalTables === 0 && !isAnalyzing) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Card */}
      {(stats.totalTables > 0 || isAnalyzing) && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-sm font-medium text-blue-900">
                  Chart Suggestions Available
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshSuggestions}
                disabled={isAnalyzing}
                className="h-6 text-blue-600 hover:text-blue-800"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isAnalyzing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex items-center gap-4 text-xs text-blue-700">
              <div className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                <span>{stats.totalTables} tables detected</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800">
                  {stats.highConfidenceSuggestions}
                </Badge>
                <span>high confidence</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{stats.totalSuggestions} suggestions</span>
              </div>
              {isAnalyzing && (
                <div className="flex items-center gap-1 text-blue-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                  <span>Analyzing...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Table Suggestions */}
      {tablesWithSuggestions.map((tableId) => {
        const suggestions = getSuggestionsForTable(tableId)
        
        // Find the table block for context
        let tableBlock: Block | null = null
        for (const section of sections) {
          for (const flow of section.flows) {
            for (const block of flow.blocks) {
              if (block.id === tableId) {
                tableBlock = block
                break
              }
            }
            if (tableBlock) break
          }
          if (tableBlock) break
        }

        if (!tableBlock || suggestions.length === 0) return null

        return (
          <div key={tableId} className="space-y-2">
            <div className="text-xs text-muted-foreground pl-2">
              Suggestions for table: {tableBlock.metadata?.title || 'Untitled Table'}
            </div>
            
            <ChartSuggestionPanel
              suggestions={suggestions}
              sourceTable={tableBlock}
              onInsertChart={(suggestion, caption, altText) => 
                handleInsertChart(tableId, suggestion, caption, altText)
              }
              onDismiss={() => dismissSuggestions(tableId)}
            />
          </div>
        )
      })}
    </div>
  )
}

export default ChartSuggestionsManager