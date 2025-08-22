import { SemanticDocument, Section, Flow, Block, createFlow, addBlockToFlow, addFlowToSection } from './document-model'

/**
 * Document Migration Utilities
 * Handles migration of documents to enforce schema rules
 */

export interface MigrationResult {
  document: SemanticDocument
  changesMade: boolean
  migrationLog: string[]
}

/**
 * Migrate document to ensure Flow Ownership Enforcement
 * Moves any orphaned blocks directly under sections to their main flow
 */
export function migrateFlowOwnership(document: SemanticDocument): MigrationResult {
  const migrationLog: string[] = []
  let changesMade = false
  let updatedDocument = { ...document }

  updatedDocument.sections = document.sections.map(section => {
    // Check if section has orphaned blocks (blocks property that shouldn't exist)
    const orphanedBlocks = (section as any).blocks as Block[] | undefined
    
    if (orphanedBlocks && Array.isArray(orphanedBlocks) && orphanedBlocks.length > 0) {
      changesMade = true
      
      // Find or create main flow
      let mainFlow = section.flows.find(f => f.name === 'Main' || f.name === 'Main Content')
      if (!mainFlow) {
        mainFlow = createFlow('Main', 'linear', 0)
        migrationLog.push(`Created Main flow in section "${section.name}"`)
      }
      
      // Move orphaned blocks to main flow
      let updatedFlow = mainFlow
      orphanedBlocks.forEach((block, index) => {
        // Ensure proper ordering
        const blockWithOrder = { ...block, order: mainFlow!.blocks.length + index }
        updatedFlow = addBlockToFlow(updatedFlow, blockWithOrder)
      })
      
      migrationLog.push(`Moved ${orphanedBlocks.length} blocks to Main flow in section "${section.name}"`)
      
      // Update section flows
      const updatedFlows = section.flows.some(f => f.id === updatedFlow.id)
        ? section.flows.map(f => f.id === updatedFlow.id ? updatedFlow : f)
        : [...section.flows, updatedFlow]
      
      // Clean section - remove blocks property
      const cleanSection = { ...section }
      delete (cleanSection as any).blocks
      
      return {
        ...cleanSection,
        flows: updatedFlows
      }
    }
    
    // Also ensure each section has at least one flow
    if (section.flows.length === 0) {
      changesMade = true
      const mainFlow = createFlow('Main', 'linear', 0)
      migrationLog.push(`Created default Main flow in empty section "${section.name}"`)
      
      return addFlowToSection(section, mainFlow)
    }
    
    return section
  })

  if (changesMade) {
    updatedDocument.updated_at = new Date().toISOString()
  }

  return {
    document: updatedDocument,
    changesMade,
    migrationLog
  }
}

/**
 * Ensure a section has a primary flow (creates "Main" if none exists)
 */
export function ensurePrimaryFlow(section: Section): { section: Section; flowCreated: boolean } {
  if (section.flows.length === 0) {
    const mainFlow = createFlow('Main', 'linear', 0)
    return {
      section: addFlowToSection(section, mainFlow),
      flowCreated: true
    }
  }
  
  return {
    section,
    flowCreated: false
  }
}

/**
 * Get primary flow from section (first flow, or create "Main" if none exists)
 */
export function getPrimaryFlow(section: Section): Flow {
  if (section.flows.length === 0) {
    return createFlow('Main', 'linear', 0)
  }
  
  // Return first flow, prioritizing "Main" or "Main Content" if it exists
  const mainFlow = section.flows.find(f => f.name === 'Main' || f.name === 'Main Content')
  return mainFlow || section.flows[0]
}

/**
 * Auto-migrate document when loaded to ensure compliance
 */
export function autoMigrateDocument(document: SemanticDocument): MigrationResult {
  // Run all migrations
  const flowOwnershipResult = migrateFlowOwnership(document)
  
  // Combine results (for future additional migrations)
  return {
    document: flowOwnershipResult.document,
    changesMade: flowOwnershipResult.changesMade,
    migrationLog: flowOwnershipResult.migrationLog
  }
}