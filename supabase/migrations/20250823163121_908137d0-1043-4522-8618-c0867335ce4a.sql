-- Remove duplicate templates (keep the newer entries)
-- First, let's identify and remove the duplicates created at 16:28:35
DELETE FROM public.templates 
WHERE created_at = '2025-08-23 16:28:35.634845+00:00';