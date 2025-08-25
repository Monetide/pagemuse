-- Fix critical security vulnerability in workspace_invitations table
-- Remove the overly permissive policy that allows anyone to view all invitations
DROP POLICY IF EXISTS "Anyone can view invitations by token" ON workspace_invitations;

-- Create a secure policy that only allows:
-- 1. Workspace admins to view invitations for their workspace
-- 2. Users to view invitations sent to their email address
CREATE POLICY "Users can view relevant invitations" 
ON workspace_invitations 
FOR SELECT 
USING (
  -- Workspace admins can view invitations for their workspace
  is_workspace_admin(workspace_id) 
  OR 
  -- Users can view invitations sent to their email (if authenticated)
  (auth.uid() IS NOT NULL AND email = (
    SELECT email 
    FROM auth.users 
    WHERE id = auth.uid()
  ))
);

-- Create a security definer function to get user email safely
-- This avoids direct access to auth.users table which could cause recursion
CREATE OR REPLACE FUNCTION get_current_user_email()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- Update the policy to use the security definer function
DROP POLICY "Users can view relevant invitations" ON workspace_invitations;

CREATE POLICY "Users can view relevant invitations" 
ON workspace_invitations 
FOR SELECT 
USING (
  -- Workspace admins can view invitations for their workspace
  is_workspace_admin(workspace_id) 
  OR 
  -- Users can view invitations sent to their email address
  (auth.uid() IS NOT NULL AND email = get_current_user_email())
);