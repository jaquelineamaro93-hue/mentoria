-- Add admin_id column to feedback_sessoes table
ALTER TABLE feedback_sessoes
ADD COLUMN admin_id UUID REFERENCES auth.users(id);

-- Create index for admin_id for better query performance
CREATE INDEX idx_feedback_sessoes_admin_id ON feedback_sessoes(admin_id);
