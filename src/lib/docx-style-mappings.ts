/**
 * DOCX Style Mappings
 * Maps Word document styles to IR elements
 */

export interface DocxStyleMapping {
  wordStyleName: string
  irBlockType: string
  level?: number
  attributes?: Record<string, any>
}

/**
 * Standard Word style mappings to IR block types
 */
export const WORD_STYLE_MAPPINGS: DocxStyleMapping[] = [
  // Headings
  { wordStyleName: 'Heading 1', irBlockType: 'heading', level: 1 },
  { wordStyleName: 'Heading 2', irBlockType: 'heading', level: 2 },
  { wordStyleName: 'Heading 3', irBlockType: 'heading', level: 3 },
  { wordStyleName: 'Heading 4', irBlockType: 'heading', level: 4 },
  { wordStyleName: 'Heading 5', irBlockType: 'heading', level: 5 },
  { wordStyleName: 'Heading 6', irBlockType: 'heading', level: 6 },
  
  // Paragraphs
  { wordStyleName: 'Normal', irBlockType: 'paragraph' },
  { wordStyleName: 'Body Text', irBlockType: 'paragraph' },
  { wordStyleName: 'Body Text Indent', irBlockType: 'paragraph' },
  
  // Lists
  { wordStyleName: 'List Paragraph', irBlockType: 'list' },
  { wordStyleName: 'List Number', irBlockType: 'list', attributes: { type: 'ordered' } },
  { wordStyleName: 'List Bullet', irBlockType: 'list', attributes: { type: 'unordered' } },
  
  // Special paragraphs
  { wordStyleName: 'Quote', irBlockType: 'quote' },
  { wordStyleName: 'Block Text', irBlockType: 'quote' },
  { wordStyleName: 'Caption', irBlockType: 'paragraph', attributes: { isCaption: true } },
  { wordStyleName: 'Figure Caption', irBlockType: 'paragraph', attributes: { isCaption: true } },
  { wordStyleName: 'Table Caption', irBlockType: 'paragraph', attributes: { isCaption: true } },
  
  // Code and technical
  { wordStyleName: 'Code', irBlockType: 'code', attributes: { inline: false } },
  { wordStyleName: 'HTML Code', irBlockType: 'code', attributes: { language: 'html' } },
  { wordStyleName: 'No Spacing', irBlockType: 'paragraph' }
]

/**
 * Character-level formatting mappings
 */
export const CHARACTER_FORMAT_MAPPINGS = {
  // Font weight
  bold: { irMark: 'bold' },
  '700': { irMark: 'bold' },
  
  // Font style
  italic: { irMark: 'italic' },
  
  // Text decoration
  underline: { irMark: 'underline' },
  'line-through': { irMark: 'strikethrough' },
  
  // Special formatting
  superscript: { irMark: 'superscript' },
  subscript: { irMark: 'subscript' }
}

/**
 * Word list style mappings
 */
export const LIST_STYLE_MAPPINGS = {
  // Numbered lists
  'decimal': { type: 'ordered', format: 'decimal' },
  'lower-alpha': { type: 'ordered', format: 'lower-alpha' },
  'upper-alpha': { type: 'ordered', format: 'upper-alpha' },
  'lower-roman': { type: 'ordered', format: 'lower-roman' },
  'upper-roman': { type: 'ordered', format: 'upper-roman' },
  
  // Bullet lists
  'disc': { type: 'unordered', format: 'disc' },
  'circle': { type: 'unordered', format: 'circle' },
  'square': { type: 'unordered', format: 'square' },
  'none': { type: 'unordered', format: 'none' }
}

/**
 * Table style detection patterns
 */
export const TABLE_STYLE_PATTERNS = {
  hasHeaderRow: [
    'Table Grid',
    'Table Professional',
    'Light Shading',
    'Medium Shading',
    'Dark Shading'
  ],
  
  noHeaderRow: [
    'Table Normal',
    'Plain Table'
  ]
}

/**
 * Figure detection patterns
 */
export const FIGURE_PATTERNS = {
  captionPrefixes: [
    'Figure',
    'Fig.',
    'Image',
    'Chart',
    'Graph',
    'Diagram',
    'Photo',
    'Illustration'
  ],
  
  captionStyles: [
    'Caption',
    'Figure Caption',
    'Image Caption'
  ]
}

/**
 * Footnote and endnote patterns
 */
export const NOTE_PATTERNS = {
  footnoteMarkers: [
    /^\d+$/,           // Numeric: 1, 2, 3
    /^[a-z]$/,         // Lowercase: a, b, c
    /^[A-Z]$/,         // Uppercase: A, B, C
    /^[ivx]+$/,        // Roman numerals: i, ii, iii
    /^\*+$/            // Asterisks: *, **, ***
  ],
  
  footnoteStyles: [
    'Footnote Text',
    'Footnote Reference',
    'Endnote Text',
    'Endnote Reference'
  ]
}

/**
 * Gets IR block type from Word style name
 */
export const getIRBlockTypeFromWordStyle = (styleName: string): DocxStyleMapping | null => {
  return WORD_STYLE_MAPPINGS.find(mapping => 
    mapping.wordStyleName.toLowerCase() === styleName.toLowerCase()
  ) || null
}

/**
 * Determines if a paragraph should be treated as a figure caption
 */
export const isFigureCaption = (text: string, styleName?: string): boolean => {
  if (styleName && FIGURE_PATTERNS.captionStyles.some(style => 
    styleName.toLowerCase().includes(style.toLowerCase())
  )) {
    return true
  }
  
  return FIGURE_PATTERNS.captionPrefixes.some(prefix => 
    text.toLowerCase().startsWith(prefix.toLowerCase())
  )
}

/**
 * Determines if a table should have a header row based on style
 */
export const shouldTableHaveHeader = (styleName?: string): boolean => {
  if (!styleName) return false
  
  return TABLE_STYLE_PATTERNS.hasHeaderRow.some(pattern =>
    styleName.toLowerCase().includes(pattern.toLowerCase())
  )
}

/**
 * Extracts footnote number from marker text
 */
export const extractFootnoteNumber = (markerText: string): number | null => {
  for (const pattern of NOTE_PATTERNS.footnoteMarkers) {
    if (pattern.test(markerText.trim())) {
      const match = markerText.match(/\d+/)
      return match ? parseInt(match[0], 10) : null
    }
  }
  return null
}