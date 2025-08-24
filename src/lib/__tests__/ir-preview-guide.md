# IR Preview (Debug) Implementation Guide

## Overview

The IR Preview feature provides a debugging interface for inspecting the Intermediate Representation (IR) generated during document parsing. This helps developers and power users understand how content is being processed and structured.

## Features

### IR Preview Drawer
- **Side Drawer**: Opens from the right side with comprehensive IR inspection
- **Copyable JSON**: Full IR document and sections can be copied to clipboard
- **Source Summary**: Shows file type, size, character count, and image count
- **Block Analysis**: Visual breakdown of parsed blocks by type
- **Section Details**: Expandable view of each document section

### Integration Points
- **Paste Auto-structure Modal**: "Show IR" button in footer
- **Import Dialog**: IR preview for uploaded files
- **Ingest Test Panel**: Debug parsed content during development

### Debug Console (Development)
- **Floating Widget**: Bottom-right corner debug interface
- **Quick Access**: Fast IR viewing and console logging
- **Error Display**: Shows parsing errors and warnings
- **Performance Info**: Processing time and operation details

## Usage Examples

### Basic IR Preview
```typescript
import { IRPreviewDrawer } from '@/components/debug/IRPreviewDrawer'

const MyComponent = () => {
  const [showIR, setShowIR] = useState(false)
  const [irDocument, setIrDocument] = useState(null)

  return (
    <>
      <Button onClick={() => setShowIR(true)}>Show IR</Button>
      
      <IRPreviewDrawer
        isOpen={showIR}
        onOpenChange={setShowIR}
        irDocument={irDocument}
        sourceInfo={{
          type: 'markdown',
          filename: 'document.md',
          size: 1024,
          imageCount: 2
        }}
      />
    </>
  )
}
```

### Debug Console Integration
```typescript
import { DebugConsole, useDebugMode } from '@/components/debug/DebugConsole'

const App = () => {
  const { debugEnabled } = useDebugMode()
  const [currentIR, setCurrentIR] = useState(null)

  return (
    <div>
      {/* Your app content */}
      
      {debugEnabled && (
        <DebugConsole
          currentIR={currentIR}
          debugInfo={{
            lastOperation: 'PDF parsing',
            processingTime: 1250,
            sourceType: 'application/pdf',
            errors: []
          }}
        />
      )}
    </div>
  )
}
```

### Modal Integration Pattern
```typescript
const ImportModal = () => {
  const [irDocument, setIrDocument] = useState(null)
  const [showIRPreview, setShowIRPreview] = useState(false)

  const handleFileProcessed = async (file) => {
    const ir = await processFile(file)
    setIrDocument(ir)
  }

  return (
    <Dialog>
      <DialogContent>
        {/* Modal content */}
        
        <DialogFooter>
          <Button onClick={handleImport}>Import</Button>
          {irDocument && (
            <Button 
              variant="outline" 
              onClick={() => setShowIRPreview(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Show IR
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
      
      <IRPreviewDrawer
        isOpen={showIRPreview}
        onOpenChange={setShowIRPreview}
        irDocument={irDocument}
        sourceInfo={{
          type: file?.type,
          filename: file?.name,
          size: file?.size,
          imageCount: 0
        }}
      />
    </Dialog>
  )
}
```

## Components

### IRPreviewDrawer Props
```typescript
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
```

### DebugConsole Props
```typescript
interface DebugConsoleProps {
  currentIR?: IRDocument | null
  debugInfo?: {
    lastOperation?: string
    processingTime?: number
    sourceType?: string
    errors?: string[]
  }
}
```

## Data Structure

### IR Document Structure
The preview shows the complete IR document structure:

```json
{
  "title": "Document Title",
  "sections": [
    {
      "id": "section-1",
      "title": "Section Title",
      "order": 1,
      "blocks": [
        {
          "id": "block-1",
          "type": "heading",
          "content": {
            "level": 1,
            "text": "Heading Text",
            "anchor": "heading-text"
          },
          "order": 1
        }
      ],
      "notes": []
    }
  ],
  "metadata": {
    "author": "Author Name",
    "created": "2024-01-01T00:00:00Z",
    "language": "en"
  },
  "assets": []
}
```

### Source Information
Provides context about the original content:

- **Type**: File MIME type or content format
- **Filename**: Original file name (if applicable)
- **Size**: Content size in characters/bytes
- **Image Count**: Number of embedded images

### Block Type Analysis
Shows distribution of parsed elements:

- **heading**: H1-H6 headings
- **paragraph**: Text paragraphs
- **list**: Ordered/unordered lists
- **table**: Tabular data
- **figure**: Images with captions
- **quote**: Blockquotes
- **callout**: Highlighted content boxes
- **divider**: Horizontal rules

## Development Tools

### Enabling Debug Mode
```javascript
// In browser console
localStorage.setItem('lovable-debug-enabled', 'true')
window.location.reload()

// Or use the debug hook
const { enableDebug } = useDebugMode()
enableDebug()
```

### Console Logging
```javascript
// Debug console provides quick logging
// Click "Log" button to output current state to browser console

// Manual logging
console.log('IR Document:', irDocument)
console.log('Processing Stats:', {
  sections: irDocument.sections.length,
  blocks: irDocument.sections.reduce((sum, s) => sum + s.blocks.length, 0),
  processingTime: '1.2s'
})
```

### Testing Integration
```typescript
// In test files
import { IRPreviewDrawer } from '@/components/debug/IRPreviewDrawer'

test('IR preview shows document structure', () => {
  const mockIR = {
    title: 'Test Document',
    sections: [/* mock sections */],
    metadata: {}
  }

  render(
    <IRPreviewDrawer
      isOpen={true}
      onOpenChange={() => {}}
      irDocument={mockIR}
    />
  )

  expect(screen.getByText('Test Document')).toBeInTheDocument()
})
```

## Performance Considerations

### Memory Usage
- IR documents are held in memory while preview is open
- Large documents (>1MB) may impact performance
- Consider pagination for very large IR structures

### Processing Time
- IR generation happens during content parsing
- Preview display is near-instantaneous (JSON formatting only)
- Copy operations use browser clipboard API

### Browser Compatibility
- Clipboard API requires HTTPS in production
- Sheet/drawer animations require modern browsers
- JSON formatting works in all supported browsers

## Troubleshooting

### Common Issues

**"Show IR" button disabled**
- Ensure IR document has been generated successfully
- Check for parsing errors in console
- Verify file was processed completely

**Empty IR preview**
- Check if content was parsed correctly
- Verify file format is supported
- Look for processing errors in debug console

**Copy to clipboard fails**
- Ensure HTTPS connection (required for clipboard API)
- Check browser permissions for clipboard access
- Use manual copy/paste as fallback

**Debug console not showing**
- Enable debug mode: `localStorage.setItem('lovable-debug-enabled', 'true')`
- Refresh the page after enabling
- Check browser console for errors

### Debugging Workflow

1. **Enable Debug Mode**: Use localStorage or debug hook
2. **Process Content**: Import/paste content to generate IR
3. **Open IR Preview**: Click "Show IR" button in modal footer
4. **Inspect Structure**: Review sections, blocks, and metadata
5. **Copy for Analysis**: Use copy buttons to extract JSON
6. **Check Console**: Use debug console for quick logging

## Best Practices

### Development
- Always enable debug mode during IR development
- Use IR preview to validate parsing logic
- Copy IR samples for unit test fixtures
- Monitor processing times for performance optimization

### Testing
- Include IR structure validation in tests
- Test with various content types and sizes
- Verify copy functionality works correctly
- Check mobile responsiveness of drawer

### Production
- Debug mode is disabled by default in production
- IR preview only available to authenticated users
- Consider adding admin-only debug access
- Monitor memory usage with large documents

## Future Enhancements

### Planned Features
- **Visual IR Editor**: In-place editing of IR structure
- **Diff View**: Compare IR before/after processing
- **Export Options**: Save IR as JSON/XML files
- **Search/Filter**: Find specific blocks or content
- **Performance Metrics**: Detailed parsing statistics

### Integration Opportunities
- **Version Control**: Track IR changes over time
- **Validation Rules**: Custom IR structure validation
- **Import/Export**: Share IR templates between users
- **API Integration**: Remote IR processing and storage