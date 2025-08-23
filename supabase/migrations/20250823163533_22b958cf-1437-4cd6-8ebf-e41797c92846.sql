-- Reset all template usage counts to 0
UPDATE public.templates 
SET usage_count = 0
WHERE usage_count > 0;