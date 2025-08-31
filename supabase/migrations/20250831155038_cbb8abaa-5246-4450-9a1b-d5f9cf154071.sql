-- Set published templates with missing packaging data to draft status
UPDATE public.templates 
SET status = 'draft' 
WHERE status = 'published' 
  AND (tpkg_source IS NULL OR config IS NULL);

-- Add CHECK constraint to prevent publishing templates without proper packaging
ALTER TABLE public.templates 
ADD CONSTRAINT templates_publish_guard 
CHECK (status <> 'published' OR (tpkg_source IS NOT NULL AND config IS NOT NULL));

-- Create partial index to find broken published templates quickly
CREATE INDEX IF NOT EXISTS templates_missing_pkg 
ON public.templates ((tpkg_source IS NULL OR config IS NULL)) 
WHERE status = 'published';