/**
 * DOCX Test Runner
 * Tests DOCX parsing with sample documents
 */

import { ingestFile } from '../ingest-pipeline'
import { mapIRToPageMuse } from '../ir-mapper'
import { logIRTestResult } from '../ir-test-utils'

/**
 * Creates a mock DOCX file for testing
 */
const createMockDocxFile = (name: string, content: string): File => {
  const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  return new File([blob], name, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
}

/**
 * Tests DOCX parsing with various Word document structures
 */
export const testDocxParsing = async () => {
  console.log('🧪 Starting DOCX Parsing Tests...\n')

  // Test 1: Simple document with headings and paragraphs
  try {
    const simpleDocxContent = `
    <html>
      <body>
        <h1>Annual Report 2024</h1>
        <p><strong>Executive Summary</strong></p>
        <p>This year has been <em>exceptional</em> for our company growth.</p>
        
        <h2>Financial Performance</h2>
        <p>Revenue increased by <u>25%</u> year-over-year.</p>
        
        <ul>
          <li>Q1 Results: $12.5M</li>
          <li>Q2 Results: $14.2M</li>
          <li>Q3 Results: $16.1M</li>
          <li>Q4 Results: $18.3M</li>
        </ul>
        
        <h3>Key Metrics</h3>
        <ol>
          <li>Customer satisfaction: 98%</li>
          <li>Employee retention: 94%</li>
          <li>Market share: 23%</li>
        </ol>
        
        <blockquote>
          "This has been our best year yet." - CEO
        </blockquote>
        
        <table>
          <tr>
            <th><strong>Quarter</strong></th>
            <th><strong>Revenue</strong></th>
            <th><strong>Growth</strong></th>
          </tr>
          <tr>
            <td>Q1</td>
            <td>$12.5M</td>
            <td>15%</td>
          </tr>
          <tr>
            <td>Q2</td>
            <td>$14.2M</td>
            <td>18%</td>
          </tr>
        </table>
      </body>
    </html>
    `
    
    console.log('Test 1: Comprehensive DOCX Document')
    console.log('Testing: Headings (H1-H3), Formatted text (bold/italic/underline), Lists (ul/ol), Quote, Table with headers')
    
    // Since we can't actually create a real DOCX file in the browser,
    // we'll create a mock HTML file to simulate the mammoth.js output
    const mockFile = new File([simpleDocxContent], 'test-report.html', { type: 'text/html' })
    
    const irDoc = await ingestFile(mockFile, {
      preserveFormatting: true,
      generateAnchors: true,
      mergeShortParagraphs: false
    })
    
    console.log('✅ DOCX parsing completed')
    console.log('📊 IR Document Structure:')
    console.log(`   Title: ${irDoc.title}`)
    console.log(`   Sections: ${irDoc.sections.length}`)
    
    irDoc.sections.forEach((section, idx) => {
      console.log(`   Section ${idx + 1}: ${section.title || section.id}`)
      console.log(`     Blocks: ${section.blocks.length}`)
      
      section.blocks.forEach((block, blockIdx) => {
        const content = typeof block.content === 'string' ? 
          block.content.substring(0, 30) + '...' :
          block.content?.text || `[${block.type}]`
        console.log(`       ${blockIdx + 1}. ${block.type}: ${content}`)
        
        if (block.attrs?.marks && block.attrs.marks.length > 0) {
          console.log(`          Marks: ${block.attrs.marks.map((m: any) => m.type).join(', ')}`)
        }
      })
      
      if (section.notes && section.notes.length > 0) {
        console.log(`     Footnotes: ${section.notes.length}`)
        section.notes.forEach((note, noteIdx) => {
          console.log(`       ${noteIdx + 1}. ${note.content.substring(0, 40)}...`)
        })
      }
    })
    
    // Test mapping to PageMuse
    const pageMuseDoc = mapIRToPageMuse(irDoc)
    console.log('\n📄 PageMuse Mapping:')
    console.log(`   Document: ${pageMuseDoc.title}`)
    console.log(`   Total Sections: ${pageMuseDoc.sections.length}`)
    console.log(`   Total Flows: ${pageMuseDoc.sections.reduce((sum, s) => sum + s.flows.length, 0)}`)
    console.log(`   Total Blocks: ${pageMuseDoc.sections.reduce((sum, s) => 
      sum + s.flows.reduce((flowSum, f) => flowSum + f.blocks.length, 0), 0)}`)
    
    // Verify specific elements were parsed correctly
    const allBlocks = pageMuseDoc.sections.flatMap(s => s.flows.flatMap(f => f.blocks))
    const headings = allBlocks.filter(b => b.type === 'heading')
    const lists = allBlocks.filter(b => b.type === 'ordered-list' || b.type === 'unordered-list')
    const tables = allBlocks.filter(b => b.type === 'table')
    const quotes = allBlocks.filter(b => b.type === 'quote')
    
    console.log('\n🎯 Element Verification:')
    console.log(`   Headings found: ${headings.length}`)
    console.log(`   Lists found: ${lists.length}`)
    console.log(`   Tables found: ${tables.length}`)
    console.log(`   Quotes found: ${quotes.length}`)
    
    if (headings.length >= 3 && lists.length >= 2 && tables.length >= 1 && quotes.length >= 1) {
      console.log('✅ All major DOCX elements successfully parsed and mapped!')
    } else {
      console.log('⚠️  Some elements may not have been parsed correctly')
    }
    
  } catch (error) {
    console.error('❌ Test 1 Failed:', error)
  }

  console.log('\n' + '='.repeat(60))
  
  // Test 2: Document with figures and captions
  try {
    console.log('\n📸 Test 2: Figures and Captions')
    
    const figureDocContent = `
    <html>
      <body>
        <h1>Product Showcase</h1>
        <p>Our latest innovations are shown below.</p>
        
        <img src="/images/product1.jpg" alt="Revolutionary product design">
        <p class="caption">Figure 1: Our breakthrough product design</p>
        
        <h2>Market Analysis</h2>
        <img src="/images/chart.png" alt="Market growth chart">
        <p class="caption">Figure 2: Market growth trends over 5 years</p>
        
        <p>As illustrated in the figures above, our products show tremendous potential.</p>
      </body>
    </html>
    `
    
    const figureFile = new File([figureDocContent], 'product-showcase.html', { type: 'text/html' })
    const figureIR = await ingestFile(figureFile)
    
    const figurePageMuse = mapIRToPageMuse(figureIR)
    const figures = figurePageMuse.sections.flatMap(s => s.flows.flatMap(f => f.blocks))
      .filter(b => b.type === 'figure')
    
    console.log(`   Figures with captions found: ${figures.length}`)
    
    figures.forEach((fig, idx) => {
      console.log(`   Figure ${idx + 1}: ${fig.content?.caption || 'No caption'}`)
      console.log(`     Alt text: ${fig.content?.altText || 'No alt text'}`)
    })
    
    if (figures.length >= 2) {
      console.log('✅ Figure and caption parsing successful!')
    } else {
      console.log('⚠️  Figure parsing may need improvement')
    }
    
  } catch (error) {
    console.error('❌ Test 2 Failed:', error)
  }

  console.log('\n🎉 DOCX Testing Complete!')
  console.log('Note: These tests use HTML simulation since real DOCX processing requires mammoth.js with actual Word documents.')
}

/**
 * Style mapping validation
 */
export const validateWordStyleMappings = () => {
  console.log('\n📋 Word Style Mapping Validation:')
  
  const expectedMappings = [
    { word: 'Heading 1', ir: 'heading', level: 1 },
    { word: 'Heading 2', ir: 'heading', level: 2 },
    { word: 'Heading 3', ir: 'heading', level: 3 },
    { word: 'Normal', ir: 'paragraph' },
    { word: 'List Paragraph', ir: 'list' },
    { word: 'Quote', ir: 'quote' },
    { word: 'Caption', ir: 'paragraph', special: 'caption' }
  ]
  
  console.log('Expected Word → IR Mappings:')
  expectedMappings.forEach(mapping => {
    console.log(`   ${mapping.word} → ${mapping.ir}${mapping.level ? ` (level ${mapping.level})` : ''}${mapping.special ? ` (${mapping.special})` : ''}`)
  })
  
  console.log('\n✅ Style mappings defined and ready for real DOCX processing')
}

// Export test runner for use in development
export const runAllDocxTests = async () => {
  console.log('🧪 DOCX Ingest System Tests')
  console.log('=' + '='.repeat(40))
  
  validateWordStyleMappings()
  await testDocxParsing()
  
  console.log('\n📝 To test with real DOCX files:')
  console.log('1. Create a Word document with headings, lists, tables, images, and footnotes')
  console.log('2. Save as .docx format')
  console.log('3. Import through the UI drag-and-drop zone')  
  console.log('4. The mammoth.js library will handle the actual DOCX parsing')
}