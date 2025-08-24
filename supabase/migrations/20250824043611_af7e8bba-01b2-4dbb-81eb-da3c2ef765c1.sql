-- Create brand_kits table
CREATE TABLE public.brand_kits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL,
  name text NOT NULL,
  logo_primary_url text,
  logo_alt_url text,
  palette jsonb NOT NULL DEFAULT '{"primary": "#000000", "secondary": "#666666", "accent": "#0066cc"}',
  neutrals jsonb NOT NULL DEFAULT '{"textBody": "#1a1a1a", "textMuted": "#666666", "bgPage": "#ffffff", "bgSection": "#f8f9fa", "borderSubtle": "#e5e7eb"}',
  fonts jsonb,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create brand_kit_maps table for computed token mappings
CREATE TABLE public.brand_kit_maps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_kit_id uuid NOT NULL REFERENCES brand_kits(id) ON DELETE CASCADE,
  token_name text NOT NULL,
  hex text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(brand_kit_id, token_name)
);

-- Create kit_applications table for tracking applications
CREATE TABLE public.kit_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type text NOT NULL CHECK (target_type IN ('template', 'document')),
  target_id uuid NOT NULL,
  brand_kit_id uuid NOT NULL REFERENCES brand_kits(id) ON DELETE CASCADE,
  follow_updates boolean NOT NULL DEFAULT true,
  applied_by uuid NOT NULL,
  applied_at timestamp with time zone NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL DEFAULT '{}'
);

-- Enable RLS on all tables
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_kit_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for brand_kits
CREATE POLICY "Users can view brand kits in their workspaces" 
ON public.brand_kits 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM workspace_members 
  WHERE workspace_members.workspace_id = brand_kits.workspace_id 
  AND workspace_members.user_id = auth.uid()
));

CREATE POLICY "Users can create brand kits in their workspaces" 
ON public.brand_kits 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_members.workspace_id = brand_kits.workspace_id 
    AND workspace_members.user_id = auth.uid() 
    AND workspace_members.role IN ('owner', 'admin', 'member')
  ) 
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update brand kits in their workspaces" 
ON public.brand_kits 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM workspace_members 
  WHERE workspace_members.workspace_id = brand_kits.workspace_id 
  AND workspace_members.user_id = auth.uid() 
  AND workspace_members.role IN ('owner', 'admin', 'member')
));

CREATE POLICY "Users can delete brand kits in their workspaces" 
ON public.brand_kits 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM workspace_members 
  WHERE workspace_members.workspace_id = brand_kits.workspace_id 
  AND workspace_members.user_id = auth.uid() 
  AND workspace_members.role IN ('owner', 'admin', 'member')
));

-- Create policies for brand_kit_maps
CREATE POLICY "Users can view brand kit maps for accessible brand kits" 
ON public.brand_kit_maps 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM brand_kits bk
  JOIN workspace_members wm ON wm.workspace_id = bk.workspace_id
  WHERE bk.id = brand_kit_maps.brand_kit_id 
  AND wm.user_id = auth.uid()
));

CREATE POLICY "Users can manage brand kit maps for accessible brand kits" 
ON public.brand_kit_maps 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM brand_kits bk
  JOIN workspace_members wm ON wm.workspace_id = bk.workspace_id
  WHERE bk.id = brand_kit_maps.brand_kit_id 
  AND wm.user_id = auth.uid() 
  AND wm.role IN ('owner', 'admin', 'member')
));

-- Create policies for kit_applications
CREATE POLICY "Users can view applications for accessible brand kits" 
ON public.kit_applications 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM brand_kits bk
  JOIN workspace_members wm ON wm.workspace_id = bk.workspace_id
  WHERE bk.id = kit_applications.brand_kit_id 
  AND wm.user_id = auth.uid()
));

CREATE POLICY "Users can create applications for accessible brand kits" 
ON public.kit_applications 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_kits bk
    JOIN workspace_members wm ON wm.workspace_id = bk.workspace_id
    WHERE bk.id = kit_applications.brand_kit_id 
    AND wm.user_id = auth.uid() 
    AND wm.role IN ('owner', 'admin', 'member')
  ) 
  AND applied_by = auth.uid()
);

CREATE POLICY "Users can update applications for accessible brand kits" 
ON public.kit_applications 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM brand_kits bk
  JOIN workspace_members wm ON wm.workspace_id = bk.workspace_id
  WHERE bk.id = kit_applications.brand_kit_id 
  AND wm.user_id = auth.uid() 
  AND wm.role IN ('owner', 'admin', 'member')
));

CREATE POLICY "Users can delete applications for accessible brand kits" 
ON public.kit_applications 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM brand_kits bk
  JOIN workspace_members wm ON wm.workspace_id = bk.workspace_id
  WHERE bk.id = kit_applications.brand_kit_id 
  AND wm.user_id = auth.uid() 
  AND wm.role IN ('owner', 'admin', 'member')
));

-- Create indexes for performance
CREATE INDEX idx_brand_kits_workspace_id ON public.brand_kits(workspace_id);
CREATE INDEX idx_brand_kit_maps_brand_kit_id ON public.brand_kit_maps(brand_kit_id);
CREATE INDEX idx_kit_applications_brand_kit_id ON public.kit_applications(brand_kit_id);
CREATE INDEX idx_kit_applications_target ON public.kit_applications(target_type, target_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_brand_kit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for brand_kits updated_at
CREATE TRIGGER update_brand_kits_updated_at
  BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_brand_kit_updated_at();