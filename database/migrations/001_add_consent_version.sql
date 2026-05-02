-- migrations/001_add_consent_version.sql
ALTER TABLE onboarding_forms ADD COLUMN IF NOT EXISTS consent_version VARCHAR(10) DEFAULT 'v1.0';
CREATE INDEX IF NOT EXISTS idx_forms_consent ON onboarding_forms(consent_given, consent_timestamp);
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS entity_type VARCHAR(60),
  ADD COLUMN IF NOT EXISTS entity_id   VARCHAR(60),
  ADD COLUMN IF NOT EXISTS metadata    JSONB;
