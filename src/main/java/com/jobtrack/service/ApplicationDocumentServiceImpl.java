package com.jobtrack.service;

import com.jobtrack.dto.DocumentDownloadPayload;
import com.jobtrack.dto.DocumentResponse;
import com.jobtrack.entity.ApplicationDocument;
import com.jobtrack.entity.DocumentType;
import com.jobtrack.entity.JobApplication;
import com.jobtrack.entity.Role;
import com.jobtrack.entity.User;
import com.jobtrack.exception.ResourceNotFoundException;
import com.jobtrack.repository.ApplicationDocumentRepository;
import com.jobtrack.repository.JobApplicationRepository;
import com.jobtrack.repository.UserRepository;
import com.jobtrack.storage.DocumentStorageService;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ApplicationDocumentServiceImpl implements ApplicationDocumentService {

    private static final long MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    private static final Map<String, List<String>> ALLOWED_TYPES = Map.of(
            "pdf", List.of("application/pdf"),
            "txt", List.of("text/plain"),
            "doc", List.of("application/msword", "application/x-msword"),
            "docx", List.of("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip", "application/x-zip-compressed")
    );

    private static final Set<String> FORBIDDEN_EXTENSIONS = Set.of(
            "exe", "bat", "cmd", "sh", "js", "html", "htm", "jar", "dll", "ps1", "vbs", "php", "py"
    );

    private final ApplicationDocumentRepository documentRepository;
    private final JobApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final ApplicationHistoryService historyService;
    private final DocumentStorageService storageService;

    public ApplicationDocumentServiceImpl(ApplicationDocumentRepository documentRepository,
                                          JobApplicationRepository applicationRepository,
                                          UserRepository userRepository,
                                          ApplicationHistoryService historyService,
                                          DocumentStorageService storageService) {
        this.documentRepository = documentRepository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.historyService = historyService;
        this.storageService = storageService;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("User not authenticated");
        }
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("User not found in database"));
    }

    private JobApplication getApplicationWithAccessCheck(Long applicationId) {
        User currentUser = getCurrentUser();
        JobApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Job application not found with id: " + applicationId));

        if (currentUser.getRole() != Role.ADMIN && !application.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You do not have permission to access this application");
        }
        return application;
    }

    @Override
    @Transactional
    public DocumentResponse uploadDocument(Long applicationId, MultipartFile file, DocumentType documentType) {
        User currentUser = getCurrentUser();
        JobApplication application = getApplicationWithAccessCheck(applicationId);

        if (documentType == null) {
            throw new IllegalArgumentException("Document type must be specified");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File size exceeds maximum allowed limit of 5 MB");
        }

        String originalFilename = StringUtils.cleanPath(Objects.requireNonNullElse(file.getOriginalFilename(), ""));
        if (originalFilename.isBlank() || originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new IllegalArgumentException("Invalid filename");
        }

        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex + 1).toLowerCase();
        }

        List<String> allowedMimes = ALLOWED_TYPES.get(extension);
        if (extension.isBlank() || FORBIDDEN_EXTENSIONS.contains(extension) || allowedMimes == null) {
            throw new IllegalArgumentException("Unsupported file type or extension: ." + extension);
        }

        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            final String cleanMime = contentType.toLowerCase().split(";")[0].trim();
            boolean mimeMatch = allowedMimes.stream().anyMatch(m -> cleanMime.equalsIgnoreCase(m));
            if (!mimeMatch) {
                throw new IllegalArgumentException("Unsupported content type '" + contentType + "' for extension ." + extension);
            }
            contentType = cleanMime;
        }

        String storedFileName = UUID.randomUUID().toString() + "." + extension;
        String absoluteStoragePath = storageService.storeFile(file, storedFileName);

        ApplicationDocument document = new ApplicationDocument(
                application,
                currentUser,
                originalFilename,
                storedFileName,
                contentType != null ? contentType : "application/octet-stream",
                file.getSize(),
                documentType,
                absoluteStoragePath
        );

        ApplicationDocument saved = documentRepository.save(document);

        historyService.recordHistory(application, currentUser, "DOCUMENT_UPLOADED", "Document uploaded: " + originalFilename);

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocuments(Long applicationId) {
        JobApplication application = getApplicationWithAccessCheck(applicationId);

        List<ApplicationDocument> documents = documentRepository.findByApplicationIdOrderByCreatedAtDesc(application.getId());

        return documents.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentDownloadPayload downloadDocument(Long applicationId, Long documentId) {
        JobApplication application = getApplicationWithAccessCheck(applicationId);

        ApplicationDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + documentId));

        if (!document.getApplication().getId().equals(application.getId())) {
            throw new ResourceNotFoundException("Document not found with id: " + documentId + " for application: " + applicationId);
        }

        Resource resource = storageService.loadFile(document.getStoredFileName());

        return new DocumentDownloadPayload(resource, document.getContentType(), document.getOriginalFileName());
    }

    @Override
    @Transactional
    public void deleteDocument(Long applicationId, Long documentId) {
        User currentUser = getCurrentUser();
        JobApplication application = getApplicationWithAccessCheck(applicationId);

        ApplicationDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + documentId));

        if (!document.getApplication().getId().equals(application.getId())) {
            throw new ResourceNotFoundException("Document not found with id: " + documentId + " for application: " + applicationId);
        }

        storageService.deleteFile(document.getStoredFileName());

        historyService.recordHistory(application, currentUser, "DOCUMENT_DELETED", "Document deleted: " + document.getOriginalFileName());
        documentRepository.delete(document);
    }

    private DocumentResponse mapToResponse(ApplicationDocument doc) {
        return new DocumentResponse(
                doc.getId(),
                doc.getApplication().getId(),
                doc.getOriginalFileName(),
                doc.getContentType(),
                doc.getFileSize(),
                doc.getDocumentType(),
                doc.getCreatedAt()
        );
    }
}
