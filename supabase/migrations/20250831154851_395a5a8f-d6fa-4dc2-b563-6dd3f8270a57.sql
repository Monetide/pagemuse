-- First, add new columns to templates table for canonical packaging
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS tpkg_source JSONB,
ADD COLUMN IF NOT EXISTS config JSONB,
ADD COLUMN IF NOT EXISTS tpkg_version TEXT DEFAULT '1',
ADD COLUMN IF NOT EXISTS compose_version TEXT,
ADD COLUMN IF NOT EXISTS packaged_at TIMESTAMPTZ;