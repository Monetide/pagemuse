import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  AlertTriangle,
  Sparkles,
  Plus,
  X
} from 'lucide-react'
import { ChartSuggestion } from '@/lib/chart-suggestion-detector'
import { Block } from '@/lib/document-model'

interface ChartSuggestionPanelProps {
  suggestions: ChartSuggestion[]
  sourceTable: Block
  onInsertChart: (suggestion: ChartSuggestion, caption: string, altText: string) => void
  onDismiss: () => void
  className?: string
}

const chartTypeIcons = {
  'bar-vertical': BarChart3,
  'bar-horizontal': BarChart3,
  'line': LineChart,
  'area': TrendingUp,
  'donut': PieChart
}

const chartTypeLabels = {
  'bar-vertical': 'Bar Chart',
  'bar-horizontal': 'Horizontal Bar',
  'line': 'Line Chart', 
  'area': 'Area Chart',
  'donut': 'Donut Chart'
}

export const ChartSuggestionPanel = ({
  suggestions,
  sourceTable,
  onInsertChart,
  onDismiss,
  className = ''
}: ChartSuggestionPanelProps) => {
  const [selectedSuggestion, setSelectedSuggestion] = useState<ChartSuggestion | null>(null)
  const [caption, setCaption] = useState('')
  const [altText, setAltText] = useState('')
  const [isInserting, setIsInserting] = useState(false)

  if (suggestions.length === 0) return null

  const handleSuggestionSelect = (suggestion: ChartSuggestion) => {
    setSelectedSuggestion(suggestion)
    setCaption(`${suggestion.title}: ${suggestion.description}`)
    setAltText(`${chartTypeLabels[suggestion.chartType]} displaying ${suggestion.dataMapping.series.map(s => s.columnName).join(', ')} by ${suggestion.dataMapping.xAxis.columnName}`)
  }

  const handleInsert = async () => {
    if (!selectedSuggestion) return
    
    setIsInserting(true)
    try {
      await onInsertChart(selectedSuggestion, caption, altText)
      setSelectedSuggestion(null)
      setCaption('')
      setAltText('')
    } catch (error) {
      console.error('Failed to insert chart:', error)
    } finally {
      setIsInserting(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500'
    if (confidence >= 0.6) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.6) return 'Medium'
    return 'Low'
  }

  return (
    <Card className={`border-blue-200 bg-blue-50/50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-sm font-medium text-blue-900">
              Chart Suggestions
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        <CardDescription className="text-xs text-blue-700">
          We detected numeric data that could be visualized as charts
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {!selectedSuggestion ? (
          <>
            {/* Suggestion Options */}
            <div className="grid grid-cols-1 gap-2">
              {suggestions.slice(0, 4).map((suggestion) => {
                const Icon = chartTypeIcons[suggestion.chartType]
                return (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-blue-200 hover:border-blue-300 hover:bg-blue-100/50 transition-colors text-left w-full"
                  >
                    <div className="flex-shrink-0">
                      <Icon className="w-4 h-4 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-blue-900">
                          {suggestion.title}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs px-1.5 py-0.5 ${getConfidenceColor(suggestion.confidence)} text-white`}
                        >
                          {getConfidenceLabel(suggestion.confidence)}
                        </Badge>
                      </div>
                      <p className="text-xs text-blue-700 truncate">
                        {suggestion.description}
                      </p>
                      {suggestion.minLegibilityWarning && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3 text-yellow-600" />
                          <span className="text-xs text-yellow-700">Legibility concern</span>
                        </div>
                      )}
                    </div>
                    
                    <Plus className="w-3 h-3 text-blue-600 flex-shrink-0" />
                  </button>
                )
              })}
            </div>

            {/* Data Mapping Preview */}
            <div className="p-3 rounded-lg bg-blue-100/50 border border-blue-200">
              <h4 className="text-xs font-medium text-blue-900 mb-2">Auto-detected mapping:</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <div>
                  <strong>X-axis:</strong> {suggestions[0]?.dataMapping.xAxis.columnName}
                </div>
                <div>
                  <strong>Series:</strong> {suggestions[0]?.dataMapping.series.map(s => s.columnName).join(', ')}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Chart Configuration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-blue-200">
                {React.createElement(chartTypeIcons[selectedSuggestion.chartType], {
                  className: "w-4 h-4 text-blue-600"
                })}
                <span className="text-sm font-medium text-blue-900">
                  {selectedSuggestion.title}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSuggestion(null)}
                  className="ml-auto h-6 text-xs text-blue-600"
                >
                  Change
                </Button>
              </div>

              {/* Warning if exists */}
              {selectedSuggestion.minLegibilityWarning && (
                <div className="flex items-start gap-2 p-2 rounded bg-yellow-50 border border-yellow-200">
                  <AlertTriangle className="w-3 h-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-800">
                    {selectedSuggestion.minLegibilityWarning}
                  </p>
                </div>
              )}

              {/* Data Mapping */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-blue-900">Data Mapping</Label>
                <div className="p-2 rounded bg-blue-50 text-xs text-blue-700">
                  <div><strong>X-axis:</strong> {selectedSuggestion.dataMapping.xAxis.columnName}</div>
                  <div><strong>Series:</strong> {selectedSuggestion.dataMapping.series.map(s => s.columnName).join(', ')}</div>
                </div>
              </div>

              {/* Caption */}
              <div className="space-y-1">
                <Label htmlFor="caption" className="text-xs font-medium text-blue-900">
                  Caption <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Describe what the chart shows..."
                  className="text-xs h-7"
                />
              </div>

              {/* Alt Text */}
              <div className="space-y-1">
                <Label htmlFor="altText" className="text-xs font-medium text-blue-900">
                  Alt Text <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="altText"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe the chart for screen readers..."
                  className="text-xs min-h-[60px] resize-none"
                />
                <p className="text-xs text-blue-600">
                  Describe the chart type, data, and key insights for accessibility
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleInsert}
                  disabled={!caption.trim() || !altText.trim() || isInserting}
                  size="sm"
                  className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700"
                >
                  {isInserting ? 'Inserting...' : 'Insert Chart'}
                </Button>
                <Button
                  variant="outline"
                  onClick={onDismiss}
                  size="sm" 
                  className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  Skip
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ChartSuggestionPanel