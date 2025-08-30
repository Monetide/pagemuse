import { supabase } from '@/integrations/supabase/client'

export interface CreateFromTemplateParams {
  templateId: string
  title?: string
  workspaceId: string
}

export interface CreateFromTemplateResponse {
  docId: string
  url: string
}

export class DocumentService {
  static async createFromTemplate(params: CreateFromTemplateParams): Promise<CreateFromTemplateResponse> {
    const { templateId, title, workspaceId } = params

    try {
      const response = await fetch(`/api/w/${workspaceId}/documents/from-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          templateId,
          title
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to create document from template: ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating document from template:', error)
      throw error
    }
  }

  static async createFromTemplateViaFunction(params: CreateFromTemplateParams): Promise<CreateFromTemplateResponse> {
    const { templateId, title, workspaceId } = params

    try {
      const { data, error } = await supabase.functions.invoke('create-document-from-template', {
        body: {
          templateId,
          title,
          workspaceId
        }
      })

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error creating document from template via function:', error)
      throw error
    }
  }
}