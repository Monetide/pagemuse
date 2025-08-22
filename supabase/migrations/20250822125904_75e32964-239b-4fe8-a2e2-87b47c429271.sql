-- Fix search path for has_document_permission function
CREATE OR REPLACE FUNCTION public.has_document_permission(
  _document_id UUID,
  _user_id UUID,
  _required_role public.document_role
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
DECLARE
  user_role public.document_role;
  role_hierarchy INTEGER;
  required_hierarchy INTEGER;
BEGIN
  -- Check if user is document owner
  SELECT CASE WHEN user_id = _user_id THEN 'owner'::public.document_role ELSE NULL END
  INTO user_role
  FROM public.documents
  WHERE id = _document_id;
  
  -- If not owner, check shared permissions
  IF user_role IS NULL THEN
    SELECT ds.role INTO user_role
    FROM public.document_shares ds
    WHERE ds.document_id = _document_id 
      AND ds.shared_with_user_id = _user_id
      AND ds.status = 'accepted'
      AND (ds.expires_at IS NULL OR ds.expires_at > now());
  END IF;
  
  -- If still no permission, return false
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Convert roles to hierarchy for comparison
  role_hierarchy := CASE user_role
    WHEN 'owner' THEN 4
    WHEN 'editor' THEN 3
    WHEN 'commenter' THEN 2
    WHEN 'viewer' THEN 1
  END;
  
  required_hierarchy := CASE _required_role
    WHEN 'owner' THEN 4
    WHEN 'editor' THEN 3
    WHEN 'commenter' THEN 2
    WHEN 'viewer' THEN 1
  END;
  
  RETURN role_hierarchy >= required_hierarchy;
END;
$$;

-- Fix search path for log_document_activity function
CREATE OR REPLACE FUNCTION public.log_document_activity(
  _document_id UUID,
  _user_id UUID,
  _activity_type TEXT,
  _description TEXT,
  _metadata JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.document_activities (
    document_id,
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    _document_id,
    _user_id,
    _activity_type,
    _description,
    _metadata
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;