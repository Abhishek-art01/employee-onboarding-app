-- Migration 001: Add employee_code sequence and auto-generation
-- Run: psql -d onboarding_db -f migrations/001_add_employee_code.sql

CREATE SEQUENCE IF NOT EXISTS emp_code_seq START 1000 INCREMENT 1;

CREATE OR REPLACE FUNCTION generate_employee_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employee_code IS NULL THEN
    NEW.employee_code := 'EMP' || LPAD(nextval('emp_code_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_emp_code
  BEFORE INSERT ON users FOR EACH ROW EXECUTE FUNCTION generate_employee_code();
