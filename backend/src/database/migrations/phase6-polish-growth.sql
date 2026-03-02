-- Phase 6: Product Polish & Growth Engine
-- Run this migration manually against your PostgreSQL database
-- Date: 2026-03-01

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. New table: onboarding_progress
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  current_step INT NOT NULL DEFAULT 1,
  completed_steps JSONB NOT NULL DEFAULT '[]',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_progress_org
  ON onboarding_progress(organization_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. New table: notifications
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_org_read_date
  ON notifications(organization_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications(user_id, is_read)
  WHERE user_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Add onboarding settings column to organizations (via settings JSONB)
--    No schema change needed — we use the existing settings JSONB column.
--    These values are set programmatically by OnboardingService.
-- ──────────────────────────────────────────────────────────────────────────────

-- Trigger to auto-update updated_at on onboarding_progress
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON onboarding_progress;
CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
