-- Add additional columns to documents table for enhanced document management
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS starred boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS folder_path text DEFAULT '',
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create folders table for better organization
CREATE TABLE IF NOT EXISTS public.folders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  parent_id uuid REFERENCES public.folders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  path text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, path)
);

-- Enable RLS on folders table
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Create policies for folders
CREATE POLICY "Users can manage their own folders" 
ON public.folders 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_starred ON public.documents (starred) WHERE starred = true;
CREATE INDEX IF NOT EXISTS idx_documents_archived ON public.documents (archived) WHERE archived = false;
CREATE INDEX IF NOT EXISTS idx_documents_deleted ON public.documents (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_folder_path ON public.documents (folder_path);
CREATE INDEX IF NOT EXISTS idx_documents_user_active ON public.documents (user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_folders_user_path ON public.folders (user_id, path);

-- Create trigger to update folders updated_at
CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get folder hierarchy
CREATE OR REPLACE FUNCTION public.get_folder_hierarchy(folder_id uuid)
RETURNS TABLE(id uuid, name text, path text, level integer)
LANGUAGE sql
STABLE
AS $$
  WITH RECURSIVE folder_tree AS (
    -- Base case: start with the given folder
    SELECT f.id, f.name, f.path, 0 as level
    FROM public.folders f
    WHERE f.id = folder_id
    
    UNION ALL
    
    -- Recursive case: get child folders
    SELECT f.id, f.name, f.path, ft.level + 1
    FROM public.folders f
    JOIN folder_tree ft ON f.parent_id = ft.id
  )
  SELECT * FROM folder_tree ORDER BY level, name;
$$;