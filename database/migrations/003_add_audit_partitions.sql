-- Migration 003: Create monthly audit log partitions
DO $$
DECLARE m DATE;
BEGIN
  FOR m IN SELECT generate_series(date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '3 months', INTERVAL '1 month')
  LOOP
    EXECUTE format('CREATE TABLE IF NOT EXISTS audit_logs_%s PARTITION OF audit_logs
      FOR VALUES FROM (%L) TO (%L)',
      to_char(m,'YYYY_MM'), m, m + INTERVAL '1 month');
  END LOOP;
END $$;
