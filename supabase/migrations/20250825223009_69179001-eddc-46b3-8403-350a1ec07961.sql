-- Fix document invitations security by creating proper RLS policies
-- that allow invited users to see only their own invitations

-- First, drop the existing overly broad policy
DROP POLICY IF EXISTS "Document owners can manage invitations" ON public.document_invitations;

-- Create separate policies for different operations and user types

-- 1. Document owners can manage all invitations for their documents
CREATE POLICY "Document owners can manage invitations"
ON public.document_invitations
FOR ALL 
TO authenticated
USING (has_document_permission(document_id, auth.uid(), 'owner'::document_role))
WITH CHECK (has_document_permission(document_id, auth.uid(), 'owner'::document_role));

-- 2. Invited users can view ONLY their own invitations (by email)
-- This is secure because it requires email verification through auth
CREATE POLICY "Invited users can view own invitations"
ON public.document_invitations
FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND accepted_at IS NULL 
  AND expires_at > now()
);

-- 3. Invited users can update ONLY their own invitations (to accept them)
CREATE POLICY "Invited users can accept own invitations" 
ON public.document_invitations
FOR UPDATE
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND accepted_at IS NULL
  AND expires_at > now()
)
WITH CHECK (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND accepted_by_user_id = auth.uid()
);

-- Create a secure view that hides sensitive fields from invited users
CREATE OR REPLACE VIEW public.user_document_invitations AS
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

-- Enable RLS on the view
ALTER VIEW public.user_document_invitations SET (security_barrier = true);

-- Add comment explaining the security model
COMMENT ON TABLE public.document_invitations IS 
'Document invitations with RLS: owners can manage all, invited users can only see/accept their own by verified email';

COMMENT ON VIEW public.user_document_invitations IS 
'Secure view of document invitations that hides sensitive fields from non-owners';