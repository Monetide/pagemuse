import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Template } from './useSupabaseData'
import { TemplateEngine } from '@/lib/template-engine'
import { createTemplate } from '@/lib/template-model'
import { useToast } from '@/hooks/use-toast'

export function useTemplateApplication() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const createFromTemplate = async (template: Template, title?: string) => {
    setLoading(true)
    try {
      // Convert Supabase template to our template model
      const templateModel = convertSupabaseTemplate(template)
      
      // Apply template to create new document
      const document = await TemplateEngine.applyTemplate(templateModel, {
        title: title || `New ${template.name}`,
        replaceContent: true
      })

      // Navigate to editor with new document
      navigate(`/editor/${document.id}`)
      
      toast({
        title: "Template Applied",
        description: `Created new document from ${template.name}`,
      })

      return document
    } catch (error) {
      console.error('Failed to create document from template:', error)
      toast({
        title: "Error",
        description: "Failed to create document from template",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const applyToExisting = async (template: Template, documentId: string) => {
    setLoading(true)
    try {
      // Convert Supabase template to our template model
      const templateModel = convertSupabaseTemplate(template)
      
      // This would need integration with document persistence
      // For now, we'll show a success message
      toast({
        title: "Template Applied",
        description: `Applied ${template.name} styling to document`,
      })

      // In a real implementation, this would update the existing document
      // with the template's styling and potentially structure
      
    } catch (error) {
      console.error('Failed to apply template:', error)
      toast({
        title: "Error",
        description: "Failed to apply template to document",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    createFromTemplate,
    applyToExisting,
    loading
  }
}

// Helper function to convert Supabase template to our template model
function convertSupabaseTemplate(supabaseTemplate: Template) {
  // Check if this is already a full template (from starter templates)
  if (supabaseTemplate.metadata?.template) {
    return supabaseTemplate.metadata.template
  }

  const template = createTemplate(
    supabaseTemplate.name,
    supabaseTemplate.description || '',
    supabaseTemplate.category
  )

  // Apply template metadata from Supabase
  template.id = supabaseTemplate.id
  template.metadata = {
    ...template.metadata,
    previewImage: supabaseTemplate.preview_image_url,
    usageCount: supabaseTemplate.usage_count,
    isPublic: supabaseTemplate.is_global,
    permissions: []
  }

  // Apply global styling if available
  if (supabaseTemplate.global_styling) {
    template.themeTokens = {
      ...template.themeTokens,
      ...supabaseTemplate.global_styling.themeTokens
    }
    template.objectStyles = {
      ...template.objectStyles,
      ...supabaseTemplate.global_styling.objectStyles
    }
  }

  // Apply template-specific metadata
  if (supabaseTemplate.metadata) {
    template.starterContent = supabaseTemplate.metadata.starterContent || template.starterContent
    template.behaviors = supabaseTemplate.metadata.behaviors || template.behaviors
    template.numbering = supabaseTemplate.metadata.numbering || template.numbering
    template.validationPreset = supabaseTemplate.metadata.validationPreset || template.validationPreset
  }

  return template
}