-- Admin override policies for templates
-- Allow admins to view, create, update, and delete any templates

-- SELECT
CREATE POLICY "Admins can view all templates"
ON public.templates
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- UPDATE
CREATE POLICY "Admins can update any template"
ON public.templates
FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- DELETE
CREATE POLICY "Admins can delete any template"
ON public.templates
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- INSERT
CREATE POLICY "Admins can insert templates"
ON public.templates
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));
