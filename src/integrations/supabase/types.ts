export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      asset_references: {
        Row: {
          block_id: string | null
          created_at: string
          document_id: string | null
          id: string
          media_id: string
          metadata: Json | null
          reference_type: string
          updated_at: string
        }
        Insert: {
          block_id?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          media_id: string
          metadata?: Json | null
          reference_type?: string
          updated_at?: string
        }
        Update: {
          block_id?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          media_id?: string
          metadata?: Json | null
          reference_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_references_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_themes: {
        Row: {
          accent_color: string
          created_at: string
          description: string | null
          font_primary: string
          font_secondary: string
          id: string
          name: string
          primary_color: string
          secondary_color: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color: string
          created_at?: string
          description?: string | null
          font_primary: string
          font_secondary: string
          id?: string
          name: string
          primary_color: string
          secondary_color: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string
          created_at?: string
          description?: string | null
          font_primary?: string
          font_secondary?: string
          id?: string
          name?: string
          primary_color?: string
          secondary_color?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      design_principles: {
        Row: {
          category: string
          category_id: string | null
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          category_id?: string | null
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          category_id?: string | null
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_principles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      document_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          document_id: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          document_id: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          document_id?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_activities_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by_user_id: string | null
          created_at: string
          document_id: string
          email: string
          expires_at: string
          id: string
          invited_by_user_id: string
          role: Database["public"]["Enums"]["document_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          created_at?: string
          document_id: string
          email: string
          expires_at?: string
          id?: string
          invited_by_user_id: string
          role?: Database["public"]["Enums"]["document_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          created_at?: string
          document_id?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by_user_id?: string
          role?: Database["public"]["Enums"]["document_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_invitations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_pages: {
        Row: {
          containers: Json | null
          created_at: string
          document_id: string
          id: string
          layout_config: Json | null
          page_index: number
          page_styling: Json | null
          updated_at: string
        }
        Insert: {
          containers?: Json | null
          created_at?: string
          document_id: string
          id?: string
          layout_config?: Json | null
          page_index: number
          page_styling?: Json | null
          updated_at?: string
        }
        Update: {
          containers?: Json | null
          created_at?: string
          document_id?: string
          id?: string
          layout_config?: Json | null
          page_index?: number
          page_styling?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_pages_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_shares: {
        Row: {
          created_at: string
          document_id: string
          expires_at: string | null
          id: string
          role: Database["public"]["Enums"]["document_role"]
          shared_by_user_id: string
          shared_with_user_id: string
          status: Database["public"]["Enums"]["share_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id: string
          expires_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["document_role"]
          shared_by_user_id: string
          shared_with_user_id: string
          status?: Database["public"]["Enums"]["share_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          expires_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["document_role"]
          shared_by_user_id?: string
          shared_with_user_id?: string
          status?: Database["public"]["Enums"]["share_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          content: Json
          created_at: string
          created_by: string
          document_id: string
          id: string
          metadata: Json | null
          snapshot_name: string | null
          title: string
          version_number: number
          version_type: string
        }
        Insert: {
          content: Json
          created_at?: string
          created_by: string
          document_id: string
          id?: string
          metadata?: Json | null
          snapshot_name?: string | null
          title: string
          version_number: number
          version_type?: string
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string
          document_id?: string
          id?: string
          metadata?: Json | null
          snapshot_name?: string | null
          title?: string
          version_number?: number
          version_type?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          archived: boolean | null
          content: Json | null
          created_at: string
          deleted_at: string | null
          folder_path: string | null
          id: string
          starred: boolean | null
          styling_overrides: Json | null
          tags: string[] | null
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          archived?: boolean | null
          content?: Json | null
          created_at?: string
          deleted_at?: string | null
          folder_path?: string | null
          id?: string
          starred?: boolean | null
          styling_overrides?: Json | null
          tags?: string[] | null
          template_id?: string | null
          title: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          archived?: boolean | null
          content?: Json | null
          created_at?: string
          deleted_at?: string | null
          folder_path?: string | null
          id?: string
          starred?: boolean | null
          styling_overrides?: Json | null
          tags?: string[] | null
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt_text: string | null
          created_at: string
          credit: string | null
          description: string | null
          display_name: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          height: number | null
          id: string
          license: string | null
          tags: string[] | null
          updated_at: string
          usage_count: number | null
          user_id: string
          width: number | null
          workspace_id: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          credit?: string | null
          description?: string | null
          display_name: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          height?: number | null
          id?: string
          license?: string | null
          tags?: string[] | null
          updated_at?: string
          usage_count?: number | null
          user_id: string
          width?: number | null
          workspace_id?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          credit?: string | null
          description?: string | null
          display_name?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          height?: number | null
          id?: string
          license?: string | null
          tags?: string[] | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string
          width?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      media_collection_items: {
        Row: {
          added_at: string
          collection_id: string
          id: string
          media_id: string
        }
        Insert: {
          added_at?: string
          collection_id: string
          id?: string
          media_id: string
        }
        Update: {
          added_at?: string
          collection_id?: string
          id?: string
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "media_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_collection_items_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      media_collections: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_brand_assets: boolean | null
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_brand_assets?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_brand_assets?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_collections_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "media_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      media_versions: {
        Row: {
          created_at: string
          created_by: string
          file_name: string
          file_path: string
          file_size: number
          height: number | null
          id: string
          media_id: string
          version_number: number
          width: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          file_name: string
          file_path: string
          file_size: number
          height?: number | null
          id?: string
          media_id: string
          version_number: number
          width?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          file_name?: string
          file_path?: string
          file_size?: number
          height?: number | null
          id?: string
          media_id?: string
          version_number?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_versions_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      published_documents: {
        Row: {
          content: Json
          document_id: string
          id: string
          is_current: boolean
          metadata: Json | null
          public_url_token: string
          published_at: string
          published_by_user_id: string
          title: string
          version_number: number
        }
        Insert: {
          content: Json
          document_id: string
          id?: string
          is_current?: boolean
          metadata?: Json | null
          public_url_token?: string
          published_at?: string
          published_by_user_id: string
          title: string
          version_number?: number
        }
        Update: {
          content?: Json
          document_id?: string
          id?: string
          is_current?: boolean
          metadata?: Json | null
          public_url_token?: string
          published_at?: string
          published_by_user_id?: string
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "published_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      share_links: {
        Row: {
          allow_download: boolean
          created_at: string
          created_by_user_id: string
          document_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_views: number | null
          password_hash: string | null
          role: Database["public"]["Enums"]["document_role"]
          token: string
          updated_at: string
          view_count: number
          watermark_text: string | null
        }
        Insert: {
          allow_download?: boolean
          created_at?: string
          created_by_user_id: string
          document_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_views?: number | null
          password_hash?: string | null
          role?: Database["public"]["Enums"]["document_role"]
          token?: string
          updated_at?: string
          view_count?: number
          watermark_text?: string | null
        }
        Update: {
          allow_download?: boolean
          created_at?: string
          created_by_user_id?: string
          document_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_views?: number | null
          password_hash?: string | null
          role?: Database["public"]["Enums"]["document_role"]
          token?: string
          updated_at?: string
          view_count?: number
          watermark_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      template_pages: {
        Row: {
          content_scaffold: Json | null
          created_at: string
          id: string
          layout_config: Json | null
          name: string
          page_index: number
          page_styling: Json | null
          template_id: string
        }
        Insert: {
          content_scaffold?: Json | null
          created_at?: string
          id?: string
          layout_config?: Json | null
          name: string
          page_index: number
          page_styling?: Json | null
          template_id: string
        }
        Update: {
          content_scaffold?: Json | null
          created_at?: string
          id?: string
          layout_config?: Json | null
          name?: string
          page_index?: number
          page_styling?: Json | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_pages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          figma_file_id: string | null
          figma_node_id: string | null
          global_styling: Json | null
          id: string
          is_global: boolean
          is_premium: boolean
          metadata: Json | null
          name: string
          preview_image_url: string | null
          status: string | null
          tpkg_source: Json | null
          updated_at: string
          usage_count: number
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          figma_file_id?: string | null
          figma_node_id?: string | null
          global_styling?: Json | null
          id?: string
          is_global?: boolean
          is_premium?: boolean
          metadata?: Json | null
          name: string
          preview_image_url?: string | null
          status?: string | null
          tpkg_source?: Json | null
          updated_at?: string
          usage_count?: number
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          figma_file_id?: string | null
          figma_node_id?: string | null
          global_styling?: Json | null
          id?: string
          is_global?: boolean
          is_premium?: boolean
          metadata?: Json | null
          name?: string
          preview_image_url?: string | null
          status?: string | null
          tpkg_source?: Json | null
          updated_at?: string
          usage_count?: number
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workspace_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          user_id: string
          workspace_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by_user_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by_user_id: string
          role: Database["public"]["Enums"]["workspace_role"]
          token: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by_user_id: string
          role?: Database["public"]["Enums"]["workspace_role"]
          token?: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by_user_id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string
          default_brand_kit_id: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          default_brand_kit_id?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          default_brand_kit_id?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_workspace_invitation: {
        Args: { invitation_token: string }
        Returns: Json
      }
      create_document_version: {
        Args: {
          p_content: Json
          p_document_id: string
          p_snapshot_name?: string
          p_title: string
          p_version_type?: string
        }
        Returns: string
      }
      ensure_personal_workspace: {
        Args: { target_user_id: string }
        Returns: string
      }
      generate_workspace_slug: {
        Args: { base_name: string }
        Returns: string
      }
      get_folder_hierarchy: {
        Args: { folder_id: string }
        Returns: {
          id: string
          level: number
          name: string
          path: string
        }[]
      }
      get_next_media_version: {
        Args: { media_uuid: string }
        Returns: number
      }
      get_next_version_number: {
        Args: { doc_id: string }
        Returns: number
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_document_permission: {
        Args: {
          _document_id: string
          _required_role: Database["public"]["Enums"]["document_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_workspace_admin: {
        Args: { p_user_id?: string; p_workspace_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { p_user_id?: string; p_workspace_id: string }
        Returns: boolean
      }
      log_document_activity: {
        Args: {
          _activity_type: string
          _description: string
          _document_id: string
          _metadata?: Json
          _user_id: string
        }
        Returns: string
      }
      update_media_usage_count: {
        Args: { media_uuid: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "user" | "admin"
      document_role: "owner" | "editor" | "commenter" | "viewer"
      share_status: "pending" | "accepted" | "declined"
      workspace_role: "owner" | "admin" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "admin"],
      document_role: ["owner", "editor", "commenter", "viewer"],
      share_status: ["pending", "accepted", "declined"],
      workspace_role: ["owner", "admin", "member"],
    },
  },
} as const
