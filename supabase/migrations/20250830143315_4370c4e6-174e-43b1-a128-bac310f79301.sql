-- Add RLS policies for global seeds access
-- Allow admins to manage global seeds (workspace_id = '00000000-0000-0000-0000-000000000000')
CREATE POLICY "Admins can manage global seeds" ON public.template_seeds
FOR ALL USING (
  (workspace_id = '00000000-0000-0000-0000-000000000000'::uuid) 
  AND has_role(auth.uid(), 'admin'::app_role)
);