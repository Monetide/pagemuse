import { trackTemplateOpened, trackTemplateSelected } from '@/lib/analytics'

export interface TemplateIntegrity {
  hasPkg: boolean
  hasConfig: boolean
  hasPreviews: boolean
  hasAssets: boolean
  isComplete: boolean
  reason?: string
}

export function computeTemplateIntegrity(template: any): TemplateIntegrity {
  const hasPkg = !!(template.tpkg_source && Object.keys(template.tpkg_source).length > 0)
  const hasConfig = !!(template.config && Object.keys(template.config).length > 0)
  const hasPreviews = !!template.preview_image_url
  const hasAssets = !!(template.tpkg_source?.assets && template.tpkg_source.assets.length > 0)
  
  const isComplete = hasPkg && hasConfig
  let reason: string | undefined
  
  if (!hasPkg && !hasConfig) {
    reason = "Template not packaged yet — ask admin to republish"
  } else if (!hasPkg) {
    reason = "Template package missing — ask admin to republish" 
  } else if (!hasConfig) {
    reason = "Template configuration missing — ask admin to republish"
  }

  return {
    hasPkg,
    hasConfig,
    hasPreviews,
    hasAssets,
    isComplete,
    reason
  }
}

export function emitTemplateOpenAnalytics(templateId: string, scope: 'global' | 'workspace', workspaceId?: string) {
  trackTemplateOpened(templateId, { scope }, workspaceId)
}

export function emitTemplateSelectAnalytics(templateId: string, scope: 'global' | 'workspace', workspaceId?: string, docId?: string) {
  trackTemplateSelected(templateId, { scope }, workspaceId, docId)
}