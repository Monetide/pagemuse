-- Create workspace_activities table
CREATE TABLE public.workspace_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  activity_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace_activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view activities for their workspaces" 
ON public.workspace_activities 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM workspace_members 
  WHERE workspace_members.workspace_id = workspace_activities.workspace_id 
  AND workspace_members.user_id = auth.uid()
));

CREATE POLICY "System can insert activities" 
ON public.workspace_activities 
FOR INSERT 
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_workspace_activities_workspace_id ON public.workspace_activities(workspace_id);
CREATE INDEX idx_workspace_activities_created_at ON public.workspace_activities(created_at DESC);