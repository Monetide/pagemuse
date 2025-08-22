-- Add metadata fields to media table
ALTER TABLE public.media 
ADD COLUMN tags TEXT[] DEFAULT '{}',
ADD COLUMN description TEXT,
ADD COLUMN credit TEXT,
ADD COLUMN license TEXT,
ADD COLUMN alt_text TEXT,
ADD COLUMN width INTEGER,
ADD COLUMN height INTEGER,
ADD COLUMN usage_count INTEGER DEFAULT 0;

-- Create media collections table for folders/brand assets
CREATE TABLE public.media_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_brand_assets BOOLEAN DEFAULT FALSE,
  color TEXT DEFAULT '#6366f1',
  parent_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (parent_id) REFERENCES public.media_collections(id) ON DELETE CASCADE
);

-- Create media versions table for asset versioning
CREATE TABLE public.media_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create asset references table to track usage
CREATE TABLE public.asset_references (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  document_id UUID,
  block_id TEXT,
  reference_type TEXT NOT NULL DEFAULT 'figure',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for media collections
CREATE TABLE public.media_collection_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.media_collections(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, media_id)
);

-- Enable RLS on new tables
ALTER TABLE public.media_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_collection_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_collections
CREATE POLICY "Users can manage their own collections"
ON public.media_collections
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for media_versions
CREATE POLICY "Users can view versions of their media"
ON public.media_versions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.media m 
  WHERE m.id = media_versions.media_id 
  AND m.user_id = auth.uid()
));

CREATE POLICY "Users can create versions for their media"
ON public.media_versions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.media m 
    WHERE m.id = media_versions.media_id 
    AND m.user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

-- RLS Policies for asset_references
CREATE POLICY "Users can manage references for their media"
ON public.asset_references
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.media m 
  WHERE m.id = asset_references.media_id 
  AND m.user_id = auth.uid()
));

-- RLS Policies for media_collection_items
CREATE POLICY "Users can manage their collection items"
ON public.media_collection_items
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.media_collections mc 
  WHERE mc.id = media_collection_items.collection_id 
  AND mc.user_id = auth.uid()
));

-- Create triggers for updated_at
CREATE TRIGGER update_media_collections_updated_at
BEFORE UPDATE ON public.media_collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asset_references_updated_at
BEFORE UPDATE ON public.asset_references
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update usage count
CREATE OR REPLACE FUNCTION public.update_media_usage_count(media_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  -- Count references to this media
  SELECT COUNT(*) INTO usage_count
  FROM public.asset_references
  WHERE media_id = media_uuid;
  
  -- Update the media table
  UPDATE public.media 
  SET usage_count = usage_count
  WHERE id = media_uuid;
  
  RETURN usage_count;
END;
$$;

-- Function to get next version number for media
CREATE OR REPLACE FUNCTION public.get_next_media_version(media_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(version_number) + 1 FROM public.media_versions WHERE media_id = media_uuid),
    1
  );
END;
$$;