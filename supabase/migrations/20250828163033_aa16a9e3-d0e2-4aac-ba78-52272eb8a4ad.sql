-- Secure document_invitations table to prevent email harvesting
-- Drop existing policies to rebuild them securely
DROP POLICY IF EXISTS "Document owners can manage invitations" ON public.document_invitations;
DROP POLICY IF EXISTS "Invited users can view own invitations" ON public.document_invitations;  
DROP POLICY IF EXISTS "Invited users can accept own invitations" ON public.document_invitations;

-- Create restrictive policies that prevent email harvesting
-- 1. Document owners can manage all invitations for their documents
CREATE POLICY "Document owners manage invitations"
ON public.document_invitations
FOR ALL 
TO authenticated
USING (has_document_permission(document_id, auth.uid(), 'owner'::document_role))
WITH CHECK (has_document_permission(document_id, auth.uid(), 'owner'::document_role));

-- 2. Invited users can only view their own pending invitations (no email exposure)
CREATE POLICY "Users view own pending invitations"
ON public.document_invitations  
FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND accepted_at IS NULL 
  AND expires_at > now()
);

-- 3. Invited users can only update their own invitations to accept them
CREATE POLICY "Users accept own invitations"
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

-- 4. Ensure no public access - explicit deny for anon role
CREATE POLICY "No anonymous access to invitations"
ON public.document_invitations
FOR ALL
TO anon
USING (false);

-- Verify RLS is enabled
ALTER TABLE public.document_invitations ENABLE ROW LEVEL SECURITY;