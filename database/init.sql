-- ══════════════════════════════════════════════════════════════════
-- Employee Onboarding System — PostgreSQL Schema
-- ══════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUM TYPES ───────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('employee','manager','hr_executive','hr_admin','super_admin');
CREATE TYPE form_status AS ENUM ('draft','submitted','under_review','requires_correction','approved','rejected');
CREATE TYPE doc_verification_status AS ENUM ('pending','verified','rejected');
CREATE TYPE otp_purpose AS ENUM ('register','login','password_reset');

-- ─── USERS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  email_hash      CHAR(64) NOT NULL,          -- SHA-256 for fast lookups
  password_hash   TEXT NOT NULL,
  full_name       VARCHAR(100) NOT NULL,
  role            user_role NOT NULL DEFAULT 'employee',
  phone           VARCHAR(15),
  department      VARCHAR(100),
  manager_id      INT REFERENCES users(id) ON DELETE SET NULL,
  employee_code   VARCHAR(50) UNIQUE,
  joining_date    DATE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email       ON users(email);
CREATE INDEX idx_users_email_hash  ON users(email_hash);
CREATE INDEX idx_users_role        ON users(role);
CREATE INDEX idx_users_department  ON users(department);

-- ─── REFRESH TOKENS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  CHAR(64) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─── OTP TOKENS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose     otp_purpose NOT NULL,
  otp_hash    CHAR(64) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, purpose)
);

-- ─── ONBOARDING FORMS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_forms (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          form_status NOT NULL DEFAULT 'draft',
  current_step    VARCHAR(50) NOT NULL DEFAULT 'personal',
  form_data       JSONB NOT NULL DEFAULT '{}',
  reviewer_note   TEXT,
  reviewed_by     INT REFERENCES users(id),
  reviewed_at     TIMESTAMPTZ,
  submitted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_forms_user_id ON onboarding_forms(user_id);
CREATE INDEX idx_forms_status  ON onboarding_forms(status);
CREATE INDEX idx_forms_data    ON onboarding_forms USING GIN(form_data);

-- Auto-set submitted_at when status changes to 'submitted'
CREATE OR REPLACE FUNCTION set_submitted_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'submitted' AND OLD.status != 'submitted' THEN
    NEW.submitted_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_submitted_at
  BEFORE UPDATE ON onboarding_forms
  FOR EACH ROW EXECUTE FUNCTION set_submitted_at();

-- ─── DOCUMENTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id                    SERIAL PRIMARY KEY,
  user_id               INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  form_id               INT REFERENCES onboarding_forms(id) ON DELETE SET NULL,
  doc_type              VARCHAR(60) NOT NULL,
  original_name         VARCHAR(255) NOT NULL,
  s3_key                TEXT NOT NULL UNIQUE,
  mime_type             VARCHAR(100) NOT NULL,
  size_bytes            BIGINT NOT NULL,
  uploaded_by           INT NOT NULL REFERENCES users(id),
  verification_status   doc_verification_status NOT NULL DEFAULT 'pending',
  verification_note     TEXT,
  verified_by           INT REFERENCES users(id),
  verified_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_docs_user_id     ON documents(user_id);
CREATE INDEX idx_docs_doc_type    ON documents(doc_type);
CREATE INDEX idx_docs_verify_stat ON documents(verification_status);

-- ─── VERIFICATION LOGS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verification_logs (
  id                  SERIAL PRIMARY KEY,
  user_id             INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verification_type   VARCHAR(30) NOT NULL,    -- aadhaar | pan | bank
  success             BOOLEAN NOT NULL,
  response_summary    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vlog_user_id ON verification_logs(user_id);
CREATE INDEX idx_vlog_type    ON verification_logs(verification_type);

-- ─── AUDIT LOGS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id              BIGSERIAL PRIMARY KEY,
  user_id         INT REFERENCES users(id) ON DELETE SET NULL,
  action          VARCHAR(200) NOT NULL,
  resource        VARCHAR(100),
  method          VARCHAR(10),
  path            VARCHAR(500),
  status_code     SMALLINT,
  ip_address      INET,
  user_agent      VARCHAR(200),
  request_body    TEXT,
  duration_ms     INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Monthly partitions (create for current + next 3 months in production)
CREATE TABLE audit_logs_default PARTITION OF audit_logs DEFAULT;

CREATE INDEX idx_audit_user_id    ON audit_logs(user_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_action     ON audit_logs(action);

-- ─── CONSENT RECORDS (GDPR) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS consent_records (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type    VARCHAR(100) NOT NULL,    -- 'data_processing','marketing','aadhaar_storage'
  granted         BOOLEAN NOT NULL,
  ip_address      INET,
  user_agent      VARCHAR(200),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at      TIMESTAMPTZ,
  UNIQUE(user_id, consent_type)
);

-- ─── SEED: Default super admin account ──────────────────────────
-- Password: Admin@1234 (change immediately in production!)
INSERT INTO users (email, email_hash, password_hash, full_name, role, is_active, is_verified)
VALUES (
  'admin@company.com',
  encode(digest('admin@company.com', 'sha256'), 'hex'),
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeKjsj7nqY2fmXuN.',  -- Admin@1234
  'System Administrator',
  'super_admin',
  TRUE,
  TRUE
) ON CONFLICT (email) DO NOTHING;

-- ─── UPDATE TIMESTAMP TRIGGER ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

