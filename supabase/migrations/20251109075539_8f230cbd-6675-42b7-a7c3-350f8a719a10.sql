-- Add UPDATE and DELETE RLS policies to practice_sessions table
CREATE POLICY "Users can update their own sessions"
ON practice_sessions 
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON practice_sessions 
FOR DELETE
USING (auth.uid() = user_id);