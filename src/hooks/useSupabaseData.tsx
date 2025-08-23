import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'

export interface Template {
  id: string
  name: string
  description?: string
  category: string
  preview_image_url?: string
  figma_file_id?: string
  figma_node_id?: string
  is_premium: boolean
  is_global: boolean
  user_id?: string
  global_styling: any
  metadata: any
  usage_count: number
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  template_id?: string | null
  title: string
  content: any
  styling_overrides: any
  created_at: string
  updated_at: string
  template?: {
    name: string
  } | null
}

export const useDocuments = () => {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = async () => {
    if (!user) {
      setDocuments([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          template:templates(name)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setDocuments(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [user])

  const refetch = () => {
    fetchDocuments()
  }

  const removeDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId))
  }

  const removeDocuments = (docIds: string[]) => {
    setDocuments(prev => prev.filter(doc => !docIds.includes(doc.id)))
  }

  const bulkDeleteDocuments = async (docIds: string[]) => {
    if (!user || docIds.length === 0) return { error: 'No documents selected' }

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('user_id', user.id)
        .in('id', docIds)

      if (error) throw error

      // Remove from local state
      removeDocuments(docIds)

      return { success: true }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to delete documents' }
    }
  }

  return { documents, loading, error, refetch, removeDocument, removeDocuments, bulkDeleteDocuments }
}

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // Import starter templates
        const { getAllStarterTemplates } = await import('@/lib/starter-templates')
        const starterTemplates = getAllStarterTemplates()
        
        // Convert to Supabase format for compatibility
        const convertedTemplates = starterTemplates.map(template => ({
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          preview_image_url: template.metadata.previewImage,
          figma_file_id: null,
          figma_node_id: null,
          is_premium: false,
          is_global: true,
          user_id: null,
          global_styling: {
            themeTokens: template.themeTokens,
            objectStyles: template.objectStyles
          },
          metadata: {
            ...template.metadata,
            template: template // Store full template for later use
          },
          usage_count: template.metadata.usageCount,
          created_at: template.createdAt.toISOString(),
          updated_at: template.updatedAt.toISOString()
        }))

        // Try to fetch from Supabase as well (for user templates)
        const { data: supabaseData } = await supabase
          .from('templates')
          .select('*')
          .eq('is_global', true)
          .order('usage_count', { ascending: false })
          .limit(10)

        // Combine starter templates with Supabase templates
        const allTemplates = [...convertedTemplates, ...(supabaseData || [])]
        setTemplates(allTemplates)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch templates')
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  return { templates, loading, error }
}

export const useUserStats = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalDocuments: 0,
    templatesUsed: 0,
    thisMonth: 0,
    hoursSaved: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setStats({ totalDocuments: 0, templatesUsed: 0, thisMonth: 0, hoursSaved: 0 })
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      try {
        // Get total documents count
        const { count: totalDocuments } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        // Get unique templates used
        const { data: templatesData } = await supabase
          .from('documents')
          .select('template_id')
          .eq('user_id', user.id)
          .not('template_id', 'is', null)

        const uniqueTemplates = new Set(templatesData?.map(d => d.template_id) || [])

        // Get documents created this month
        const thisMonth = new Date()
        thisMonth.setDate(1)
        thisMonth.setHours(0, 0, 0, 0)

        const { count: thisMonthCount } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', thisMonth.toISOString())

        setStats({
          totalDocuments: totalDocuments || 0,
          templatesUsed: uniqueTemplates.size,
          thisMonth: thisMonthCount || 0,
          hoursSaved: Math.floor((totalDocuments || 0) * 2.5) // Estimate 2.5 hours saved per document
        })
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  return { stats, loading }
}