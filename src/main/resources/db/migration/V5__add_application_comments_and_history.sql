-- V5__add_application_comments_and_history.sql

CREATE TABLE application_comments (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_comments_application FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_comments_content_not_empty CHECK (length(trim(content)) > 0),
    CONSTRAINT chk_comments_content_length CHECK (char_length(content) <= 2000)
);

CREATE INDEX idx_comments_app_id ON application_comments(application_id);
CREATE INDEX idx_comments_app_created ON application_comments(application_id, created_at DESC);
CREATE INDEX idx_comments_user_id ON application_comments(user_id);

CREATE TABLE application_history (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_history_application FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_history_action_not_empty CHECK (length(trim(action)) > 0)
);

CREATE INDEX idx_history_app_id ON application_history(application_id);
CREATE INDEX idx_history_app_created ON application_history(application_id, created_at DESC);
CREATE INDEX idx_history_user_id ON application_history(user_id);
