-- Add new columns to templates table for canonical packaging
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS tpkg_source JSONB,
ADD COLUMN IF NOT EXISTS config JSONB,
ADD COLUMN IF NOT EXISTS tpkg_version TEXT DEFAULT '1',
ADD COLUMN IF NOT EXISTS compose_version TEXT,
ADD COLUMN IF NOT EXISTS packaged_at TIMESTAMPTZ;

-- Add CHECK constraint to prevent publishing templates without proper packaging
ALTER TABLE public.templates 
ADD CONSTRAINT templates_publish_guard 
CHECK (status <> 'published' OR (tpkg_source IS NOT NULL AND config IS NOT NULL));

-- Create partial index to find broken published templates quickly
CREATE INDEX IF NOT EXISTS templates_missing_pkg 
ON public.templates ((tpkg_source IS NULL OR config IS NULL)) 
WHERE status = 'published';