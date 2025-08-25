-- Fix search_path security issue for the get_current_user_email function
CREATE OR REPLACE FUNCTION get_current_user_email()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path TO ''
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;