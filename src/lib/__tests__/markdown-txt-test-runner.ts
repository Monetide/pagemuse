/**
 * Markdown and TXT Test Runner
 * Tests enhanced parsing capabilities for both formats
 */

import { ingestFile } from '../ingest-pipeline'
import { mapIRToPageMuse } from '../ir-mapper'
import { IRDocument } from '../ir-types'

/**
 * Tests comprehensive Markdown parsing
 */
export const testMarkdownParsing = async () => {
  console.log('📝 Testing Enhanced Markdown Parsing')
  console.log('=' + '='.repeat(40))

  // Sample markdown content
  const markdownContent = `# Project Guide

This is a **comprehensive** guide with *various* elements.

## Getting Started

Here's what you need to know:

- First step is planning
- Then comes implementation  
- Finally testing and deployment

### Code Example

\`\`\`javascript
function hello(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Data Overview

| Feature | Status | Priority |
|---------|--------|----------|
| Parsing | ✅ Done | High |
| Testing | 🔄 Progress | Medium |
| Docs | ⏳ Planned | Low |

### Images

![Sample Image](./test.png "This is a test image")

## Important Notes

> **Warning:** Always backup your data before making changes.

> **Note:** This system supports CommonMark + GitHub extensions.

> This is a regular quote without special formatting.

---

That's all for now!
`

  try {
    const file = new File([markdownContent], 'test-guide.md', { type: 'text/markdown' })
    const irDoc = await ingestFile(file, {
      preserveFormatting: true,
      generateAnchors: true,
      mergeShortParagraphs: false
    })

    console.log('✅ Markdown parsing completed')
    console.log(`📄 Title: ${irDoc.title}`)
    console.log(`📚 Sections: ${irDoc.sections.length}`)

    // Analyze parsed structure
    const section = irDoc.sections[0]
    const blockTypes = section.blocks.map(b => b.type)
    const typeCounts = blockTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('\n📊 Block Type Analysis:')
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`)
    })

    // Detailed analysis
    console.log('\n🔍 Detailed Structure:')
    section.blocks.forEach((block, idx) => {
      let content = ''
      
      switch (block.type) {
        case 'heading':
          const level = typeof block.content === 'object' ? block.content?.level : 'unknown'
          const text = typeof block.content === 'object' ? block.content?.text : block.content
          content = `H${level}: "${text}"`
          break
        case 'list':
          const listType = typeof block.content === 'object' ? block.content?.type : 'unknown'
          const itemCount = typeof block.content === 'object' ? block.content?.items?.length : 0
          content = `${listType} list (${itemCount} items)`
          break
        case 'table':
          const headers = typeof block.content === 'object' ? block.content?.headers?.length : 0
          const rows = typeof block.content === 'object' ? block.content?.rows?.length : 0
          content = `${headers} headers, ${rows} rows`
          break
        case 'code':
          const language = typeof block.content === 'object' ? block.content?.language : 'none'
          content = `${language || 'plain'} code block`
          break
        case 'figure':
          const caption = typeof block.content === 'object' ? block.content?.caption : ''
          content = `"${caption}"`
          break
        case 'callout':
          const calloutType = typeof block.content === 'object' ? block.content?.type : 'unknown'
          content = `${calloutType} callout`
          break
        default:
          content = typeof block.content === 'string' ? 
            block.content.substring(0, 30) + '...' : 
            '[complex content]'
      }
      
      console.log(`   ${idx + 1}. ${block.type}: ${content}`)
    })

    // Test PageMuse mapping
    const pageMuseDoc = mapIRToPageMuse(irDoc)
    
    console.log('\n📄 PageMuse Conversion:')
    console.log(`   Total blocks: ${pageMuseDoc.sections.reduce((sum, s) => 
      sum + s.flows.reduce((flowSum, f) => flowSum + f.blocks.length, 0), 0)}`)

    // Validation checks
    const expectedElements = {
      headings: 3,    // H1, H2, H3
      paragraphs: 3,  // Various text blocks
      lists: 1,       // Unordered list
      tables: 1,      // Data table
      code: 1,        // JavaScript block
      figures: 1,     // Image
      callouts: 2,    // Warning, Note
      quotes: 1,      // Regular quote
      horizontalRules: 1 // Separator
    }

    const actualBlocks = pageMuseDoc.sections.flatMap(s => s.flows.flatMap(f => f.blocks))
    const actualElements = {
      headings: actualBlocks.filter(b => b.type === 'heading').length,
      paragraphs: actualBlocks.filter(b => b.type === 'paragraph').length,
      lists: actualBlocks.filter(b => b.type === 'ordered-list' || b.type === 'unordered-list').length,
      tables: actualBlocks.filter(b => b.type === 'table').length,
      code: actualBlocks.filter(b => b.type === 'paragraph' && b.content?.includes('```')).length,
      figures: actualBlocks.filter(b => b.type === 'figure').length,
      callouts: actualBlocks.filter(b => b.type === 'callout').length,
      quotes: actualBlocks.filter(b => b.type === 'quote').length,
      horizontalRules: actualBlocks.filter(b => b.type === 'divider').length
    }

    console.log('\n🎯 Element Validation:')
    let totalScore = 0
    let maxScore = 0

    Object.entries(expectedElements).forEach(([element, expected]) => {
      const actual = actualElements[element as keyof typeof actualElements]
      const score = Math.min(actual, expected)
      totalScore += score
      maxScore += expected
      
      const status = actual >= expected ? '✅' : '⚠️'
      console.log(`   ${status} ${element}: ${actual}/${expected}`)
    })

    const accuracy = Math.round((totalScore / maxScore) * 100)
    console.log(`\n📈 Parsing Accuracy: ${accuracy}%`)

    if (accuracy >= 90) {
      console.log('🏆 Excellent! Markdown parsing is working perfectly.')
    } else if (accuracy >= 75) {
      console.log('👍 Good! Most Markdown elements are parsed correctly.')
    } else {
      console.log('⚠️  Some Markdown elements may need improvement.')
    }

  } catch (error) {
    console.error('❌ Markdown test failed:', error)
  }
}

/**
 * Tests plain text structure detection
 */
export const testPlainTextParsing = async () => {
  console.log('\n📄 Testing Plain Text Structure Detection')
  console.log('=' + '='.repeat(45))

  const plainTextContent = `ANNUAL REPORT 2024

This is the main introduction paragraph that sets the context for the entire document.

Chapter 1: Executive Summary

Our company has performed exceptionally well this year with record-breaking results across all metrics.

Key achievements:
- Revenue growth of 25%
- Market expansion in 3 regions  
- Customer satisfaction at 98%
- Employee retention at 94%

Section 1.1: Financial Performance

The financial results demonstrate strong performance:

1. Q1 revenue: $12.5M
2. Q2 revenue: $14.2M
3. Q3 revenue: $16.1M
4. Q4 revenue: $18.3M

Chapter 2: Market Analysis

Market conditions have been favorable throughout 2024.

"This has been our best year yet." - CEO Statement

Key metrics show improvement across all areas.

CONCLUSION

We are well-positioned for continued growth in 2025.
`

  try {
    const file = new File([plainTextContent], 'annual-report.txt', { type: 'text/plain' })
    const irDoc = await ingestFile(file, {
      preserveFormatting: false,
      generateAnchors: true,
      mergeShortParagraphs: true
    })

    console.log('✅ Plain text parsing completed')
    console.log(`📄 Title: ${irDoc.title}`)
    console.log(`📚 Sections: ${irDoc.sections.length}`)

    const section = irDoc.sections[0]
    console.log(`📝 Total blocks: ${section.blocks.length}`)

    console.log('\n🔍 Structure Detection Results:')
    section.blocks.forEach((block, idx) => {
      let description = ''
      
      if (block.type === 'heading') {
        const level = typeof block.content === 'object' ? block.content?.level : 'unknown'
        const text = typeof block.content === 'object' ? block.content?.text : block.content
        description = `H${level}: "${text}"`
      } else if (block.type === 'list') {
        const listType = typeof block.content === 'object' ? block.content?.type : 'unknown'
        const itemCount = typeof block.content === 'object' ? block.content?.items?.length : 0
        description = `${listType} list (${itemCount} items)`
      } else if (block.type === 'quote') {
        const content = typeof block.content === 'object' ? block.content?.content : block.content
        description = `"${typeof content === 'string' ? content.substring(0, 30) : content}..."`
      } else {
        const content = typeof block.content === 'string' ? block.content : String(block.content)
        description = content.substring(0, 40) + (content.length > 40 ? '...' : '')
      }
      
      console.log(`   ${idx + 1}. ${block.type}: ${description}`)
    })

    // Test PageMuse conversion
    const pageMuseDoc = mapIRToPageMuse(irDoc)
    
    const allBlocks = pageMuseDoc.sections.flatMap(s => s.flows.flatMap(f => f.blocks))
    const structuralElements = {
      headings: allBlocks.filter(b => b.type === 'heading').length,
      paragraphs: allBlocks.filter(b => b.type === 'paragraph').length,
      lists: allBlocks.filter(b => b.type === 'ordered-list' || b.type === 'unordered-list').length,
      quotes: allBlocks.filter(b => b.type === 'quote').length
    }

    console.log('\n📊 Structure Detection Summary:')
    console.log(`   📝 Headings detected: ${structuralElements.headings}`)
    console.log(`   📄 Paragraphs: ${structuralElements.paragraphs}`)
    console.log(`   📋 Lists: ${structuralElements.lists}`)
    console.log(`   💭 Quotes: ${structuralElements.quotes}`)

    // Validation for plain text
    const minExpected = {
      headings: 3,     // Chapter 1, Section 1.1, Chapter 2, etc.
      paragraphs: 5,   // Various text blocks
      lists: 2,        // Bullet and numbered lists
      quotes: 1        // CEO quote
    }

    console.log('\n🎯 Structure Detection Validation:')
    let detectionScore = 0
    let maxDetectionScore = 0

    Object.entries(minExpected).forEach(([element, expected]) => {
      const actual = structuralElements[element as keyof typeof structuralElements]
      const score = actual >= expected ? 1 : 0
      detectionScore += score
      maxDetectionScore += 1
      
      const status = actual >= expected ? '✅' : '⚠️'
      console.log(`   ${status} ${element}: ${actual} (min ${expected})`)
    })

    const detectionAccuracy = Math.round((detectionScore / maxDetectionScore) * 100)
    console.log(`\n📈 Structure Detection Accuracy: ${detectionAccuracy}%`)

    if (detectionAccuracy >= 75) {
      console.log('🏆 Great! Plain text structure detection is working well.')
    } else {
      console.log('⚠️  Plain text structure detection may need refinement.')
    }

  } catch (error) {
    console.error('❌ Plain text test failed:', error)
  }
}

/**
 * Runs all Markdown and TXT tests
 */
export const runMarkdownTxtTests = async () => {
  console.log('🧪 Enhanced Markdown & TXT Ingest Tests')
  console.log('=' + '='.repeat(50))
  
  await testMarkdownParsing()
  await testPlainTextParsing()
  
  console.log('\n🎉 All Markdown and TXT tests completed!')
  console.log('\n📝 To test with real files:')
  console.log('1. Create .md files with headings, tables, images, code blocks, and callouts')
  console.log('2. Create .txt files with structured content (chapters, sections, lists)')
  console.log('3. Import through the UI drag-and-drop zone')
  console.log('4. Verify all elements are correctly parsed and mapped to PageMuse format')
}

// Export for console testing
if (typeof window !== 'undefined') {
  (window as any).testMarkdownTxt = runMarkdownTxtTests
}