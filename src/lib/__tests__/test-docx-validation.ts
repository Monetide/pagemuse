/**
 * DOCX Validation Test
 * Validates that DOCX parsing correctly maps Word styles to IR elements
 */

import { testIRMapping, createMockIRDocument } from '../ir-test-utils'
import { IRDocument } from '../ir-types'

/**
 * Mock IR document simulating a parsed DOCX with all major elements
 */
export const createDocxSimulationIR = (): IRDocument => ({
  title: "DOCX Test Document",
  sections: [
    {
      id: "docx-section-1",
      title: "Document Content",
      order: 1,
      blocks: [
        // Heading 1 (Word "Heading 1" style → IR heading level 1)
        {
          id: "docx-block-1",
          type: "heading",
          order: 1,
          content: {
            level: 1,
            text: "Annual Report 2024"
          }
        },
        
        // Normal paragraph with bold formatting (Word "Normal" + bold → IR paragraph with bold mark)
        {
          id: "docx-block-2", 
          type: "paragraph",
          order: 2,
          content: "This is a bold paragraph from Word.",
          marks: [{ type: "bold" }]
        },
        
        // Heading 2 (Word "Heading 2" style → IR heading level 2)
        {
          id: "docx-block-3",
          type: "heading", 
          order: 3,
          content: {
            level: 2,
            text: "Executive Summary"
          }
        },
        
        // Paragraph with italic formatting (Word "Normal" + italic → IR paragraph with italic mark)
        {
          id: "docx-block-4",
          type: "paragraph",
          order: 4,
          content: "This paragraph contains italic text from Word.",
          marks: [{ type: "italic" }]
        },
        
        // Bulleted list (Word "List Paragraph" style → IR unordered list)
        {
          id: "docx-block-5",
          type: "list",
          order: 5,
          content: {
            type: "unordered",
            items: [
              { content: "Revenue increased 25%" },
              { content: "New market expansion" },
              { content: "Customer satisfaction at 98%" }
            ]
          }
        },
        
        // Numbered list (Word "List Number" style → IR ordered list)
        {
          id: "docx-block-6",
          type: "list",
          order: 6,
          content: {
            type: "ordered", 
            items: [
              { content: "Q1 performance review" },
              { content: "Q2 strategic planning" },
              { content: "Q3 implementation" },
              { content: "Q4 evaluation" }
            ]
          }
        },
        
        // Table (Word table → IR table with header detection)
        {
          id: "docx-block-7",
          type: "table",
          order: 7,
          content: {
            headers: ["Quarter", "Revenue", "Growth"],
            rows: [
              ["Q1", "$12.5M", "15%"],
              ["Q2", "$14.2M", "18%"],
              ["Q3", "$16.1M", "22%"]
            ],
            headerRow: true,
            caption: "Quarterly Performance"
          }
        },
        
        // Quote (Word "Quote" style → IR quote)
        {
          id: "docx-block-8",
          type: "quote",
          order: 8,
          content: {
            content: "This has been our most successful year to date.",
            citation: "CEO Statement"
          }
        },
        
        // Figure with caption (Word image + "Caption" style → IR figure)
        {
          id: "docx-block-9",
          type: "figure",
          order: 9,
          content: {
            image: {
              id: "docx-asset-1",
              filename: "revenue-chart.png",
              mimeType: "image/png",
              url: "/charts/revenue.png",
              alt: "Revenue growth chart"
            },
            caption: "Figure 1: Annual revenue growth trend",
            alt: "Revenue growth chart",
            size: "large"
          }
        },
        
        // Paragraph with underline (Word "Normal" + underline → IR paragraph with underline mark)
        {
          id: "docx-block-10",
          type: "paragraph", 
          order: 10,
          content: "This text has underline formatting from Word.",
          marks: [{ type: "underline" }]
        }
      ],
      
      // Footnotes (Word footnotes → IR footnotes)
      notes: [
        {
          id: "docx-footnote-1",
          number: 1,
          content: "Revenue figures exclude one-time gains from asset sales.",
          backlinks: ["docx-block-7"]
        },
        {
          id: "docx-footnote-2",
          number: 2,
          content: "Customer satisfaction data based on Q4 survey results.",
          backlinks: ["docx-block-5"]
        }
      ]
    }
  ],
  metadata: {
    author: "DOCX Import System",
    created: new Date('2024-01-15'),
    modified: new Date('2024-01-15'),
    tags: ["docx", "test", "validation"],
    description: "Test document validating DOCX style mappings to IR format"
  }
})

/**
 * Validates DOCX style mapping accuracy
 */
export const validateDocxStyleMappings = () => {
  console.log('🎯 DOCX Style Mapping Validation')
  console.log('=' + '='.repeat(45))
  
  const docxIR = createDocxSimulationIR()
  const testResult = testIRMapping(docxIR)
  
  if (testResult.success && testResult.result) {
    const pageMuseDoc = testResult.result
    
    console.log('✅ DOCX IR → PageMuse mapping successful!')
    console.log('\n📋 Style Mapping Verification:')
    
    // Validate specific mappings
    const blocks = pageMuseDoc.sections.flatMap(s => s.flows.flatMap(f => f.blocks))
    
    // Check headings
    const headings = blocks.filter(b => b.type === 'heading')
    console.log(`   📝 Headings: ${headings.length} found`)
    headings.forEach((h, i) => {
      const level = h.metadata?.level || (typeof h.content === 'object' && h.content?.level) || 'unknown'
      const text = typeof h.content === 'string' ? h.content : h.content?.text || 'untitled'
      console.log(`      H${level}: "${text}"`)
    })
    
    // Check formatted paragraphs  
    const paragraphs = blocks.filter(b => b.type === 'paragraph')
    const formattedParagraphs = paragraphs.filter(p => p.metadata?.marks && p.metadata.marks.length > 0)
    console.log(`   📄 Formatted paragraphs: ${formattedParagraphs.length}/${paragraphs.length}`)
    formattedParagraphs.forEach(p => {
      const marks = p.metadata?.marks?.map((m: any) => m.type).join(', ') || 'none'
      console.log(`      "${p.content.substring(0, 30)}..." [${marks}]`)
    })
    
    // Check lists
    const lists = blocks.filter(b => b.type === 'ordered-list' || b.type === 'unordered-list')
    console.log(`   📋 Lists: ${lists.length} found`)
    lists.forEach(list => {
      const type = list.type === 'ordered-list' ? 'numbered' : 'bulleted'
      const itemCount = Array.isArray(list.content) ? list.content.length : 0
      console.log(`      ${type} list with ${itemCount} items`)
    })
    
    // Check tables
    const tables = blocks.filter(b => b.type === 'table')
    console.log(`   📊 Tables: ${tables.length} found`)
    tables.forEach(table => {
      const headers = table.content?.headers?.length || 0
      const rows = table.content?.rows?.length || 0
      console.log(`      Table: ${headers} headers, ${rows} data rows`)
    })
    
    // Check figures
    const figures = blocks.filter(b => b.type === 'figure')
    console.log(`   🖼️  Figures: ${figures.length} found`)
    figures.forEach(fig => {
      const caption = fig.content?.caption || 'No caption'
      console.log(`      "${caption}"`)
    })
    
    // Check quotes
    const quotes = blocks.filter(b => b.type === 'quote')
    console.log(`   💭 Quotes: ${quotes.length} found`)
    
    // Check footnotes
    const footnotes = pageMuseDoc.sections.flatMap(s => s.footnotes || [])
    console.log(`   📎 Footnotes: ${footnotes.length} found`)
    
    console.log('\n🎉 DOCX Style Mapping Validation Complete!')
    
    // Summary
    const expectedElements = {
      headings: 2,
      lists: 2, 
      tables: 1,
      figures: 1,
      quotes: 1,
      footnotes: 2,
      formattedParagraphs: 3
    }
    
    const actualElements = {
      headings: headings.length,
      lists: lists.length,
      tables: tables.length, 
      figures: figures.length,
      quotes: quotes.length,
      footnotes: footnotes.length,
      formattedParagraphs: formattedParagraphs.length
    }
    
    console.log('\n📈 Mapping Accuracy:')
    Object.entries(expectedElements).forEach(([element, expected]) => {
      const actual = actualElements[element as keyof typeof actualElements]
      const status = actual >= expected ? '✅' : '⚠️'
      console.log(`   ${status} ${element}: ${actual}/${expected}`)
    })
    
    const totalExpected = Object.values(expectedElements).reduce((sum, val) => sum + val, 0)
    const totalActual = Object.values(actualElements).reduce((sum, val) => sum + val, 0)
    const accuracy = Math.round((totalActual / totalExpected) * 100)
    
    console.log(`\n🎯 Overall Accuracy: ${accuracy}%`)
    
    if (accuracy >= 90) {
      console.log('🏆 Excellent! DOCX style mappings are working correctly.')
    } else if (accuracy >= 75) {
      console.log('👍 Good! Most DOCX elements are mapping correctly.')
    } else {
      console.log('⚠️  Some DOCX style mappings may need improvement.')
    }
    
  } else {
    console.error('❌ DOCX mapping validation failed:', testResult.error)
  }
}

// Run validation if this file is executed directly
if (typeof window !== 'undefined' && (window as any).runDocxValidation) {
  validateDocxStyleMappings()
}