import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

export interface MediaFile {
  id: string
  user_id: string
  display_name: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  width?: number
  height?: number
  tags: string[]
  description?: string
  credit?: string
  license?: string
  alt_text?: string
  usage_count: number
  created_at: string
  updated_at: string
}

export interface MediaCollection {
  id: string
  user_id: string
  name: string
  description?: string
  is_brand_assets: boolean
  color: string
  parent_id?: string
  created_at: string
  updated_at: string
  media_count?: number
}

export interface MediaVersion {
  id: string
  media_id: string
  version_number: number
  file_path: string
  file_name: string
  file_size: number
  width?: number
  height?: number
  created_at: string
  created_by: string
}

export interface UploadProgress {
  file: File
  progress: number
  status: 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
  mediaId?: string
}

export const useMediaLibrary = () => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [collections, setCollections] = useState<MediaCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])

  // Fetch media files
  const fetchMediaFiles = useCallback(async (collectionId?: string) => {
    try {
      setLoading(true)
      
      if (collectionId) {
        // Get media IDs from collection first
        const { data: collectionItems, error: collectionError } = await supabase
          .from('media_collection_items')
          .select('media_id')
          .eq('collection_id', collectionId)

        if (collectionError) throw collectionError

        const mediaIds = collectionItems?.map(item => item.media_id) || []
        
        if (mediaIds.length === 0) {
          setMediaFiles([])
          return
        }

        const { data, error } = await supabase
          .from('media')
          .select('*')
          .in('id', mediaIds)
          .order('created_at', { ascending: false })

        if (error) throw error
        setMediaFiles(data || [])
      } else {
        const { data, error } = await supabase
          .from('media')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setMediaFiles(data || [])
      }
    } catch (error: any) {
      toast({
        title: "Error loading media files",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch collections
  const fetchCollections = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('media_collections')
        .select('*')
        .order('is_brand_assets', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Get media count for each collection
      const collectionsWithCount = await Promise.all(
        (data || []).map(async (collection) => {
          const { count } = await supabase
            .from('media_collection_items')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', collection.id)

          return {
            ...collection,
            media_count: count || 0
          }
        })
      )
      
      setCollections(collectionsWithCount)
    } catch (error: any) {
      toast({
        title: "Error loading collections",
        description: error.message,
        variant: "destructive"
      })
    }
  }, [])

  // Upload files with progress tracking
  const uploadFiles = useCallback(async (files: File[]) => {
    const uploadItems: UploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }))
    
    setUploadProgress(uploadItems)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        // Update progress to uploading
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { ...item, status: 'uploading' } : item
        ))

        // Generate unique file path
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        // Update progress to processing
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { ...item, status: 'processing', progress: 80 } : item
        ))

        // Get image dimensions for images
        let width, height
        if (file.type.startsWith('image/')) {
          const dimensions = await getImageDimensions(file)
          width = dimensions.width
          height = dimensions.height
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        // Create media record
        const { data: mediaData, error: mediaError } = await supabase
          .from('media')
          .insert({
            user_id: user.id,
            display_name: file.name.split('.').slice(0, -1).join('.'),
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            width,
            height,
            alt_text: file.name.split('.').slice(0, -1).join('.') // Default alt text
          })
          .select()
          .single()

        if (mediaError) throw mediaError

        // Update progress to complete
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { 
            ...item, 
            status: 'complete', 
            progress: 100, 
            mediaId: mediaData.id 
          } : item
        ))

        toast({
          title: "Upload successful",
          description: `${file.name} has been uploaded.`
        })

      } catch (error: any) {
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { 
            ...item, 
            status: 'error', 
            error: error.message 
          } : item
        ))

        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}: ${error.message}`,
          variant: "destructive"
        })
      }
    }

    // Clear progress after delay
    setTimeout(() => {
      setUploadProgress([])
      fetchMediaFiles() // Refresh media files
    }, 2000)
  }, [fetchMediaFiles])

  // Update media metadata
  const updateMediaMetadata = useCallback(async (
    id: string, 
    metadata: Partial<Pick<MediaFile, 'display_name' | 'tags' | 'description' | 'credit' | 'license' | 'alt_text'>>
  ) => {
    try {
      const { error } = await supabase
        .from('media')
        .update(metadata)
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Media updated",
        description: "Metadata has been updated successfully."
      })

      fetchMediaFiles()
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      })
    }
  }, [fetchMediaFiles])

  // Delete media file
  const deleteMediaFile = useCallback(async (id: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([filePath])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('media')
        .delete()
        .eq('id', id)

      if (dbError) throw dbError

      toast({
        title: "Media deleted",
        description: "File has been deleted successfully."
      })

      fetchMediaFiles()
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      })
    }
  }, [fetchMediaFiles])

  // Create collection
  const createCollection = useCallback(async (
    name: string, 
    description?: string, 
    isBrandAssets: boolean = false,
    color: string = '#6366f1'
  ) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('media_collections')
        .insert({
          user_id: user.id,
          name,
          description,
          is_brand_assets: isBrandAssets,
          color
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Collection created",
        description: `${name} collection has been created.`
      })

      fetchCollections()
      return data
    } catch (error: any) {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive"
      })
    }
  }, [fetchCollections])

  // Add media to collection
  const addToCollection = useCallback(async (mediaId: string, collectionId: string) => {
    try {
      const { error } = await supabase
        .from('media_collection_items')
        .insert({
          media_id: mediaId,
          collection_id: collectionId
        })

      if (error) throw error

      toast({
        title: "Added to collection",
        description: "Media has been added to the collection."
      })

      fetchCollections()
    } catch (error: any) {
      toast({
        title: "Failed to add",
        description: error.message,
        variant: "destructive"
      })
    }
  }, [fetchCollections])

  // Get public URL for media file
  const getMediaUrl = useCallback((filePath: string) => {
    const { data } = supabase.storage
      .from('media')
      .getPublicUrl(filePath)
    
    return data.publicUrl
  }, [])

  // Helper function to get image dimensions
  const getImageDimensions = (file: File): Promise<{width: number, height: number}> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.onerror = () => {
        resolve({ width: 0, height: 0 })
      }
      img.src = URL.createObjectURL(file)
    })
  }

  // Initialize
  useEffect(() => {
    fetchMediaFiles()
    fetchCollections()
  }, [fetchMediaFiles, fetchCollections])

  return {
    mediaFiles,
    collections,
    loading,
    uploadProgress,
    fetchMediaFiles,
    fetchCollections,
    uploadFiles,
    updateMediaMetadata,
    deleteMediaFile,
    createCollection,
    addToCollection,
    getMediaUrl
  }
}