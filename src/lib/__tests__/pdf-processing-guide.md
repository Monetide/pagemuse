# PDF Processing Implementation Guide

## Overview

The PDF ingestion system provides comprehensive text-first extraction with layout analysis, structural inference, and OCR fallback for image-only content.

## Features

### Text Extraction
- **PDF.js Integration**: Uses PDF.js for reliable text extraction from PDF documents
- **Layout Preservation**: Maintains spatial relationships between text elements
- **Font Analysis**: Extracts font information for typography-based structure inference

### Layout Analysis
- **Column Detection**: Automatically identifies multi-column layouts by analyzing consistent X-ranges
- **Reading Order**: Sorts content in proper reading order (column-aware, top-to-bottom, left-to-right)
- **Hyphenation Handling**: Merges words split across line breaks with hyphens

### Structure Inference
- **Heading Detection**: Uses font size and weight heuristics to identify headings
- **Table Recognition**: Detects grid patterns and regular spacing to identify tables
- **Figure Extraction**: Identifies image boxes and nearby "Figure N:" captions
- **Block Grouping**: Groups related elements into logical document blocks

### OCR Fallback
- **Tesseract.js Integration**: Provides OCR for image-only pages
- **Confidence Scoring**: Flags low-confidence text for manual review
- **Language Support**: Configurable OCR language for better accuracy

## Processing Options

```typescript
interface PDFProcessingOptions {
  // OCR Configuration
  ocrLanguage?: string           // Default: 'eng'
  confidenceThreshold?: number   // Default: 75
  enableOCR?: boolean           // Default: true
  
  // Layout Analysis
  detectColumns?: boolean       // Default: true
  mergeHyphenatedWords?: boolean // Default: true
}
```

## Error Handling

The system gracefully handles various error conditions:

- **Corrupted PDFs**: Returns error message without crashing
- **Image-only PDFs**: Shows "OCR processing" or "OCR not available" messages
- **Large Files**: Provides progress feedback and timeouts
- **Missing Dependencies**: Graceful degradation when PDF.js or Tesseract unavailable

## Usage Examples

### Basic PDF Ingestion
```typescript
import { ingestPdf } from '@/lib/ingest-pipeline'

const file = new File([pdfBuffer], 'document.pdf', { type: 'application/pdf' })
const result = await ingestPdf(file)
```

### With Custom Options
```typescript
const options = {
  pdfOptions: {
    enableOCR: true,
    ocrLanguage: 'eng',
    confidenceThreshold: 80,
    detectColumns: true,
    mergeHyphenatedWords: true
  }
}

const result = await ingestPdf(file, options)
```

### Processing Pipeline
```typescript
import { IngestPipeline } from '@/lib/ingest-pipeline'

// Automatically detects PDF and uses appropriate processor
const result = await IngestPipeline.processFile(file, options)
```

## Testing

### Unit Tests
Run PDF-specific tests:
```bash
# In browser console
import { runPdfTests } from '@/lib/__tests__/pdf-simple'
await runPdfTests()
```

### Test Panel
Use the admin test panel:
1. Navigate to `/admin` 
2. Go to "PDF Test" tab
3. Click "Run PDF Test"

### Real File Testing
1. Create test PDFs with:
   - Various heading levels
   - Tables with borders
   - Figures with captions
   - Multi-column layouts
   - Mixed text/image content
2. Import via drag-and-drop
3. Verify structure detection

## Implementation Details

### Heading Detection Heuristics
- Font size > 120% of average = potential heading
- Bold weight or "bold" in font name = heading indicator
- Short lines (< 100 chars) = heading-like
- Capitalized first letter = heading pattern
- Combined score determines heading level (H1-H6)

### Table Detection Algorithm
1. Identify elements with regular horizontal spacing
2. Look for 3+ elements on same Y-coordinate
3. Calculate spacing variance (low variance = tabular)
4. Group consecutive table rows
5. Extract headers from first row

### Column Detection Process
1. Cluster elements by X-position (within 20px tolerance)
2. Identify significant clusters (5+ elements)
3. Calculate column boundaries
4. Sort reading order by column, then Y, then X

### Figure Caption Matching
- Pattern matching: `/^(figure|fig\.?|table|chart)\s+\d+/i`
- Proximity detection: captions near image boundaries
- Font style: italic text often indicates captions
- Size limits: captions typically < 200 characters

## Performance Considerations

- **Memory**: Large PDFs processed page-by-page to limit memory usage
- **Speed**: Text extraction faster than OCR (prefer text-first approach)
- **Threading**: OCR uses web workers to avoid UI blocking
- **Caching**: Font analysis results cached per document

## Browser Compatibility

- **PDF.js**: Works in all modern browsers
- **Tesseract.js**: Requires WebAssembly support
- **Web Workers**: Used for OCR processing
- **Canvas API**: Required for image rendering

## Future Enhancements

- **Image Extraction**: Extract embedded images from PDFs
- **Form Recognition**: Detect and parse PDF form fields
- **Vector Graphics**: Handle SVG and vector content
- **Metadata**: Extract PDF metadata (author, creation date, etc.)
- **Security**: Handle password-protected PDFs
- **Incremental**: Process large PDFs incrementally