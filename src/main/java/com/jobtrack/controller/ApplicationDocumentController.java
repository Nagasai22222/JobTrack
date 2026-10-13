package com.jobtrack.controller;

import com.jobtrack.dto.DocumentDownloadPayload;
import com.jobtrack.dto.DocumentResponse;
import com.jobtrack.entity.DocumentType;
import com.jobtrack.service.ApplicationDocumentService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/applications/{applicationId}/documents")
public class ApplicationDocumentController {

    private final ApplicationDocumentService documentService;

    public ApplicationDocumentController(ApplicationDocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> uploadDocument(
            @PathVariable Long applicationId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentTypeStr) {

        DocumentType documentType;
        try {
            documentType = DocumentType.valueOf(documentTypeStr.toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid documentType: '" + documentTypeStr +
                    "'. Allowed values: RESUME, COVER_LETTER, OFFER_LETTER, JOB_DESCRIPTION, INTERVIEW_DOCUMENT, OTHER");
        }

        DocumentResponse response = documentService.uploadDocument(applicationId, file, documentType);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<DocumentResponse>> getDocuments(@PathVariable Long applicationId) {
        List<DocumentResponse> documents = documentService.getDocuments(applicationId);
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/{documentId}/download")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long applicationId,
            @PathVariable Long documentId) {

        DocumentDownloadPayload payload = documentService.downloadDocument(applicationId, documentId);

        String contentDisposition = "attachment; filename=\"" + payload.getOriginalFileName() + "\"";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                .contentType(MediaType.parseMediaType(payload.getContentType()))
                .body(payload.getResource());
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable Long applicationId,
            @PathVariable Long documentId) {

        documentService.deleteDocument(applicationId, documentId);
        return ResponseEntity.noContent().build();
    }
}
