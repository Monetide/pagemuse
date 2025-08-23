-- Remove the overly permissive policy that allows everyone to view profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a more secure policy that only allows authenticated users to view profiles
-- This allows users to see profile information for document sharing, invitations, etc.
-- but prevents unauthenticated access to user data
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Add a comment explaining the security improvement
COMMENT ON POLICY "Authenticated users can view profiles" ON public.profiles IS 
'Restricts profile access to authenticated users only. This prevents enumeration of users by unauthenticated visitors while maintaining functionality for document sharing and collaboration features.';