-- Fix search_path security issue for the generate_workspace_slug function
CREATE OR REPLACE FUNCTION public.generate_workspace_slug(base_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result_slug TEXT;
  counter INTEGER := 0;
BEGIN
  result_slug := lower(regexp_replace(base_name, '[^a-zA-Z0-9]+', '-', 'g'));
  result_slug := trim(both '-' from result_slug);
  
  WHILE EXISTS (SELECT 1 FROM public.workspaces WHERE workspaces.slug = result_slug) LOOP
    counter := counter + 1;
    result_slug := lower(regexp_replace(base_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || counter;
    result_slug := trim(both '-' from result_slug);
  END LOOP;
  
  RETURN result_slug;
END;
$function$