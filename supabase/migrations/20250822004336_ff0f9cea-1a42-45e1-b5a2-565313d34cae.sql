-- Create storage bucket for figures
INSERT INTO storage.buckets (id, name, public) VALUES ('figures', 'figures', true);

-- Create RLS policies for figures bucket
CREATE POLICY "Anyone can view figure images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'figures');

CREATE POLICY "Authenticated users can upload figures" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'figures' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own figures" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'figures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own figures" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'figures' AND auth.uid()::text = (storage.foldername(name))[1]);