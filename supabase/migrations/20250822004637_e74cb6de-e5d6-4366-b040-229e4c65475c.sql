-- Remove the figures bucket since we'll use the existing media bucket
DELETE FROM storage.buckets WHERE id = 'figures';

-- Update RLS policies to ensure media bucket supports figure uploads
-- (These may already exist, but we'll ensure they're correct)

-- Allow public read access to media bucket
CREATE POLICY IF NOT EXISTS "Anyone can view media files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'media');

-- Allow authenticated users to upload to media bucket  
CREATE POLICY IF NOT EXISTS "Authenticated users can upload media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Allow users to update their own files in media bucket
CREATE POLICY IF NOT EXISTS "Users can update their own media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files in media bucket
CREATE POLICY IF NOT EXISTS "Users can delete their own media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);