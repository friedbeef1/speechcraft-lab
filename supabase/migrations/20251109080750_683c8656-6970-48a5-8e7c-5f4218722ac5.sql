-- Create rate_limits table to track API requests for abuse prevention
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('user', 'ip')),
  endpoint TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient rate limit queries
CREATE INDEX idx_rate_limits_lookup ON public.rate_limits(identifier, endpoint, requested_at);

-- Enable RLS on rate_limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage rate limits (edge functions use service role)
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create function to clean up old rate limit entries (older than 2 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE requested_at < now() - interval '2 hours';
END;
$$;

-- Create trigger to periodically clean up old entries
CREATE OR REPLACE FUNCTION public.trigger_cleanup_rate_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only clean up occasionally (10% chance on each insert)
  IF random() < 0.1 THEN
    PERFORM public.cleanup_old_rate_limits();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_rate_limits_trigger
AFTER INSERT ON public.rate_limits
FOR EACH ROW
EXECUTE FUNCTION public.trigger_cleanup_rate_limits();