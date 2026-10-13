package com.jobtrack.service;

import com.jobtrack.dto.DocumentDownloadPayload;
import com.jobtrack.dto.DocumentResponse;
import com.jobtrack.entity.DocumentType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ApplicationDocumentService {

    DocumentResponse uploadDocument(Long applicationId, MultipartFile file, DocumentType documentType);

    List<DocumentResponse> getDocuments(Long applicationId);

    DocumentDownloadPayload downloadDocument(Long applicationId, Long documentId);

    void deleteDocument(Long applicationId, Long documentId);
}
