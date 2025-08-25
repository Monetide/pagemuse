-- Fix the security definer view issue by setting security_invoker=on
-- This ensures the view respects RLS policies of the querying user

-- Drop and recreate the view with security_invoker=on
DROP VIEW IF EXISTS public.user_document_invitations;

CREATE VIEW public.user_document_invitations
WITH (security_invoker=on) AS
SELECT 
  id,
  document_id,
  email,
  role,
  expires_at,
  created_at,
  -- Hide sensitive fields like token from regular users
  CASE 
    WHEN has_document_permission(document_id, auth.uid(), 'owner'::document_role) 
    THEN token 
    ELSE NULL 
  END AS token,
  CASE 
    WHEN has_document_permission(document_id, auth.uid(), 'owner'::document_role) 
    THEN invited_by_user_id 
    ELSE NULL 
  END AS invited_by_user_id,
  accepted_at,
  accepted_by_user_id
FROM public.document_invitations;

-- Grant access to the view
GRANT SELECT ON public.user_document_invitations TO authenticated;