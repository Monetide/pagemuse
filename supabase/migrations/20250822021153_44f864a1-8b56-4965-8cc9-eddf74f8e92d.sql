-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.get_next_version_number(doc_id UUID)
RETURNS INTEGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(version_number) + 1 FROM public.document_versions WHERE document_id = doc_id),
    1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_document_version(
  p_document_id UUID,
  p_title TEXT,
  p_content JSONB,
  p_version_type TEXT DEFAULT 'autosave',
  p_snapshot_name TEXT DEFAULT NULL
)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  version_id UUID;
  next_version INTEGER;
BEGIN
  -- Get next version number
  next_version := public.get_next_version_number(p_document_id);
  
  -- Insert new version
  INSERT INTO public.document_versions (
    document_id,
    version_number,
    title,
    content,
    version_type,
    snapshot_name,
    created_by
  ) VALUES (
    p_document_id,
    next_version,
    p_title,
    p_content,
    p_version_type,
    p_snapshot_name,
    auth.uid()
  ) RETURNING id INTO version_id;
  
  RETURN version_id;
END;
$$;