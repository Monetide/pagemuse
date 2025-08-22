-- Create document versions table for version history
CREATE TABLE public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  version_type TEXT NOT NULL DEFAULT 'autosave', -- 'autosave', 'manual', 'snapshot', 'safety'
  snapshot_name TEXT, -- For named snapshots
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Ensure version numbers are unique per document
  CONSTRAINT unique_document_version UNIQUE(document_id, version_number)
);

-- Enable RLS
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for document versions
CREATE POLICY "Users can view versions of their documents" 
ON public.document_versions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.documents d 
    WHERE d.id = document_versions.document_id 
    AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create versions for their documents" 
ON public.document_versions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.documents d 
    WHERE d.id = document_versions.document_id 
    AND d.user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Users can delete versions of their documents" 
ON public.document_versions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.documents d 
    WHERE d.id = document_versions.document_id 
    AND d.user_id = auth.uid()
  )
);

-- Create function to get next version number
CREATE OR REPLACE FUNCTION public.get_next_version_number(doc_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(version_number) + 1 FROM public.document_versions WHERE document_id = doc_id),
    1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create document version
CREATE OR REPLACE FUNCTION public.create_document_version(
  p_document_id UUID,
  p_title TEXT,
  p_content JSONB,
  p_version_type TEXT DEFAULT 'autosave',
  p_snapshot_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  version_id UUID;
  next_version INTEGER;
BEGIN
  -- Get next version number
  next_version := public.get_next_version_number(p_document_id);
  
  -- Insert new version
  INSERT INTO public.document_versions (
    document_id,
    version_number,
    title,
    content,
    version_type,
    snapshot_name,
    created_by
  ) VALUES (
    p_document_id,
    next_version,
    p_title,
    p_content,
    p_version_type,
    p_snapshot_name,
    auth.uid()
  ) RETURNING id INTO version_id;
  
  RETURN version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX idx_document_versions_document_id ON public.document_versions(document_id);
CREATE INDEX idx_document_versions_created_at ON public.document_versions(created_at);
CREATE INDEX idx_document_versions_version_type ON public.document_versions(version_type);