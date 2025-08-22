import { useEffect, useRef } from 'react'
import { useValidation } from '@/contexts/ValidationContext'
import { useDocumentModel } from '@/hooks/useDocumentModel'
import { SemanticDocument } from '@/lib/document-model'

interface UseAutoValidationOptions {
  enabled?: boolean
  debounceMs?: number
  triggerOnMount?: boolean
}

export const useAutoValidation = (options: UseAutoValidationOptions = {}) => {
  const {
    enabled = true,
    debounceMs = 1000,
    triggerOnMount = false
  } = options

  const { config, runValidation } = useValidation()
  const { document } = useDocumentModel()
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastDocumentRef = useRef<SemanticDocument | null>(null)

  useEffect(() => {
    if (!enabled || !config.autoRunOnChanges || !document) {
      return
    }

    // Check if document has actually changed
    const documentChanged = !lastDocumentRef.current || 
      JSON.stringify(document) !== JSON.stringify(lastDocumentRef.current)

    if (!documentChanged && !triggerOnMount) {
      return
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout for debounced validation
    timeoutRef.current = setTimeout(() => {
      runValidation(document)
      lastDocumentRef.current = JSON.parse(JSON.stringify(document))
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [document, enabled, config.autoRunOnChanges, debounceMs, triggerOnMount, runValidation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
}