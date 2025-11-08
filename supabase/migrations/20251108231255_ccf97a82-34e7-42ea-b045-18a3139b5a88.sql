-- Create scenarios table for user-created practice scenarios
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'mic',
  prompts JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create practice_sessions table for session history
CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
  prompts JSONB NOT NULL DEFAULT '[]'::jsonb,
  fluency_score INTEGER NOT NULL,
  word_count INTEGER NOT NULL,
  speech_rate INTEGER NOT NULL,
  filler_word_count INTEGER NOT NULL,
  transcript TEXT,
  audio_url TEXT,
  delivery_feedback JSONB NOT NULL DEFAULT '[]'::jsonb,
  content_feedback JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for scenarios
CREATE POLICY "Users can view their own scenarios"
  ON scenarios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scenarios"
  ON scenarios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenarios"
  ON scenarios FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenarios"
  ON scenarios FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for practice_sessions
CREATE POLICY "Users can view their own sessions"
  ON practice_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON practice_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_scenarios_user_id ON scenarios(user_id);
CREATE INDEX idx_scenarios_created_at ON scenarios(created_at DESC);
CREATE INDEX idx_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX idx_sessions_completed_at ON practice_sessions(completed_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for scenarios updated_at
CREATE TRIGGER update_scenarios_updated_at
  BEFORE UPDATE ON scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();