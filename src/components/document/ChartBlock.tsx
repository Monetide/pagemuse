import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BarChart, 
  LineChart, 
  AreaChart, 
  PieChart,
  Upload, 
  Plus,
  AlertTriangle,
  GripVertical
} from 'lucide-react'
import { 
  BarChart as RechartsBarChart, 
  LineChart as RechartsLineChart,
  AreaChart as RechartsAreaChart,
  PieChart as RechartsPieChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Bar,
  Line,
  Area,
  Pie,
  Cell
} from 'recharts'

interface ChartData {
  chartType?: 'bar' | 'horizontal-bar' | 'line' | 'area' | 'pie' | 'donut'
  title?: string
  caption?: string
  data?: Array<Record<string, any>>
  xField?: string
  yFields?: string[]
  size?: 'column-width' | 'full-width'
  showGrid?: boolean
  showLegend?: boolean
  showDataLabels?: boolean
  altText?: string
}

interface ChartBlockProps {
  data: ChartData
  isSelected?: boolean
  isEditing?: boolean
  showInvisibles?: boolean
  onDataChange?: (data: ChartData) => void
  onEditToggle?: () => void
  onClick?: () => void
  className?: string
}

const SAMPLE_DATA = [
  { month: 'Jan', sales: 4000, profit: 2400 },
  { month: 'Feb', sales: 3000, profit: 1398 },
  { month: 'Mar', sales: 2000, profit: 9800 },
  { month: 'Apr', sales: 2780, profit: 3908 },
  { month: 'May', sales: 1890, profit: 4800 },
  { month: 'Jun', sales: 2390, profit: 3800 }
]

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#8884d8', '#82ca9d', '#ffc658', '#ff7300']

export const ChartBlock = ({
  data,
  isSelected = false,
  isEditing = false,
  showInvisibles = false,
  onDataChange,
  onEditToggle,
  onClick,
  className = ''
}: ChartBlockProps) => {
  const [showDataEditor, setShowDataEditor] = useState(false)
  const [csvInput, setCsvInput] = useState('')
  const [showLegibilityWarning, setShowLegibilityWarning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateData = useCallback((updates: Partial<ChartData>) => {
    const newData = { ...data, ...updates }
    onDataChange?.(newData)
  }, [data, onDataChange])

  // Initialize with sample data if empty
  const chartData = data.data && data.data.length > 0 ? data.data : SAMPLE_DATA
  const hasRealData = data.data && data.data.length > 0

  // CSV parsing
  const parseCSV = (csv: string) => {
    const lines = csv.trim().split('\n')
    if (lines.length < 2) return []
    
    const headers = lines[0].split(',').map(h => h.trim())
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      const row: Record<string, any> = {}
      headers.forEach((header, index) => {
        const value = values[index]
        // Try to parse as number, fallback to string
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
        updateData({
          data: parsedData,
          xField: fields[0], // Auto-select first field as X
          yFields: fields.slice(1).filter(f => typeof parsedData[0][f] === 'number').slice(0, 3) // Auto-select numeric fields as Y
        })
        setCsvInput('')
        setShowDataEditor(false)
      }
    } catch (error) {
      console.error('CSV parsing error:', error)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setCsvInput(text)
    }
    reader.readAsText(file)
  }

  // Check legibility based on container width
  const checkLegibility = () => {
    const isFullWidth = data.size === 'full-width'
    const hasLongLabels = chartData.some(item => 
      Object.keys(item).some(key => String(item[key]).length > 10)
    )
    
    setShowLegibilityWarning(!isFullWidth && hasLongLabels && chartData.length > 6)
  }

  // Effect to check legibility when data or size changes
  useState(() => {
    checkLegibility()
  })

  const renderChart = () => {
    if (!data.chartType && !hasRealData) {
      return renderPlaceholder()
    }

    const chartType = data.chartType || 'bar'
    const xField = data.xField || Object.keys(chartData[0] || {})[0]
    const yFields = data.yFields || Object.keys(chartData[0] || {}).filter(k => k !== xField).slice(0, 2)
    
    const containerHeight = data.size === 'full-width' ? 400 : 300
    const showLegend = data.showLegend !== false && yFields.length > 1
    
    return (
      <div className="relative">
        {/* Drag Handle */}
        <div className="absolute -left-6 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
        </div>

        <ResponsiveContainer width="100%" height={containerHeight}>
          {(() => {
            if (chartType === 'bar') {
              return (
                <RechartsBarChart data={chartData}>
                  {data.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
                  <XAxis dataKey={xField} />
                  <YAxis />
                  <Tooltip />
                  {showLegend && <Legend />}
                  {yFields.map((field, index) => (
                    <Bar key={field} dataKey={field} fill={COLORS[index % COLORS.length]} />
                  ))}
                </RechartsBarChart>
              )
            }
            
            if (chartType === 'horizontal-bar') {
              return (
                <RechartsBarChart data={chartData} layout="horizontal">
                  {data.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
                  <XAxis type="number" />
                  <YAxis dataKey={xField} type="category" />
                  <Tooltip />
                  {showLegend && <Legend />}
                  {yFields.map((field, index) => (
                    <Bar key={field} dataKey={field} fill={COLORS[index % COLORS.length]} />
                  ))}
                </RechartsBarChart>
              )
            }
            
            if (chartType === 'line') {
              return (
                <RechartsLineChart data={chartData}>
                  {data.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
                  <XAxis dataKey={xField} />
                  <YAxis />
                  <Tooltip />
                  {showLegend && <Legend />}
                  {yFields.map((field, index) => (
                    <Line key={field} dataKey={field} stroke={COLORS[index % COLORS.length]} strokeWidth={2} />
                  ))}
                </RechartsLineChart>
              )
            }
            
            if (chartType === 'area') {
              return (
                <RechartsAreaChart data={chartData}>
                  {data.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
                  <XAxis dataKey={xField} />
                  <YAxis />
                  <Tooltip />
                  {showLegend && <Legend />}
                  {yFields.map((field, index) => (
                    <Area key={field} dataKey={field} fill={COLORS[index % COLORS.length]} />
                  ))}
                </RechartsAreaChart>
              )
            }
            
            if (chartType === 'pie' || chartType === 'donut') {
              return (
                <RechartsPieChart>
                  <Pie
                    data={chartData.map(item => ({
                      name: item[xField],
                      value: item[yFields[0]] || 0
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={chartType === 'donut' ? 60 : 0}
                    outerRadius={100}
                    fill="#8884d8"
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  {showLegend && <Legend />}
                </RechartsPieChart>
              )
            }
            
            return null
          })()}
        </ResponsiveContainer>

        {/* Legibility Warning */}
        {showLegibilityWarning && (
          <Alert className="mt-2 border-warning bg-warning/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Increase width or reduce labels for better readability
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  const renderPlaceholder = () => (
    <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center bg-muted/10">
      <div className="flex flex-col items-center gap-4">
        <BarChart className="w-16 h-16 text-muted-foreground/50" />
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Add chart data</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateData({ data: SAMPLE_DATA, chartType: 'bar', xField: 'month', yFields: ['sales', 'profit'] })}
            >
              <Plus className="w-4 h-4 mr-2" />
              Use Sample Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDataEditor(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </Button>
          </div>
        </div>
      </div>
      
      {showDataEditor && (
        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload CSV
            </Button>
            <span className="text-xs text-muted-foreground self-center">or paste below</span>
          </div>
          <Textarea
            placeholder="Paste CSV data here..."
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            className="text-xs font-mono min-h-[100px]"
          />
          <div className="flex gap-2 justify-center">
            <Button size="sm" onClick={handleCSVSubmit}>Import Data</Button>
            <Button size="sm" variant="outline" onClick={() => setShowDataEditor(false)}>Cancel</Button>
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  )

  const renderCaption = () => {
    if (!data.caption && !isEditing) return null

    return (
      <figcaption className="mt-3 text-sm text-muted-foreground text-center">
        {isEditing ? (
          <Textarea
            placeholder="Enter caption..."
            value={data.caption || ''}
            onChange={(e) => updateData({ caption: e.target.value })}
            className="text-center resize-none min-h-[60px]"
          />
        ) : (
          <span className="italic">{data.caption}</span>
        )}
        {showInvisibles && (
          <span className="text-purple-400/60 font-mono text-xs ml-1">¶</span>
        )}
      </figcaption>
    )
  }

  const renderPropertiesPanel = () => {
    if (!isEditing) return null

    const needsAltText = !data.altText?.trim()
    const availableFields = chartData && chartData.length > 0 ? Object.keys(chartData[0]) : []

    return (
      <Card className="mt-4 p-4 space-y-4 bg-muted/30">
        <div className="flex items-center gap-2">
          <Label className="font-semibold">Chart Properties</Label>
          {needsAltText && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Alt text required
            </Badge>
          )}
        </div>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="chartTitle" className="text-sm">Title</Label>
            <Input
              id="chartTitle"
              placeholder="Chart title..."
              value={data.title || ''}
              onChange={(e) => updateData({ title: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="altText" className="text-sm">Alt Text *</Label>
            <Input
              id="altText"
              placeholder="Describe the chart for accessibility..."
              value={data.altText || ''}
              onChange={(e) => updateData({ altText: e.target.value })}
              className={needsAltText ? 'border-destructive' : ''}
            />
            {needsAltText && (
              <p className="text-xs text-destructive mt-1">Alt text helps screen readers understand the chart</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="chartType" className="text-sm">Chart Type</Label>
              <Select 
                value={data.chartType || 'bar'} 
                onValueChange={(value: ChartData['chartType']) => updateData({ chartType: value })}
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
              <Label htmlFor="size" className="text-sm">Size</Label>
              <Select 
                value={data.size || 'column-width'} 
                onValueChange={(value: 'column-width' | 'full-width') => {
                  updateData({ size: value })
                  setTimeout(checkLegibility, 100)
                }}
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

          {availableFields.length > 0 && (
            <>
              <div>
                <Label htmlFor="xField" className="text-sm">X-Axis Field</Label>
                <Select 
                  value={data.xField || availableFields[0]} 
                  onValueChange={(value) => updateData({ xField: value })}
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
                <Label className="text-sm">Data Series</Label>
                <div className="space-y-2">
                  {availableFields.filter(f => f !== data.xField).map(field => (
                    <label key={field} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={(data.yFields || []).includes(field)}
                        onChange={(e) => {
                          const currentYFields = data.yFields || []
                          const newYFields = e.target.checked
                            ? [...currentYFields, field]
                            : currentYFields.filter(f => f !== field)
                          updateData({ yFields: newYFields })
                        }}
                        className="rounded border-border"
                      />
                      <span className="text-sm">{field}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={data.showGrid !== false}
                onChange={(e) => updateData({ showGrid: e.target.checked })}
                className="rounded border-border"
              />
              <span className="text-sm">Show Grid</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={data.showLegend !== false}
                onChange={(e) => updateData({ showLegend: e.target.checked })}
                className="rounded border-border"
              />
              <span className="text-sm">Show Legend</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={data.showDataLabels === true}
                onChange={(e) => updateData({ showDataLabels: e.target.checked })}
                className="rounded border-border"
              />
              <span className="text-sm">Show Data Labels</span>
            </label>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <figure 
      className={`
        relative mb-6 cursor-pointer transition-all group
        ${isSelected ? 'ring-2 ring-primary' : ''}
        ${data.size === 'full-width' ? 'mx-auto' : ''}
        ${className}
      `}
      onClick={onClick}
      role="img"
      aria-label={data.altText || 'Chart'}
      tabIndex={0}
    >
      {data.title && (
        <h3 className="text-base font-semibold mb-2 text-center">{data.title}</h3>
      )}
      {renderChart()}
      {renderCaption()}
      {renderPropertiesPanel()}
    </figure>
  )
}