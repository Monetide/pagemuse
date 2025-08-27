-- Phase A1: Create template scope enum and update templates table
CREATE TYPE template_scope AS ENUM ('global', 'workspace');

-- Add scope column with default 'workspace'
ALTER TABLE public.templates 
ADD COLUMN scope template_scope NOT NULL DEFAULT 'workspace';

-- Add template_slug column as generated stored column
ALTER TABLE public.templates 
ADD COLUMN template_slug text GENERATED ALWAYS AS (
  lower(trim(both '-' from regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')))
) STORED;

-- Add CHECK constraint for scope/workspace_id consistency
ALTER TABLE public.templates 
ADD CONSTRAINT check_scope_workspace_consistency 
CHECK (
  (scope = 'global' AND workspace_id IS NULL) OR 
  (scope = 'workspace' AND workspace_id IS NOT NULL)
);

-- Create unique index to avoid slug collisions across scopes
CREATE UNIQUE INDEX idx_templates_scope_workspace_slug 
ON public.templates (scope, COALESCE(workspace_id, '00000000-0000-0000-0000-000000000000'::uuid), template_slug);

-- Data migration: Update existing templates based on is_global
UPDATE public.templates 
SET scope = 'global', workspace_id = NULL 
WHERE is_global = true;

-- Ensure workspace templates have workspace_id set
-- For any workspace templates without workspace_id, we'll need to handle this case
-- Let's check if there are any first and handle them safely
UPDATE public.templates 
SET workspace_id = (
  SELECT public.ensure_personal_workspace(user_id)
  FROM public.templates t2 
  WHERE t2.id = templates.id
)
WHERE scope = 'workspace' AND workspace_id IS NULL AND user_id IS NOT NULL;

-- Phase A3: Create template approval requests table
CREATE TABLE public.template_approval_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL,
  document_id uuid NOT NULL,
  requested_by uuid NOT NULL,
  proposed_name text NOT NULL,
  proposed_category text,
  proposed_slug text,
  packaged_snapshot jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  response_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on template_approval_requests
ALTER TABLE public.template_approval_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for template_approval_requests
CREATE POLICY "Workspace members can create approval requests"
ON public.template_approval_requests
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = template_approval_requests.workspace_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin', 'member')
  )
  AND requested_by = auth.uid()
);

CREATE POLICY "Workspace members can view approval requests"
ON public.template_approval_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = template_approval_requests.workspace_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Workspace admins can update approval requests"
ON public.template_approval_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = template_approval_requests.workspace_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
  OR (requested_by = auth.uid() AND status = 'pending')
);

CREATE POLICY "Workspace admins can delete approval requests"
ON public.template_approval_requests
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = template_approval_requests.workspace_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Phase B: Update RLS policies for templates
-- Drop existing policies that use is_global
DROP POLICY IF EXISTS "Everyone can view global templates" ON public.templates;
DROP POLICY IF EXISTS "Users can view templates in their workspaces" ON public.templates;

-- Create new scope-based policies
CREATE POLICY "Everyone can view global templates"
ON public.templates
FOR SELECT
USING (scope = 'global' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view workspace templates in their workspaces"
ON public.templates
FOR SELECT
USING (
  scope = 'workspace' AND
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = templates.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

-- Global template management for system admins only
CREATE POLICY "System admins can manage global templates"
ON public.templates
FOR ALL
USING (scope = 'global' AND has_role(auth.uid(), 'admin'))
WITH CHECK (scope = 'global' AND has_role(auth.uid(), 'admin'));

-- Update trigger for updated_at on template_approval_requests
CREATE TRIGGER update_template_approval_requests_updated_at
  BEFORE UPDATE ON public.template_approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();