-- Phase 4: Add indexes to support efficient search, filtering, sorting, and pagination.
-- No column changes are needed; V3 already established the status check constraint.

-- Index for ownership queries (user_id lookup is the most frequent filter)
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id
    ON job_applications (user_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_job_applications_status
    ON job_applications (status);

-- Index for date-range queries and default sort by appliedDate
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_date
    ON job_applications (applied_date);

-- Composite index for the common case: ownership + date sort
CREATE INDEX IF NOT EXISTS idx_job_applications_user_applied_date
    ON job_applications (user_id, applied_date DESC);

-- Indexes for text search columns (searches use LIKE '%...%' so full-text
-- indexes would require pg_trgm; plain indexes still help the planner)
CREATE INDEX IF NOT EXISTS idx_job_applications_company_name
    ON job_applications (lower(company_name));

CREATE INDEX IF NOT EXISTS idx_job_applications_job_role
    ON job_applications (lower(job_role));
