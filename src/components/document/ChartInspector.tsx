import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Block } from '@/lib/document-model'
import { 
  Upload, 
  Trash2,
  Copy,
  AlertTriangle,
  BarChart,
  Plus,
  FileText
} from 'lucide-react'

interface ChartInspectorProps {
  block: Block
  onUpdate: (updates: Partial<Block>) => void
  onDelete: () => void
  onDuplicate: () => void
}

export const ChartInspector = ({ 
  block, 
  onUpdate, 
  onDelete, 
  onDuplicate 
}: ChartInspectorProps) => {
  const [csvInput, setCsvInput] = useState('')
  const [showDataEditor, setShowDataEditor] = useState(false)
  
  const chartData = block.content || {}
  
  const updateContent = (updates: any) => {
    onUpdate({
      ...block,
      content: { ...chartData, ...updates }
    })
  }

  const parseCSV = (csv: string) => {
    const lines = csv.trim().split('\n')
    if (lines.length < 2) return []
    
    const headers = lines[0].split(',').map(h => h.trim())
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      const row: Record<string, any> = {}
      headers.forEach((header, index) => {
        const value = values[index]
        row[header] = isNaN(Number(value)) ? value : Number(value)
      })
      return row
    })
    
    return rows
  }

  const handleCSVSubmit = () => {
    if (!csvInput.trim()) return
    
    try {
      const parsedData = parseCSV(csvInput)
      if (parsedData.length > 0) {
        const fields = Object.keys(parsedData[0])
        updateContent({
          data: parsedData,
          xField: fields[0],
          yFields: fields.slice(1).filter(f => typeof parsedData[0][f] === 'number').slice(0, 3)
        })
        setCsvInput('')
        setShowDataEditor(false)
      }
    } catch (error) {
      console.error('CSV parsing error:', error)
    }
  }

  const needsAltText = !chartData.altText?.trim()
  const availableFields = chartData.data && chartData.data.length > 0 ? Object.keys(chartData.data[0]) : []

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="w-4 h-4" />
            Chart Properties
            {needsAltText && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Missing Alt Text
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chart Data */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Chart Data</Label>
            {chartData.data && chartData.data.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                  <strong>Rows:</strong> {chartData.data.length} • <strong>Fields:</strong> {availableFields.join(', ')}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDataEditor(true)}
                >
                  <FileText className="w-3 h-3 mr-2" />
                  Edit Data
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDataEditor(true)}
                  className="w-full"
                >
                  <Plus className="w-3 h-3 mr-2" />
                  Add Chart Data
                </Button>
                <p className="text-xs text-muted-foreground">
                  Upload CSV file or paste data to create chart
                </p>
              </div>
            )}

            {showDataEditor && (
              <div className="space-y-2 p-3 border rounded">
                <Textarea
                  placeholder="Paste CSV data here (header row required)..."
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  className="text-xs font-mono min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCSVSubmit}>
                    Import Data
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowDataEditor(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Chart Configuration */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Chart Configuration</Label>
            
            <div>
              <Label htmlFor="chartTitle" className="text-xs">Title</Label>
              <Input
                id="chartTitle"
                placeholder="Chart title..."
                value={chartData.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="chartType" className="text-xs">Type</Label>
                <Select 
                  value={chartData.chartType || 'bar'} 
                  onValueChange={(value) => updateContent({ chartType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="horizontal-bar">Horizontal Bar</SelectItem>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="area">Area Chart</SelectItem>
                    <SelectItem value="pie">Pie Chart</SelectItem>
                    <SelectItem value="donut">Donut Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="size" className="text-xs">Size</Label>
                <Select 
                  value={chartData.size || 'column-width'} 
                  onValueChange={(value) => updateContent({ size: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="column-width">Column Width</SelectItem>
                    <SelectItem value="full-width">Full Width</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Field Mapping */}
            {availableFields.length > 0 && (
              <>
                <div>
                  <Label htmlFor="xField" className="text-xs">X-Axis Field</Label>
                  <Select 
                    value={chartData.xField || availableFields[0]} 
                    onValueChange={(value) => updateContent({ xField: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Data Series</Label>
                  <div className="space-y-1">
                    {availableFields.filter(f => f !== chartData.xField).map(field => (
                      <label key={field} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={(chartData.yFields || []).includes(field)}
                          onChange={(e) => {
                            const currentYFields = chartData.yFields || []
                            const newYFields = e.target.checked
                              ? [...currentYFields, field]
                              : currentYFields.filter(f => f !== field)
                            updateContent({ yFields: newYFields })
                          }}
                          className="rounded border-border"
                        />
                        <span className="text-xs">{field}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Chart Options */}
            <div>
              <Label className="text-xs">Options</Label>
              <div className="space-y-1">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={chartData.showGrid !== false}
                    onChange={(e) => updateContent({ showGrid: e.target.checked })}
                    className="rounded border-border"
                  />
                  <span className="text-xs">Show Grid</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={chartData.showLegend !== false}
                    onChange={(e) => updateContent({ showLegend: e.target.checked })}
                    className="rounded border-border"
                  />
                  <span className="text-xs">Show Legend</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={chartData.showDataLabels === true}
                    onChange={(e) => updateContent({ showDataLabels: e.target.checked })}
                    className="rounded border-border"
                  />
                  <span className="text-xs">Show Data Labels</span>
                </label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Alt Text */}
          <div className="space-y-2">
            <Label htmlFor="altText" className="text-sm font-medium">
              Alt Text *
            </Label>
            <Input
              id="altText"
              placeholder="Describe the chart for accessibility..."
              value={chartData.altText || ''}
              onChange={(e) => updateContent({ altText: e.target.value })}
              className={needsAltText ? 'border-destructive' : ''}
            />
            {needsAltText && (
              <p className="text-xs text-destructive">
                Alt text is required for accessibility
              </p>
            )}
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption" className="text-sm font-medium">
              Caption
            </Label>
            <Textarea
              id="caption"
              placeholder="Optional chart caption..."
              value={chartData.caption || ''}
              onChange={(e) => updateContent({ caption: e.target.value })}
              className="min-h-[60px] resize-none"
            />
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDuplicate}
              className="flex-1"
            >
              <Copy className="w-3 h-3 mr-2" />
              Duplicate
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="flex-1"
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}