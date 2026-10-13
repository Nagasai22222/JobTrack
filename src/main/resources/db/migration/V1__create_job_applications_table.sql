CREATE TABLE job_applications (
    id BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    job_role VARCHAR(150) NOT NULL,
    location VARCHAR(100),
    status VARCHAR(30) NOT NULL,
    applied_date DATE,
    job_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
