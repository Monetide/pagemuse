-- Create templates table for storing template drafts and published templates
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  version TEXT NOT NULL DEFAULT '1.0.0',
  
  -- Template data
  manifest JSONB NOT NULL,
  brand_name TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Usage stats
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Create template_assets table for storing asset references
CREATE TABLE public.template_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('body-bg', 'divider', 'cover-shape', 'preview-cover', 'preview-body', 'preview-data')),
  file_path TEXT NOT NULL,
  content_type TEXT,
  file_size INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_assets ENABLE ROW LEVEL SECURITY;

-- Templates policies
CREATE POLICY "Users can view all published templates" 
ON public.templates 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Users can view their own templates" 
ON public.templates 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own templates" 
ON public.templates 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates" 
ON public.templates 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates" 
ON public.templates 
FOR DELETE 
USING (auth.uid() = created_by);

-- Template assets policies
CREATE POLICY "Users can view assets for accessible templates" 
ON public.template_assets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.templates t 
    WHERE t.id = template_id 
    AND (t.status = 'published' OR t.created_by = auth.uid())
  )
);

CREATE POLICY "Users can create assets for their own templates" 
ON public.template_assets 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.templates t 
    WHERE t.id = template_id 
    AND t.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update assets for their own templates" 
ON public.template_assets 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.templates t 
    WHERE t.id = template_id 
    AND t.created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete assets for their own templates" 
ON public.template_assets 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.templates t 
    WHERE t.id = template_id 
    AND t.created_by = auth.uid()
  )
);

-- Add indexes for better performance
CREATE INDEX idx_templates_created_by ON public.templates(created_by);
CREATE INDEX idx_templates_status ON public.templates(status);
CREATE INDEX idx_template_assets_template_id ON public.template_assets(template_id);
CREATE INDEX idx_template_assets_type ON public.template_assets(asset_type);

-- Add trigger for updated_at
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();