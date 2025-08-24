-- Create workspace role enum
CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'member');

-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workspace_members table
CREATE TABLE public.workspace_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.workspace_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Add workspaceId to existing tables
ALTER TABLE public.documents ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.templates ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.media ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workspaces
CREATE POLICY "Users can view workspaces they are members of"
ON public.workspaces
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = workspaces.id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Workspace owners can update workspaces"
ON public.workspaces
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = workspaces.id 
    AND user_id = auth.uid() 
    AND role = 'owner'
  )
);

CREATE POLICY "Workspace owners can delete workspaces"
ON public.workspaces
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = workspaces.id 
    AND user_id = auth.uid() 
    AND role = 'owner'
  )
);

-- Create RLS policies for workspace_members
CREATE POLICY "Users can view workspace members for their workspaces"
ON public.workspace_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm2
    WHERE wm2.workspace_id = workspace_members.workspace_id 
    AND wm2.user_id = auth.uid()
  )
);

CREATE POLICY "Workspace owners and admins can manage members"
ON public.workspace_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm2
    WHERE wm2.workspace_id = workspace_members.workspace_id 
    AND wm2.user_id = auth.uid() 
    AND wm2.role IN ('owner', 'admin')
  )
);

-- Create function to generate unique workspace slug
CREATE OR REPLACE FUNCTION public.generate_workspace_slug(base_name TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
  counter INTEGER := 0;
BEGIN
  slug := lower(regexp_replace(base_name, '[^a-zA-Z0-9]+', '-', 'g'));
  slug := trim(both '-' from slug);
  
  WHILE EXISTS (SELECT 1 FROM public.workspaces WHERE workspaces.slug = slug) LOOP
    counter := counter + 1;
    slug := lower(regexp_replace(base_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || counter;
    slug := trim(both '-' from slug);
  END LOOP;
  
  RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Migration: Create Personal workspace for each existing user and move their content
DO $$
DECLARE
  user_record RECORD;
  workspace_id UUID;
  workspace_slug TEXT;
BEGIN
  -- For each user with documents, templates, or media
  FOR user_record IN 
    SELECT DISTINCT user_id FROM (
      SELECT user_id FROM public.documents WHERE user_id IS NOT NULL
      UNION
      SELECT user_id FROM public.templates WHERE user_id IS NOT NULL
      UNION  
      SELECT user_id FROM public.media WHERE user_id IS NOT NULL
    ) users
  LOOP
    -- Generate unique slug for Personal workspace
    workspace_slug := public.generate_workspace_slug('personal-' || user_record.user_id);
    
    -- Create Personal workspace for this user
    INSERT INTO public.workspaces (name, slug, created_by)
    VALUES ('Personal', workspace_slug, user_record.user_id)
    RETURNING id INTO workspace_id;
    
    -- Add user as owner of their Personal workspace
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (workspace_id, user_record.user_id, 'owner');
    
    -- Move user's documents to their Personal workspace
    UPDATE public.documents 
    SET workspace_id = workspace_id 
    WHERE user_id = user_record.user_id AND workspace_id IS NULL;
    
    -- Move user's templates to their Personal workspace
    UPDATE public.templates 
    SET workspace_id = workspace_id 
    WHERE user_id = user_record.user_id AND workspace_id IS NULL;
    
    -- Move user's media to their Personal workspace
    UPDATE public.media 
    SET workspace_id = workspace_id 
    WHERE user_id = user_record.user_id AND workspace_id IS NULL;
  END LOOP;
END $$;

-- Update RLS policies for existing tables to include workspace access
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;

CREATE POLICY "Users can view documents in their workspaces"
ON public.documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = documents.workspace_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create documents in their workspaces"
ON public.documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = documents.workspace_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'member')
  ) AND auth.uid() = documents.user_id
);

CREATE POLICY "Users can update documents in their workspaces"
ON public.documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = documents.workspace_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'member')
  ) AND auth.uid() = documents.user_id
);

CREATE POLICY "Users can delete documents in their workspaces"
ON public.documents
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = documents.workspace_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'member')
  ) AND auth.uid() = documents.user_id
);

-- Update templates RLS policies
DROP POLICY IF EXISTS "Users can view their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.templates;

CREATE POLICY "Users can view templates in their workspaces"
ON public.templates
FOR SELECT
USING (
  is_global = true OR 
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = templates.workspace_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create templates in their workspaces"
ON public.templates
FOR INSERT
WITH CHECK (
  (user_id = auth.uid() AND 
   EXISTS (
     SELECT 1 FROM public.workspace_members 
     WHERE workspace_id = templates.workspace_id 
     AND user_id = auth.uid() 
     AND role IN ('owner', 'admin', 'member')
   )) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can update templates in their workspaces"
ON public.templates
FOR UPDATE
USING (
  (user_id = auth.uid() AND 
   EXISTS (
     SELECT 1 FROM public.workspace_members 
     WHERE workspace_id = templates.workspace_id 
     AND user_id = auth.uid() 
     AND role IN ('owner', 'admin', 'member')
   )) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can delete templates in their workspaces"
ON public.templates
FOR DELETE
USING (
  (user_id = auth.uid() AND 
   EXISTS (
     SELECT 1 FROM public.workspace_members 
     WHERE workspace_id = templates.workspace_id 
     AND user_id = auth.uid() 
     AND role IN ('owner', 'admin', 'member')
   )) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Update media RLS policies
DROP POLICY IF EXISTS "Users can view their own media" ON public.media;
DROP POLICY IF EXISTS "Users can create their own media" ON public.media;
DROP POLICY IF EXISTS "Users can update their own media" ON public.media;
DROP POLICY IF EXISTS "Users can delete their own media" ON public.media;

CREATE POLICY "Users can view media in their workspaces"
ON public.media
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = media.workspace_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create media in their workspaces"
ON public.media
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = media.workspace_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'member')
  ) AND auth.uid() = media.user_id
);

CREATE POLICY "Users can update media in their workspaces"
ON public.media
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = media.workspace_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'member')
  ) AND auth.uid() = media.user_id
);

CREATE POLICY "Users can delete media in their workspaces"
ON public.media
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = media.workspace_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'member')
  ) AND auth.uid() = media.user_id
);

-- Add trigger for updated_at on workspaces
CREATE TRIGGER update_workspaces_updated_at
BEFORE UPDATE ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();