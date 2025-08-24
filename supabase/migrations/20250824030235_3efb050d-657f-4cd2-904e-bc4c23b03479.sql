-- Fix infinite recursion in workspace_members policies
-- Drop problematic policies and recreate them without recursion

DROP POLICY IF EXISTS "Users can view workspace members for their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace owners and admins can manage members" ON public.workspace_members;

-- Create safer policies that don't cause recursion
CREATE POLICY "Users can view workspace members for their workspaces" 
ON public.workspace_members 
FOR SELECT 
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Workspace owners and admins can manage members" 
ON public.workspace_members 
FOR ALL 
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Add function to ensure personal workspace (idempotent)
CREATE OR REPLACE FUNCTION public.ensure_personal_workspace(target_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  workspace_id uuid;
  user_name text;
  workspace_name text;
  workspace_slug text;
BEGIN
  -- Check if user already has a workspace
  SELECT wm.workspace_id INTO workspace_id
  FROM workspace_members wm
  WHERE wm.user_id = target_user_id
  ORDER BY wm.created_at ASC
  LIMIT 1;
  
  -- If user already has a workspace, return it
  IF workspace_id IS NOT NULL THEN
    RETURN workspace_id;
  END IF;
  
  -- Get user's display name from profiles
  SELECT display_name INTO user_name
  FROM profiles
  WHERE user_id = target_user_id;
  
  -- Create workspace name
  IF user_name IS NOT NULL AND user_name != '' THEN
    workspace_name := user_name || ' Personal';
  ELSE
    workspace_name := 'Personal Workspace';
  END IF;
  
  -- Generate unique slug
  workspace_slug := generate_workspace_slug(workspace_name);
  
  -- Create the workspace
  INSERT INTO workspaces (name, slug, created_by)
  VALUES (workspace_name, workspace_slug, target_user_id)
  RETURNING id INTO workspace_id;
  
  -- Add user as owner
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (workspace_id, target_user_id, 'owner');
  
  -- Backfill legacy content
  -- Update documents
  UPDATE documents 
  SET workspace_id = workspace_id
  WHERE user_id = target_user_id AND workspace_id IS NULL;
  
  -- Update templates
  UPDATE templates 
  SET workspace_id = workspace_id
  WHERE user_id = target_user_id AND workspace_id IS NULL;
  
  -- Update media
  UPDATE media 
  SET workspace_id = workspace_id
  WHERE user_id = target_user_id AND workspace_id IS NULL;
  
  RETURN workspace_id;
END;
$$;