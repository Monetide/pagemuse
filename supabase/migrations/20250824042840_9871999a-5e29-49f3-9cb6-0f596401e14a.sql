-- Add defaultBrandKitId field to workspaces table
ALTER TABLE public.workspaces 
ADD COLUMN default_brand_kit_id uuid DEFAULT NULL;