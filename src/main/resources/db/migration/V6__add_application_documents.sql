-- V6__add_application_documents.sql

CREATE TABLE application_documents (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL UNIQUE,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_documents_application FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_documents_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_documents_file_size CHECK (file_size > 0),
    CONSTRAINT chk_documents_original_name CHECK (length(trim(original_file_name)) > 0),
    CONSTRAINT chk_documents_stored_name CHECK (length(trim(stored_file_name)) > 0),
    CONSTRAINT chk_documents_document_type CHECK (length(trim(document_type)) > 0)
);

CREATE INDEX idx_documents_app_id ON application_documents(application_id);
CREATE INDEX idx_documents_user_id ON application_documents(user_id);
CREATE INDEX idx_documents_app_created ON application_documents(application_id, created_at DESC);
