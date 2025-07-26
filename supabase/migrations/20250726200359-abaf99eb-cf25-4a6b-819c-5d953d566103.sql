-- Create templates table
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  preview_image_url TEXT,
  figma_file_id TEXT,
  figma_node_id TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_global BOOLEAN NOT NULL DEFAULT false,
  user_id UUID,
  global_styling JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create template_pages table
CREATE TABLE public.template_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  page_index INTEGER NOT NULL,
  name TEXT NOT NULL,
  layout_config JSONB DEFAULT '{}',
  page_styling JSONB DEFAULT '{}',
  content_scaffold JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table  
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id UUID REFERENCES public.templates(id),
  title TEXT NOT NULL,
  content JSONB DEFAULT '[]',
  styling_overrides JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document_pages table
CREATE TABLE public.document_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  page_index INTEGER NOT NULL,
  layout_config JSONB DEFAULT '{}',
  containers JSONB DEFAULT '[]',
  page_styling JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_pages ENABLE ROW LEVEL SECURITY;

-- Templates policies (global templates viewable by all, user templates by owner)
CREATE POLICY "Everyone can view global templates" ON public.templates
FOR SELECT USING (is_global = true);

CREATE POLICY "Users can view their own templates" ON public.templates
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" ON public.templates
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" ON public.templates
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" ON public.templates
FOR DELETE USING (auth.uid() = user_id);

-- Template pages policies
CREATE POLICY "Users can view template pages for accessible templates" ON public.template_pages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.templates t 
    WHERE t.id = template_id 
    AND (t.is_global = true OR t.user_id = auth.uid())
  )
);

CREATE POLICY "Users can manage template pages for their templates" ON public.template_pages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.templates t 
    WHERE t.id = template_id 
    AND t.user_id = auth.uid()
  )
);

-- Documents policies
CREATE POLICY "Users can view their own documents" ON public.documents
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents" ON public.documents
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON public.documents
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON public.documents
FOR DELETE USING (auth.uid() = user_id);

-- Document pages policies
CREATE POLICY "Users can manage document pages for their documents" ON public.document_pages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.documents d 
    WHERE d.id = document_id 
    AND d.user_id = auth.uid()
  )
);

-- Create update timestamp triggers
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_pages_updated_at
  BEFORE UPDATE ON public.document_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_templates_category ON public.templates(category);
CREATE INDEX idx_templates_user_id ON public.templates(user_id);
CREATE INDEX idx_templates_is_global ON public.templates(is_global);
CREATE INDEX idx_template_pages_template_id ON public.template_pages(template_id);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_template_id ON public.documents(template_id);
CREATE INDEX idx_document_pages_document_id ON public.document_pages(document_id);