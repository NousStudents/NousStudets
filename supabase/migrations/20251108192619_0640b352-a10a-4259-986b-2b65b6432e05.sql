-- Create audit logs table for tracking user creation
CREATE TABLE public.audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR NOT NULL,
  performed_by UUID NOT NULL,
  target_user_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(current_user_id(), 'admin'));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Create function to hash passwords (for initial setup only)
-- Note: In production, use Supabase Auth properly
CREATE OR REPLACE FUNCTION public.log_user_creation(
  _performed_by UUID,
  _target_user_id UUID,
  _details JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (action, performed_by, target_user_id, details)
  VALUES ('USER_CREATED', _performed_by, _target_user_id, _details)
  RETURNING log_id INTO _log_id;
  
  RETURN _log_id;
END;
$$;