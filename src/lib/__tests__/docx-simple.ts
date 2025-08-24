/**
 * Simple DOCX test for IR schema
 */

import { ingestDocx } from '../ingest-pipeline'

export async function testDocxIngestion() {
  console.log('Testing DOCX ingestion...')
  
  // Create a simple test file
  const content = `
    <h1>Test Document</h1>
    <p>This is a paragraph from a DOCX file.</p>
    <h2>Features</h2>
    <ul>
      <li>Heading extraction</li>
      <li>Paragraph processing</li>
      <li>List handling</li>
    </ul>
    <table>
      <tr><th>Feature</th><th>Status</th></tr>
      <tr><td>Headings</td><td>Working</td></tr>
      <tr><td>Tables</td><td>Working</td></tr>
    </table>
  `
  
  const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  const file = new File([blob], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  
  try {
    const result = await ingestDocx(file)
    
    console.log('✅ DOCX ingestion successful')
    console.log(`Document title: ${result.title}`)
    console.log(`Sections: ${result.sections.length}`)
    console.log(`Total blocks: ${result.sections.reduce((acc, section) => acc + section.blocks.length, 0)}`)
    
    return result
  } catch (error) {
    console.error('❌ DOCX ingestion failed:', error)
    throw error
  }
}

export function validateDocxResult(doc: any) {
  const validations = [
    { test: () => typeof doc.title === 'string', name: 'Has title' },
    { test: () => Array.isArray(doc.sections), name: 'Has sections array' },
    { test: () => doc.sections.length > 0, name: 'Has at least one section' },
    { test: () => doc.sections.every((s: any) => Array.isArray(s.blocks)), name: 'All sections have blocks array' },
    { test: () => doc.sections.some((s: any) => s.blocks.some((b: any) => b.type === 'heading')), name: 'Contains heading blocks' },
    { test: () => doc.sections.some((s: any) => s.blocks.some((b: any) => b.type === 'paragraph')), name: 'Contains paragraph blocks' },
    { test: () => doc.sections.some((s: any) => s.blocks.some((b: any) => b.type === 'list')), name: 'Contains list blocks' },
    { test: () => doc.sections.some((s: any) => s.blocks.some((b: any) => b.type === 'table')), name: 'Contains table blocks' }
  ]
  
  console.log('\n📋 DOCX Validation Results:')
  validations.forEach(validation => {
    const passed = validation.test()
    console.log(`${passed ? '✅' : '❌'} ${validation.name}`)
  })
  
  const passedCount = validations.filter(v => v.test()).length
  console.log(`\n📊 Score: ${passedCount}/${validations.length} validations passed`)
  
  return passedCount === validations.length
}