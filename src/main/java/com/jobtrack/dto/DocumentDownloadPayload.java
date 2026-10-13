package com.jobtrack.dto;

import org.springframework.core.io.Resource;

public class DocumentDownloadPayload {

    private final Resource resource;
    private final String contentType;
    private final String originalFileName;

    public DocumentDownloadPayload(Resource resource, String contentType, String originalFileName) {
        this.resource = resource;
        this.contentType = contentType;
        this.originalFileName = originalFileName;
    }

    public Resource getResource() {
        return resource;
    }

    public String getContentType() {
        return contentType;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }
}
