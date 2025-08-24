-- Delete the old published templates that were created before template generator
DELETE FROM templates 
WHERE status = 'published' 
  AND user_id IS NULL 
  AND created_at = '2025-08-23 16:28:59.966168+00';