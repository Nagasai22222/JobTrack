-- Update any existing records with NULL or empty status to 'APPLIED'
UPDATE job_applications SET status = 'APPLIED' WHERE status IS NULL OR status = '';

-- Normalize any legacy status values to valid enum values
UPDATE job_applications SET status = 'APPLIED'    WHERE UPPER(status) = 'APPLIED';
UPDATE job_applications SET status = 'INTERVIEW'  WHERE UPPER(status) = 'INTERVIEW';
UPDATE job_applications SET status = 'OFFER'      WHERE UPPER(status) = 'OFFER';
UPDATE job_applications SET status = 'REJECTED'   WHERE UPPER(status) = 'REJECTED';
UPDATE job_applications SET status = 'WITHDRAWN'  WHERE UPPER(status) = 'WITHDRAWN';
UPDATE job_applications SET status = 'SCREENING'  WHERE UPPER(status) = 'SCREENING';

-- Set any remaining unknown statuses to APPLIED so the check constraint doesn't fail
UPDATE job_applications
SET status = 'APPLIED'
WHERE status NOT IN ('APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN', 'SCREENING');

-- Add check constraint for valid status values
ALTER TABLE job_applications
    ADD CONSTRAINT chk_status CHECK (status IN ('APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN', 'SCREENING'));
