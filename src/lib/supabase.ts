import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://api.pagemuse.ai'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicnpmamVrYmZramF0aG90amNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1ODIxOTIsImV4cCI6MjA2NzE1ODE5Mn0.d96Oz9dS1nBffTdTzq33HZTVq0BJBy3Y3xmpvKgwCBI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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