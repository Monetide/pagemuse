import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { SemanticDocument } from '@/lib/document-model'
import { ImportMode } from '@/components/import/ImportDialog'
import { IngestPipeline, convertToLegacyIR } from '@/lib/ingest-pipeline'
import { IRMapper } from '@/lib/ir-mapper'
import { PostImportCleaner, getDefaultCleanupOptions, CleanupOptions, CleanupResult } from '@/lib/post-import-cleaner'
import { IRDocument } from '@/lib/ir-types'
import { Template } from '@/hooks/useSupabaseData'
import { ImportHistoryManager, ImportWarning, importHistoryManager } from '@/lib/import-history'

export type SectionizationMode = 'h1' | 'h1-h2' | 'none'
export type CalloutMapping = 'quote' | 'callout'
export type ImportStage = 'idle' | 'ingesting' | 'mapping' | 'complete'

export interface MappingConfig {
  mode: ImportMode
  template?: Template
  sectionization: SectionizationMode
  tocDepth: number
  calloutMapping: CalloutMapping
  linkVsCopy: 'link' | 'copy'
  cleanupOptions?: CleanupOptions
}

export interface AssetInfo {
  id: string
  filename: string
  mimeType: string
  url: string
  alt?: string
  caption?: string
  sourceFilename?: string
  documentId?: string
}

export interface ImportState {
  stage: ImportStage
  file: File | null
  irDocument: IRDocument | null
  mappedDocument: SemanticDocument | null
  cleanupResult: CleanupResult | null
  assets: AssetInfo[]
  config: MappingConfig
  error: string | null
  isProcessing: boolean
  importStartTime: number
}

export const useImport = () => {
  const [state, setState] = useState<ImportState>({
    stage: 'idle',
    file: null,
    irDocument: null,
    mappedDocument: null,
    cleanupResult: null,
    assets: [],
    config: {
      mode: 'new-document',
      sectionization: 'h1',
      tocDepth: 3,
      calloutMapping: 'callout',
      linkVsCopy: 'copy'
    },
    error: null,
    isProcessing: false,
    importStartTime: 0
  })

  const { toast } = useToast()

  const startImport = useCallback(async (file: File) => {
    const startTime = Date.now()
    setState(prev => ({ 
      ...prev, 
      stage: 'ingesting', 
      file, 
      error: null,
      isProcessing: true,
      importStartTime: startTime
    }))

    try {
      // Step 1: Ingest file to IR
      const irDocument = await IngestPipeline.processFile(file, {
        preserveFormatting: true,
        extractAssets: true,
        generateAnchors: true
      })

      // Step 2: Process assets (simplified without AssetManager)
      const processedAssets: AssetInfo[] = []

      // Extract assets from IR blocks if needed  
      for (const section of irDocument.sections) {
        for (const block of section.blocks) {
          if (block.type === 'figure' && block.content) {
            const figureContent = block.content as any;
            processedAssets.push({
              id: `asset-${Date.now()}`,
              filename: 'image',
              mimeType: 'image/jpeg',
              url: figureContent.image?.url || '',
              alt: figureContent.alt || '',
              caption: figureContent.caption || '',
              sourceFilename: file.name,
              documentId: undefined
            })
          }
        }
      }

      // Step 3: Set default cleanup options based on file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      const sourceType = fileExtension === 'pdf' ? 'pdf' : 
                        fileExtension === 'docx' ? 'docx' : 
                        fileExtension === 'md' ? 'markdown' : 'text'
      
      const defaultCleanupOptions = getDefaultCleanupOptions(sourceType)

      // IRDocument is already in the correct legacy format for ir-mapper
      
      setState(prev => ({ 
        ...prev, 
        irDocument,
        assets: processedAssets,
        config: {
          ...prev.config,
          cleanupOptions: defaultCleanupOptions
        },
        stage: 'mapping',
        isProcessing: false
      }))

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to import file',
        isProcessing: false
      }))
    }
  }, [state.config.linkVsCopy])

  const finalizeMapping = useCallback(async (
    config: MappingConfig,
    beforeDocument?: SemanticDocument | null,
    documentId?: string
  ): Promise<SemanticDocument> => {
    if (!state.irDocument) {
      throw new Error('No IR document available')
    }

    setState(prev => ({ ...prev, isProcessing: true }))

    try {
      // Apply configuration to IR document
      const configuredIR = applyMappingConfig(state.irDocument, config)
      
      // Map to semantic document
      const mapper = new IRMapper()
      let semanticDoc = mapper.mapDocument(configuredIR)

      // Apply post-import cleanups
      let cleanupResult: CleanupResult | null = null
      const warnings: ImportWarning[] = []
      
      if (config.cleanupOptions) {
        const cleaner = new PostImportCleaner(config.cleanupOptions)
        cleanupResult = cleaner.cleanDocument(semanticDoc)
        semanticDoc = cleanupResult.document
        
        // Convert cleanup changes to warnings if needed
        const textCleanupChanges = cleanupResult.changes.filter(c => c.type === 'text-cleanup')
        if (textCleanupChanges.length > 0) {
          warnings.push({
            type: 'formatting-loss',
            message: `Applied ${textCleanupChanges.length} text cleanup operations`,
            severity: 'low'
          })
        }
      }

      // Create import commit if documentId is provided
      if (documentId && state.file) {
        const processingTimeMs = Date.now() - state.importStartTime
        
        const importSummary = ImportHistoryManager.generateSummary(
          documentId,
          state.file,
          beforeDocument,
          semanticDoc,
          config,
          processingTimeMs,
          warnings
        )

        importHistoryManager.createCommit(
          documentId,
          beforeDocument,
          semanticDoc,
          importSummary
        )

        toast({
          title: 'Import completed successfully',
          description: `${importSummary.sectionsCreated} sections, ${importSummary.blocksCreated} blocks created${warnings.length > 0 ? ` (${warnings.length} warnings)` : ''}`
        })
      }

      setState(prev => ({ 
        ...prev, 
        mappedDocument: semanticDoc,
        cleanupResult,
        config,
        isProcessing: false
      }))

      return semanticDoc
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to finalize mapping',
        isProcessing: false
      }))
      throw error
    }
  }, [state.irDocument, state.file, state.importStartTime, toast])

  const updateConfig = useCallback((updates: Partial<MappingConfig>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...updates }
    }))
  }, [])

  const reset = useCallback(() => {
    setState({
      stage: 'idle',
      file: null,
      irDocument: null,
      mappedDocument: null,
      cleanupResult: null,
      assets: [],
      config: {
        mode: 'new-document',
        sectionization: 'h1',
        tocDepth: 3,
        calloutMapping: 'callout',
        linkVsCopy: 'copy'
      },
      error: null,
      isProcessing: false,
      importStartTime: 0
    })
  }, [])

  return {
    state,
    actions: {
      startImport,
      finalizeMapping,
      updateConfig,
      reset
    },
    // Backward compatibility with existing Dashboard usage
    importFiles: async (
      files: File[], 
      mode: ImportMode,
      currentDocument?: SemanticDocument,
      onCreateDocument?: (title: string, document: SemanticDocument) => void,
      onUpdateDocument?: (updatedDocument: SemanticDocument) => void
    ) => {
      if (files.length > 0) {
        await startImport(files[0])
      }
    },
    isImporting: state.isProcessing,
    PDFDialog: () => null, // Placeholder for backward compatibility
    MappingWizard: () => null // Placeholder for backward compatibility
  }
}

// Helper function to apply mapping configuration to IR document
function applyMappingConfig(irDocument: IRDocument, config: MappingConfig): IRDocument {
  // This is a simplified implementation
  // In a real implementation, this would apply the sectionization rules,
  // TOC settings, callout mapping, etc. to transform the IR document
  
  const configuredIR = { ...irDocument }
  
  // Apply callout mapping
  if (config.calloutMapping === 'quote') {
    configuredIR.sections = configuredIR.sections.map(section => ({
      ...section,
      blocks: section.blocks.map(block => {
        if (block.type === 'callout') {
          return {
            ...block,
            type: 'quote' as any,
            content: {
              content: block.content?.content || block.content,
              citation: undefined
            }
          }
        }
        return block
      })
    }))
  } else if (config.calloutMapping === 'callout') {
    configuredIR.sections = configuredIR.sections.map(section => ({
      ...section,
      blocks: section.blocks.map(block => {
        if (block.type === 'quote' && !block.content?.citation) {
          return {
            ...block,
            type: 'callout' as any,
            content: {
              type: 'note',
              title: 'Note',
              content: block.content?.content || block.content
            }
          }
        }
        return block
      })
    }))
  }
  
  return configuredIR
}