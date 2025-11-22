-- Fix function search path security warning
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.typing_indicators
  WHERE updated_at < now() - interval '10 seconds';
  RETURN NEW;
END;
$$;