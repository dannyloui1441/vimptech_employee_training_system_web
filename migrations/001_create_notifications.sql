-- ============================================================
-- Migration 001: In-App Notifications Table
-- Safe migration — uses IF NOT EXISTS, does NOT drop anything.
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('system_automatic', 'admin_manual')),
  event_type TEXT CHECK (event_type IN (
    'subject_assigned',
    'module_unlocked',
    'assessment_passed',
    'subject_completed',
    'general_broadcast'
  )),
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Indexes for fast employee notification retrieval
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read
  ON notifications(recipient_id, is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications(created_at DESC);

-- RLS + service role policy (matches existing table pattern)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "service role full access" ON notifications;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

CREATE POLICY "service role full access" ON notifications FOR ALL USING (true);
