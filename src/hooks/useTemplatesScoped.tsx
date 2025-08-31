import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { useAuth } from '@/hooks/useAuth'
import { computeTemplateIntegrity, type TemplateIntegrity } from '@/lib/template-integrity'

export interface ScopedTemplate {
  id: string
  name: string
  description?: string
  category: string
  preview_image_url?: string
  figma_file_id?: string
  figma_node_id?: string
  is_premium: boolean
  user_id?: string
  global_styling: any
  metadata: any
  usage_count: number
  created_at: string
  updated_at: string
  scope: 'global' | 'workspace'
  workspace_id?: string
  template_slug: string
  tpkg_source?: any
  config?: any
  integrity: TemplateIntegrity
}

interface TemplateGroups {
  globalFeatured: ScopedTemplate[]
  globalAll: ScopedTemplate[]
  workspace: ScopedTemplate[]
}

export function useTemplatesScoped() {
  const [templates, setTemplates] = useState<TemplateGroups>({
    globalFeatured: [],
    globalAll: [],
    workspace: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { currentWorkspace } = useWorkspaceContext()
  const { user } = useAuth()

  const fetchTemplates = async () => {
    if (!user) {
      setError('User not authenticated')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch global templates (both new scope-based and legacy is_global)
      const { data: globalTemplates, error: globalError } = await supabase
        .from('templates')
        .select('*, tpkg_source, config')
        .or('and(scope.eq.global,status.eq.published),and(is_global.eq.true,status.eq.published)')
        .order('usage_count', { ascending: false })

      if (globalError) throw globalError

      // Fetch workspace templates if workspace is selected
      let workspaceTemplates: ScopedTemplate[] = []
      if (currentWorkspace?.id) {
        const { data: wsTemplates, error: wsError } = await supabase
          .from('templates')
          .select('*, tpkg_source, config')
          .eq('scope', 'workspace')
          .eq('workspace_id', currentWorkspace.id)
          .eq('status', 'published')
          .order('usage_count', { ascending: false })

        if (wsError) throw wsError
        workspaceTemplates = (wsTemplates || []).map(template => ({
          ...template,
          integrity: computeTemplateIntegrity(template)
        }))
      }

      // Group global templates by usage (featured = top 6) and compute integrity
      const sortedGlobal = (globalTemplates || []).map(template => ({
        ...template,
        integrity: computeTemplateIntegrity(template)
      }))
      const featured = sortedGlobal.slice(0, 6)
      const remaining = sortedGlobal.slice(6)

      setTemplates({
        globalFeatured: featured,
        globalAll: remaining,
        workspace: workspaceTemplates
      })
    } catch (err) {
      console.error('Error fetching templates:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [user, currentWorkspace?.id])

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates
  }
}