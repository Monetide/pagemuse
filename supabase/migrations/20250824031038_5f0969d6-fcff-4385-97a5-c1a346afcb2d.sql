-- Create helper functions to avoid recursive RLS on workspace_members
CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = p_workspace_id
      AND wm.user_id = COALESCE(p_user_id, auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_admin(p_workspace_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = p_workspace_id
      AND wm.user_id = COALESCE(p_user_id, auth.uid())
      AND wm.role IN ('owner','admin')
  );
$$;

-- Recreate workspace_members policies using helper functions to avoid recursion
DROP POLICY IF EXISTS "Users can view workspace members for their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace owners and admins can manage members" ON public.workspace_members;

CREATE POLICY "Users can view workspace members for their workspaces"
ON public.workspace_members
FOR SELECT
USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace owners and admins can manage members"
ON public.workspace_members
FOR ALL
USING (public.is_workspace_admin(workspace_id));

-- Fix ensure_personal_workspace backfill assignments
CREATE OR REPLACE FUNCTION public.ensure_personal_workspace(target_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $func$
DECLARE
  new_ws_id uuid;
  user_name text;
  workspace_name text;
  workspace_slug text;
BEGIN
  -- Return most recent workspace if exists
  SELECT wm.workspace_id INTO new_ws_id
  FROM public.workspace_members wm
  WHERE wm.user_id = target_user_id
  ORDER BY wm.created_at DESC
  LIMIT 1;

  IF new_ws_id IS NOT NULL THEN
    RETURN new_ws_id;
  END IF;

  -- Build name
  SELECT display_name INTO user_name FROM public.profiles WHERE user_id = target_user_id;
  IF COALESCE(user_name,'') <> '' THEN
    workspace_name := user_name || ' Personal';
  ELSE
    workspace_name := 'Personal Workspace';
  END IF;

  -- Unique slug
  workspace_slug := public.generate_workspace_slug(workspace_name);

  -- Create workspace and owner membership
  INSERT INTO public.workspaces (name, slug, created_by)
  VALUES (workspace_name, workspace_slug, target_user_id)
  RETURNING id INTO new_ws_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_ws_id, target_user_id, 'owner');

  -- Backfill legacy content
  UPDATE public.documents SET workspace_id = new_ws_id
  WHERE user_id = target_user_id AND workspace_id IS NULL;

  UPDATE public.templates SET workspace_id = new_ws_id
  WHERE user_id = target_user_id AND workspace_id IS NULL;

  UPDATE public.media SET workspace_id = new_ws_id
  WHERE user_id = target_user_id AND workspace_id IS NULL;

  RETURN new_ws_id;
END;
$func$;