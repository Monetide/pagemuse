-- Create template_seeds table for storing parameter sets
CREATE TABLE public.template_seeds (
  id text NOT NULL,
  workspace_id uuid NOT NULL,
  doc_type text NOT NULL,
  style_pack text NOT NULL,
  industry text NOT NULL,
  type_pairing jsonb NOT NULL DEFAULT '[]'::jsonb,
  scale jsonb NOT NULL DEFAULT '{}'::jsonb,
  motifs jsonb NOT NULL DEFAULT '{}'::jsonb,
  palette_hints jsonb NOT NULL DEFAULT '{}'::jsonb,
  snippets jsonb NOT NULL DEFAULT '[]'::jsonb,
  chart_defaults jsonb NOT NULL DEFAULT '{}'::jsonb,
  validation_preset text,
  status text NOT NULL DEFAULT 'ready',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id, workspace_id)
);

-- Enable RLS
ALTER TABLE public.template_seeds ENABLE ROW LEVEL SECURITY;

-- Create policies for workspace access
CREATE POLICY "Users can view seeds in their workspaces"
ON public.template_seeds
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = template_seeds.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage seeds in their workspaces"
ON public.template_seeds
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = template_seeds.workspace_id
    AND workspace_members.user_id = auth.uid()
    AND workspace_members.role IN ('owner', 'admin', 'member')
  )
);

-- Create updated_at trigger
CREATE TRIGGER update_template_seeds_updated_at
  BEFORE UPDATE ON public.template_seeds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();