-- Create helper function to get registry entries
CREATE OR REPLACE FUNCTION public.get_registry_entry(table_name text, entry_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  CASE table_name
    WHEN 'template_registry_doc_types' THEN
      SELECT data INTO result FROM public.template_registry_doc_types WHERE id = entry_id;
    WHEN 'template_registry_style_packs' THEN
      SELECT data INTO result FROM public.template_registry_style_packs WHERE id = entry_id;
    WHEN 'template_registry_industries' THEN
      SELECT data INTO result FROM public.template_registry_industries WHERE id = entry_id;
    ELSE
      RAISE EXCEPTION 'Invalid table name: %', table_name;
  END CASE;
  
  RETURN result;
END;
$$;