-- Add category field to practice_sessions for better analytics
ALTER TABLE public.practice_sessions 
ADD COLUMN IF NOT EXISTS category text;

-- Add individual skill scores for granular analytics
ALTER TABLE public.practice_sessions 
ADD COLUMN IF NOT EXISTS clarity_score numeric,
ADD COLUMN IF NOT EXISTS confidence_score numeric,
ADD COLUMN IF NOT EXISTS empathy_score numeric,
ADD COLUMN IF NOT EXISTS pacing_score numeric;

-- Function to clean up old sessions (keep only last 1000 per user)
CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.practice_sessions
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id 
    FROM public.practice_sessions 
    WHERE user_id = NEW.user_id 
    ORDER BY completed_at DESC 
    LIMIT 1000
  );
  RETURN NEW;
END;
$$;

-- Trigger to automatically cleanup after insert
DROP TRIGGER IF EXISTS trigger_cleanup_old_sessions ON public.practice_sessions;
CREATE TRIGGER trigger_cleanup_old_sessions
AFTER INSERT ON public.practice_sessions
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_sessions();