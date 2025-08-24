import { IRDocument, IRSection, IRBlock, IRTable } from './ir-types'
import { Block, Section } from './document-model'

export interface ChartSuggestion {
  id: string
  sourceTableId: string
  chartType: 'bar-vertical' | 'bar-horizontal' | 'line' | 'area' | 'donut'
  title: string
  description: string
  dataMapping: ChartDataMapping
  confidence: number
  minLegibilityWarning?: string
}

export interface ChartDataMapping {
  xAxis: {
    columnIndex: number
    columnName: string
    dataType: 'text' | 'numeric' | 'date'
  }
  series: Array<{
    columnIndex: number
    columnName: string
    dataType: 'numeric'
    color?: string
  }>
  hasHeaders: boolean
  sampleData: any[][]
}

export interface NumericTableAnalysis {
  tableId: string
  totalColumns: number
  numericColumns: number
  textColumns: number
  dateColumns: number
  rowCount: number
  hasHeaders: boolean
  columnTypes: Array<{
    index: number
    name: string
    type: 'text' | 'numeric' | 'date'
    sampleValues: any[]
  }>
  confidence: number
}

// Detect if a value is numeric
const isNumeric = (value: any): boolean => {
  if (typeof value === 'number') return true
  if (typeof value !== 'string') return false
  
  const trimmed = value.trim()
  if (trimmed === '') return false
  
  // Handle percentages
  if (trimmed.endsWith('%')) {
    const numPart = trimmed.slice(0, -1)
    return !isNaN(parseFloat(numPart))
  }
  
  // Handle currency symbols
  const currencyPattern = /^[\$€£¥₹₽₩¢₵₦₨₪₫₱₡₲₴₸₻₹]?[\d,.-]+[\$€£¥₹₽₩¢₵₦₨₪₫₱₡₲₴₸₻₹]?$/
  if (currencyPattern.test(trimmed)) {
    const numPart = trimmed.replace(/[^\d.-]/g, '')
    return !isNaN(parseFloat(numPart))
  }
  
  // Handle thousands separators
  const cleanNum = trimmed.replace(/[,\s]/g, '')
  return !isNaN(parseFloat(cleanNum)) && isFinite(parseFloat(cleanNum))
}

// Detect if a value looks like a date
const isDate = (value: any): boolean => {
  if (typeof value !== 'string') return false
  
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}$/i, // Month DD, YYYY
    /^Q[1-4]\s+\d{4}$/i, // Q1 2023
  ]
  
  return datePatterns.some(pattern => pattern.test(value.trim()))
}

// Analyze column types in a table
const analyzeColumnTypes = (table: IRTable): NumericTableAnalysis['columnTypes'] => {
  const { headers, rows } = table
  const columnCount = headers?.length || (rows[0]?.length || 0)
  const columnTypes: NumericTableAnalysis['columnTypes'] = []
  
  for (let colIndex = 0; colIndex < columnCount; colIndex++) {
    const columnName = headers?.[colIndex] || `Column ${colIndex + 1}`
    const sampleValues: any[] = []
    let numericCount = 0
    let dateCount = 0
    let totalNonEmpty = 0
    
    // Sample up to 10 values for analysis
    const sampleSize = Math.min(10, rows.length)
    for (let rowIndex = 0; rowIndex < sampleSize; rowIndex++) {
      const cellValue = rows[rowIndex]?.[colIndex]
      if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
        sampleValues.push(cellValue)
        totalNonEmpty++
        
        if (isNumeric(cellValue)) {
          numericCount++
        } else if (isDate(cellValue)) {
          dateCount++
        }
      }
    }
    
    // Determine column type based on majority
    let type: 'text' | 'numeric' | 'date' = 'text'
    if (totalNonEmpty > 0) {
      const numericRatio = numericCount / totalNonEmpty
      const dateRatio = dateCount / totalNonEmpty
      
      if (numericRatio >= 0.7) {
        type = 'numeric'
      } else if (dateRatio >= 0.7) {
        type = 'date'
      }
    }
    
    columnTypes.push({
      index: colIndex,
      name: columnName,
      type,
      sampleValues: sampleValues.slice(0, 5) // Keep only first 5 samples
    })
  }
  
  return columnTypes
}

export const analyzeTable = (tableBlock: IRBlock): NumericTableAnalysis | null => {
  if (tableBlock.type !== 'table' || !tableBlock.content) {
    return null
  }
  
  const table = tableBlock.content as IRTable
  if (!table.rows || table.rows.length === 0) {
    return null
  }
  
  const columnTypes = analyzeColumnTypes(table)
  const numericColumns = columnTypes.filter(col => col.type === 'numeric').length
  const textColumns = columnTypes.filter(col => col.type === 'text').length
  const dateColumns = columnTypes.filter(col => col.type === 'date').length
  
  // Calculate confidence based on data quality
  let confidence = 0.5 // Base confidence
  
  // Higher confidence for more numeric columns
  if (numericColumns >= 2) confidence += 0.2
  if (numericColumns >= 3) confidence += 0.1
  
  // Higher confidence for having at least one text column for labels
  if (textColumns >= 1) confidence += 0.2
  
  // Higher confidence for more rows
  if (table.rows.length >= 3) confidence += 0.1
  if (table.rows.length >= 10) confidence += 0.1
  
  return {
    tableId: tableBlock.id,
    totalColumns: columnTypes.length,
    numericColumns,
    textColumns,
    dateColumns,
    rowCount: table.rows.length,
    hasHeaders: Boolean(table.headers && table.headers.length > 0),
    columnTypes,
    confidence: Math.min(1, confidence)
  }
}

export const generateChartSuggestions = (analysis: NumericTableAnalysis): ChartSuggestion[] => {
  if (analysis.numericColumns < 2) {
    return [] // Need at least 2 numeric columns
  }
  
  const suggestions: ChartSuggestion[] = []
  
  // Find the first text/date column for X-axis
  const xAxisColumn = analysis.columnTypes.find(col => 
    col.type === 'text' || col.type === 'date'
  ) || analysis.columnTypes[0] // Fallback to first column
  
  // Get numeric columns for series
  const seriesColumns = analysis.columnTypes
    .filter(col => col.type === 'numeric')
    .slice(0, 6) // Limit to 6 series for readability
  
  const baseMapping: ChartDataMapping = {
    xAxis: {
      columnIndex: xAxisColumn.index,
      columnName: xAxisColumn.name,
      dataType: xAxisColumn.type as 'text' | 'numeric' | 'date'
    },
    series: seriesColumns.map((col, index) => ({
      columnIndex: col.index,
      columnName: col.name,
      dataType: 'numeric' as const,
      color: `hsl(${(index * 60) % 360}, 70%, 50%)` // Generate colors
    })),
    hasHeaders: analysis.hasHeaders,
    sampleData: [] // Will be populated when chart is created
  }
  
  // Check for legibility warnings
  const minLegibilityWarning = analysis.rowCount > 20 
    ? 'Large dataset may result in crowded labels. Consider filtering or grouping data.'
    : undefined
  
  // Bar Chart (Vertical)
  suggestions.push({
    id: `${analysis.tableId}-bar-v`,
    sourceTableId: analysis.tableId,
    chartType: 'bar-vertical',
    title: 'Vertical Bar Chart',
    description: `Compare ${seriesColumns.length} metrics across ${xAxisColumn.name.toLowerCase()}`,
    dataMapping: baseMapping,
    confidence: analysis.confidence * 0.9,
    minLegibilityWarning
  })
  
  // Bar Chart (Horizontal)
  if (analysis.rowCount <= 15) { // Horizontal bars work better with fewer items
    suggestions.push({
      id: `${analysis.tableId}-bar-h`,
      sourceTableId: analysis.tableId,
      chartType: 'bar-horizontal',
      title: 'Horizontal Bar Chart',
      description: `Compare metrics with long ${xAxisColumn.name.toLowerCase()} labels`,
      dataMapping: baseMapping,
      confidence: analysis.confidence * 0.8,
      minLegibilityWarning
    })
  }
  
  // Line Chart (good for time series or ordered data)
  if (xAxisColumn.type === 'date' || analysis.rowCount >= 3) {
    suggestions.push({
      id: `${analysis.tableId}-line`,
      sourceTableId: analysis.tableId,
      chartType: 'line',
      title: 'Line Chart',
      description: `Show trends over ${xAxisColumn.name.toLowerCase()}`,
      dataMapping: baseMapping,
      confidence: xAxisColumn.type === 'date' ? analysis.confidence : analysis.confidence * 0.7,
      minLegibilityWarning
    })
  }
  
  // Area Chart (similar to line but filled)
  if (xAxisColumn.type === 'date' || analysis.rowCount >= 3) {
    suggestions.push({
      id: `${analysis.tableId}-area`,
      sourceTableId: analysis.tableId,
      chartType: 'area',
      title: 'Area Chart',
      description: `Show cumulative trends over ${xAxisColumn.name.toLowerCase()}`,
      dataMapping: baseMapping,
      confidence: analysis.confidence * 0.6,
      minLegibilityWarning
    })
  }
  
  // Donut Chart (good for single series with category breakdown)
  if (seriesColumns.length === 1 && analysis.rowCount <= 12) {
    const donutMapping: ChartDataMapping = {
      ...baseMapping,
      series: seriesColumns.slice(0, 1).map((col, index) => ({
        columnIndex: col.index,
        columnName: col.name,
        dataType: 'numeric' as const,
        color: `hsl(${(index * 60) % 360}, 70%, 50%)`
      }))
    }
    
    suggestions.push({
      id: `${analysis.tableId}-donut`,
      sourceTableId: analysis.tableId,
      chartType: 'donut',
      title: 'Donut Chart',
      description: `Show ${seriesColumns[0].name} distribution by ${xAxisColumn.name.toLowerCase()}`,
      dataMapping: donutMapping,
      confidence: analysis.confidence * 0.8,
      minLegibilityWarning
    })
  }
  
  // Sort by confidence (highest first)
  return suggestions.sort((a, b) => b.confidence - a.confidence)
}

export const detectChartSuggestions = (document: IRDocument): Map<string, ChartSuggestion[]> => {
  const suggestionsByTable = new Map<string, ChartSuggestion[]>()
  
  for (const section of document.sections) {
    for (const block of section.blocks) {
      if (block.type === 'table') {
        const analysis = analyzeTable(block)
        if (analysis && analysis.numericColumns >= 2) {
          const suggestions = generateChartSuggestions(analysis)
          if (suggestions.length > 0) {
            suggestionsByTable.set(block.id, suggestions)
          }
        }
      }
    }
  }
  
  return suggestionsByTable
}

// For document model blocks (semantic document)
export const detectChartSuggestionsFromDocument = (sections: Section[]): Map<string, ChartSuggestion[]> => {
  const suggestionsByTable = new Map<string, ChartSuggestion[]>()
  
  for (const section of sections) {
    for (const flow of section.flows) {
      for (const block of flow.blocks) {
        if (block.type === 'table') {
          // Convert semantic block to IR-style for analysis
          const irBlock: IRBlock = {
            id: block.id,
            type: 'table',
            content: block.content,
            order: block.order
          }
          
          const analysis = analyzeTable(irBlock)
          if (analysis && analysis.numericColumns >= 2) {
            const suggestions = generateChartSuggestions(analysis)
            if (suggestions.length > 0) {
              suggestionsByTable.set(block.id, suggestions)
            }
          }
        }
      }
    }
  }
  
  return suggestionsByTable
}

export const createChartFromSuggestion = (
  suggestion: ChartSuggestion, 
  sourceTable: IRTable | any,
  caption: string = '',
  altText: string = ''
): IRBlock => {
  // Extract and transform table data according to mapping
  const chartData = transformTableDataForChart(sourceTable, suggestion.dataMapping)
  
  return {
    id: crypto.randomUUID(),
    type: 'chart',
    content: {
      type: suggestion.chartType,
      title: suggestion.title,
      data: chartData,
      xAxisLabel: suggestion.dataMapping.xAxis.columnName,
      yAxisLabel: suggestion.dataMapping.series.length === 1 
        ? suggestion.dataMapping.series[0].columnName 
        : 'Value',
      caption: caption || `Chart showing ${suggestion.description.toLowerCase()}`,
      altText: altText || `${suggestion.chartType.replace('-', ' ')} chart displaying ${suggestion.dataMapping.series.map(s => s.columnName).join(', ')} by ${suggestion.dataMapping.xAxis.columnName}`,
      series: suggestion.dataMapping.series,
      colors: suggestion.dataMapping.series.map(s => s.color || '#0066cc'),
      accessibility: {
        description: altText,
        dataTable: sourceTable // Keep reference to source data for screen readers
      }
    },
    order: 1,
    attrs: {
      sourceTableId: suggestion.sourceTableId,
      autoGenerated: true,
      chartType: suggestion.chartType
    }
  }
}

const transformTableDataForChart = (table: IRTable | any, mapping: ChartDataMapping): any => {
  const { xAxis, series, hasHeaders } = mapping
  const rows = table.rows || []
  const startRow = hasHeaders ? 0 : 0 // Start from first data row
  
  const chartData: any[] = []
  
  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i]
    const dataPoint: any = {
      x: row[xAxis.columnIndex] || `Row ${i + 1}`,
    }
    
    // Add each series value
    series.forEach((seriesCol, index) => {
      const value = row[seriesCol.columnIndex]
      dataPoint[`y${index}`] = parseFloat(String(value)) || 0
      dataPoint[seriesCol.columnName] = parseFloat(String(value)) || 0
    })
    
    chartData.push(dataPoint)
  }
  
  return {
    categories: chartData.map(d => d.x),
    series: series.map((seriesCol, index) => ({
      name: seriesCol.columnName,
      data: chartData.map(d => d[`y${index}`]),
      color: seriesCol.color
    }))
  }
}