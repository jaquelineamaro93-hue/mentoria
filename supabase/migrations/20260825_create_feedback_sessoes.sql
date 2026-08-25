-- Create feedback_sessoes table
CREATE TABLE IF NOT EXISTS public.feedback_sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('feedback', 'nota', 'arquivo')),
  arquivo_url TEXT,
  data TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_feedback_sessoes_user_id ON public.feedback_sessoes(user_id);

-- Create index on data for ordering
CREATE INDEX IF NOT EXISTS idx_feedback_sessoes_data ON public.feedback_sessoes(data DESC);

-- Enable Row Level Security
ALTER TABLE public.feedback_sessoes ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own feedback
CREATE POLICY "Users can view their own feedback" ON public.feedback_sessoes
  FOR SELECT USING (auth.uid() = user_id);

-- Allow inserts (this will be controlled at application level)
CREATE POLICY "Allow feedback insertion" ON public.feedback_sessoes
  FOR INSERT WITH CHECK (true);
