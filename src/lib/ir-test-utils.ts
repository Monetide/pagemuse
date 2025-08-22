/**
 * Test utilities for IR system
 * Used to validate IR to PageMuse mapping
 */

import { IRDocument, validateIRDocument } from './ir-types'
import { mapIRToPageMuse } from './ir-mapper'
import { SemanticDocument } from './document-model'

// Mock IR document for testing
export const createMockIRDocument = (): IRDocument => ({
  title: "Test Document",
  sections: [
    {
      id: "test-section-1",
      title: "Test Section",
      order: 1,
      blocks: [
        {
          id: "test-block-1",
          type: "heading",
          order: 1,
          content: {
            level: 1,
            text: "Test Heading"
          }
        },
        {
          id: "test-block-2",
          type: "paragraph",
          order: 2,
          content: "This is a test paragraph."
        },
        {
          id: "test-block-3",
          type: "list",
          order: 3,
          content: {
            type: "unordered",
            items: [
              { content: "First item" },
              { content: "Second item" },
              { content: "Third item" }
            ]
          }
        }
      ],
      notes: []
    }
  ],
  metadata: {
    author: "Test Author",
    created: new Date('2024-01-01'),
    modified: new Date('2024-01-01'),
    tags: ["test"],
    description: "A test document"
  }
})

/**
 * Validates that an IR document can be successfully mapped to PageMuse
 */
export const testIRMapping = (irDoc: IRDocument): { success: boolean; error?: string; result?: SemanticDocument } => {
  try {
    // Validate IR structure
    if (!validateIRDocument(irDoc)) {
      return { success: false, error: "Invalid IR document structure" }
    }

    // Map to PageMuse
    const pageMuseDoc = mapIRToPageMuse(irDoc)

    // Basic validation of result
    if (!pageMuseDoc.id || !pageMuseDoc.title || !Array.isArray(pageMuseDoc.sections)) {
      return { success: false, error: "Invalid PageMuse document structure" }
    }

    // Validate sections have flows and blocks
    for (const section of pageMuseDoc.sections) {
      if (!Array.isArray(section.flows) || section.flows.length === 0) {
        return { success: false, error: `Section ${section.id} has no flows` }
      }

      for (const flow of section.flows) {
        if (!Array.isArray(flow.blocks)) {
          return { success: false, error: `Flow ${flow.id} has invalid blocks` }
        }
      }
    }

    return { success: true, result: pageMuseDoc }

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error during mapping" 
    }
  }
}

/**
 * Loads and tests an IR document from JSON
 */
export const testIRFromJSON = async (jsonContent: string): Promise<{ success: boolean; error?: string; result?: SemanticDocument }> => {
  try {
    const irDoc = JSON.parse(jsonContent) as IRDocument
    
    // Convert date strings back to Date objects if needed
    if (irDoc.metadata?.created && typeof irDoc.metadata.created === 'string') {
      irDoc.metadata.created = new Date(irDoc.metadata.created)
    }
    if (irDoc.metadata?.modified && typeof irDoc.metadata.modified === 'string') {
      irDoc.metadata.modified = new Date(irDoc.metadata.modified)
    }

    return testIRMapping(irDoc)
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "JSON parse error" 
    }
  }
}

/**
 * Console logger for IR test results
 */
export const logIRTestResult = (result: { success: boolean; error?: string; result?: SemanticDocument }) => {
  if (result.success && result.result) {
    console.log("✅ IR Mapping Test Successful")
    console.log("📄 Document:", result.result.title)
    console.log("📚 Sections:", result.result.sections.length)
    console.log("🔄 Total Flows:", result.result.sections.reduce((sum, s) => sum + s.flows.length, 0))
    console.log("📝 Total Blocks:", result.result.sections.reduce((sum, s) => 
      sum + s.flows.reduce((flowSum, f) => flowSum + f.blocks.length, 0), 0))
    
    // Log structure
    result.result.sections.forEach((section, idx) => {
      console.log(`  Section ${idx + 1}: ${section.name} (${section.flows.length} flows)`)
      section.flows.forEach((flow, flowIdx) => {
        console.log(`    Flow ${flowIdx + 1}: ${flow.name} (${flow.blocks.length} blocks)`)
        flow.blocks.forEach((block, blockIdx) => {
          const content = typeof block.content === 'string' 
            ? block.content.substring(0, 50) + (block.content.length > 50 ? '...' : '')
            : `[${block.type} content]`
          console.log(`      Block ${blockIdx + 1}: ${block.type} - ${content}`)
        })
      })
    })
  } else {
    console.log("❌ IR Mapping Test Failed")
    console.log("Error:", result.error)
  }
}

// Example usage:
// const testDoc = createMockIRDocument()
// const result = testIRMapping(testDoc)
// logIRTestResult(result)