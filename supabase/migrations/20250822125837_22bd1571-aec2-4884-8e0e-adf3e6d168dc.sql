-- Create document-level role enum
CREATE TYPE public.document_role AS ENUM ('owner', 'editor', 'commenter', 'viewer');

-- Create document sharing status enum  
CREATE TYPE public.share_status AS ENUM ('pending', 'accepted', 'declined');

-- Create document shares table for user-to-user sharing
CREATE TABLE public.document_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL,
  shared_by_user_id UUID NOT NULL,
  role public.document_role NOT NULL DEFAULT 'viewer',
  status public.share_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (document_id, shared_with_user_id)
);

-- Create document invitations table for email invitations
CREATE TABLE public.document_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by_user_id UUID NOT NULL,
  role public.document_role NOT NULL DEFAULT 'viewer',
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (document_id, email)
);

-- Create share links table for public/private link sharing
CREATE TABLE public.share_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  role public.document_role NOT NULL DEFAULT 'viewer',
  password_hash TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER NOT NULL DEFAULT 0,
  max_views INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  allow_download BOOLEAN NOT NULL DEFAULT false,
  watermark_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (token)
);

-- Create published documents table for frozen versions
CREATE TABLE public.published_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  published_by_user_id UUID NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_current BOOLEAN NOT NULL DEFAULT true,
  public_url_token UUID NOT NULL DEFAULT gen_random_uuid(),
  metadata JSONB DEFAULT '{}',
  UNIQUE (public_url_token)
);

-- Create document activities table for activity logging
CREATE TABLE public.document_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_activities ENABLE ROW LEVEL SECURITY;

-- Create function to check document permissions
CREATE OR REPLACE FUNCTION public.has_document_permission(
  _document_id UUID,
  _user_id UUID,
  _required_role public.document_role
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role public.document_role;
  role_hierarchy INTEGER;
  required_hierarchy INTEGER;
BEGIN
  -- Check if user is document owner
  SELECT CASE WHEN user_id = _user_id THEN 'owner'::public.document_role ELSE NULL END
  INTO user_role
  FROM public.documents
  WHERE id = _document_id;
  
  -- If not owner, check shared permissions
  IF user_role IS NULL THEN
    SELECT ds.role INTO user_role
    FROM public.document_shares ds
    WHERE ds.document_id = _document_id 
      AND ds.shared_with_user_id = _user_id
      AND ds.status = 'accepted'
      AND (ds.expires_at IS NULL OR ds.expires_at > now());
  END IF;
  
  -- If still no permission, return false
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Convert roles to hierarchy for comparison
  role_hierarchy := CASE user_role
    WHEN 'owner' THEN 4
    WHEN 'editor' THEN 3
    WHEN 'commenter' THEN 2
    WHEN 'viewer' THEN 1
  END;
  
  required_hierarchy := CASE _required_role
    WHEN 'owner' THEN 4
    WHEN 'editor' THEN 3
    WHEN 'commenter' THEN 2
    WHEN 'viewer' THEN 1
  END;
  
  RETURN role_hierarchy >= required_hierarchy;
END;
$$;

-- RLS Policies for document_shares
CREATE POLICY "Users can view shares for documents they can access"
ON public.document_shares FOR SELECT
USING (
  has_document_permission(document_id, auth.uid(), 'viewer'::public.document_role)
);

CREATE POLICY "Document owners can manage shares"
ON public.document_shares FOR ALL
USING (
  has_document_permission(document_id, auth.uid(), 'owner'::public.document_role)
);

CREATE POLICY "Users can view their own shares"
ON public.document_shares FOR SELECT
USING (shared_with_user_id = auth.uid());

CREATE POLICY "Users can update their own share status"
ON public.document_shares FOR UPDATE
USING (shared_with_user_id = auth.uid())
WITH CHECK (shared_with_user_id = auth.uid());

-- RLS Policies for document_invitations
CREATE POLICY "Document owners can manage invitations"
ON public.document_invitations FOR ALL
USING (
  has_document_permission(document_id, auth.uid(), 'owner'::public.document_role)
);

-- RLS Policies for share_links
CREATE POLICY "Document owners can manage share links"
ON public.share_links FOR ALL
USING (
  has_document_permission(document_id, auth.uid(), 'owner'::public.document_role)
);

-- RLS Policies for published_documents
CREATE POLICY "Users can view published documents they have access to"
ON public.published_documents FOR SELECT
USING (
  has_document_permission(document_id, auth.uid(), 'viewer'::public.document_role)
);

CREATE POLICY "Document owners can publish documents"
ON public.published_documents FOR INSERT
WITH CHECK (
  has_document_permission(document_id, auth.uid(), 'owner'::public.document_role)
  AND published_by_user_id = auth.uid()
);

-- RLS Policies for document_activities
CREATE POLICY "Users can view activities for documents they can access"
ON public.document_activities FOR SELECT
USING (
  has_document_permission(document_id, auth.uid(), 'viewer'::public.document_role)
);

CREATE POLICY "System can insert activities"
ON public.document_activities FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_document_shares_document_user ON public.document_shares(document_id, shared_with_user_id);
CREATE INDEX idx_document_shares_status ON public.document_shares(status);
CREATE INDEX idx_document_invitations_token ON public.document_invitations(token);
CREATE INDEX idx_document_invitations_expires ON public.document_invitations(expires_at);
CREATE INDEX idx_share_links_token ON public.share_links(token);
CREATE INDEX idx_published_documents_token ON public.published_documents(public_url_token);
CREATE INDEX idx_document_activities_document_created ON public.document_activities(document_id, created_at);

-- Create triggers for updated_at
CREATE TRIGGER update_document_shares_updated_at
  BEFORE UPDATE ON public.document_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_share_links_updated_at
  BEFORE UPDATE ON public.share_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to log document activities
CREATE OR REPLACE FUNCTION public.log_document_activity(
  _document_id UUID,
  _user_id UUID,
  _activity_type TEXT,
  _description TEXT,
  _metadata JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.document_activities (
    document_id,
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    _document_id,
    _user_id,
    _activity_type,
    _description,
    _metadata
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;