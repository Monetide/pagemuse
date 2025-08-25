// DEPRECATED: This file contains unsafe credentials and should not be used
// Use @/integrations/supabase/client instead
// This re-export is provided for compatibility only

import { supabase as safeSupabaseClient } from "@/integrations/supabase/client";

export const supabase = safeSupabaseClient;

// Database types
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

export interface TemplatePage {
  id: string
  template_id: string
  page_index: number
  name: string
  layout_config: any
  page_styling: any
  content_scaffold: any
  created_at: string
}

export interface Document {
  id: string
  user_id: string
  template_id?: string
  title: string
  content: any[]
  styling_overrides: any
  created_at: string
  updated_at: string
}

export interface DocumentPage {
  id: string
  document_id: string
  page_index: number
  layout_config: any
  containers: any[]
  page_styling: any
  created_at: string
  updated_at: string
}