-- Create storage bucket for TPKG assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'template-assets',
  'template-assets', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
);

-- Create RLS policies for template assets
CREATE POLICY "Anyone can view template assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'template-assets');

CREATE POLICY "Admins can upload template assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'template-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update template assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'template-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete template assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'template-assets' AND has_role(auth.uid(), 'admin'));

-- Add TPKG-specific fields to templates table
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS tpkg_source jsonb,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'));

-- Update existing templates to have published status
UPDATE public.templates SET status = 'published' WHERE status IS NULL;