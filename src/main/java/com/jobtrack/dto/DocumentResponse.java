package com.jobtrack.dto;

import com.jobtrack.entity.DocumentType;
import java.time.LocalDateTime;

public class DocumentResponse {

    private Long id;
    private Long applicationId;
    private String originalFileName;
    private String contentType;
    private Long fileSize;
    private DocumentType documentType;
    private LocalDateTime createdAt;

    public DocumentResponse() {}

    public DocumentResponse(Long id, Long applicationId, String originalFileName, String contentType,
                            Long fileSize, DocumentType documentType, LocalDateTime createdAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.originalFileName = originalFileName;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.documentType = documentType;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(Long applicationId) {
        this.applicationId = applicationId;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public DocumentType getDocumentType() {
        return documentType;
    }

    public void setDocumentType(DocumentType documentType) {
        this.documentType = documentType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
