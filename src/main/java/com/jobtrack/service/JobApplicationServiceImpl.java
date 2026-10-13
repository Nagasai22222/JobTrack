package com.jobtrack.service;

import com.jobtrack.dto.JobApplicationRequest;
import com.jobtrack.dto.JobApplicationResponse;
import com.jobtrack.dto.PagedApplicationResponse;
import com.jobtrack.entity.ApplicationStatus;
import com.jobtrack.entity.JobApplication;
import com.jobtrack.entity.Role;
import com.jobtrack.entity.User;
import com.jobtrack.exception.JobApplicationNotFoundException;
import com.jobtrack.repository.JobApplicationRepository;
import com.jobtrack.repository.JobApplicationSpec;
import com.jobtrack.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class JobApplicationServiceImpl implements JobApplicationService {

    /** Maximum page size – prevents clients from requesting huge result sets. */
    private static final int MAX_PAGE_SIZE = 100;

    /**
     * Whitelisted sort fields: the key is the client-supplied string; the value
     * is the corresponding JPA field name on {@link JobApplication}.
     */
    private static final Set<String> ALLOWED_SORT_FIELDS =
            Set.of("appliedDate", "companyName", "status", "jobRole", "createdAt");

    private final JobApplicationRepository repository;
    private final UserRepository userRepository;
    private final ApplicationHistoryService historyService;

    public JobApplicationServiceImpl(JobApplicationRepository repository,
                                     UserRepository userRepository,
                                     ApplicationHistoryService historyService) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.historyService = historyService;
    }

    // -------------------------------------------------------------------------
    // Helper: resolve the currently-authenticated user from the security context
    // -------------------------------------------------------------------------

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("User not authenticated");
        }
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("User not found in database"));
    }

    // -------------------------------------------------------------------------
    // CRUD operations
    // -------------------------------------------------------------------------

    @Override
    @Transactional
    public JobApplicationResponse createApplication(JobApplicationRequest request) {
        User currentUser = getCurrentUser();
        JobApplication entity = new JobApplication();
        mapRequestToEntity(request, entity);
        entity.setUser(currentUser);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());

        JobApplication saved = repository.save(entity);

        historyService.recordHistory(saved, currentUser, "APPLICATION_CREATED", "Application created");

        return mapEntityToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedApplicationResponse getApplications(
            String search,
            ApplicationStatus status,
            LocalDate fromDate,
            LocalDate toDate,
            String sortBy,
            String direction,
            int page,
            int size) {

        // --- Validate sort field ---
        if (sortBy != null && !ALLOWED_SORT_FIELDS.contains(sortBy)) {
            throw new IllegalArgumentException(
                    "Unsupported sort field: '" + sortBy + "'. "
                    + "Allowed values: " + String.join(", ", ALLOWED_SORT_FIELDS));
        }

        // --- Validate sort direction ---
        if (direction != null && !direction.equalsIgnoreCase("asc") && !direction.equalsIgnoreCase("desc")) {
            throw new IllegalArgumentException(
                    "Invalid sort direction: '" + direction + "'. Allowed values: asc, desc");
        }

        // --- Validate pagination size ---
        if (size > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException(
                    "Page size must not exceed " + MAX_PAGE_SIZE + " records per request");
        }
        if (size < 1) {
            throw new IllegalArgumentException("Page size must be at least 1");
        }
        if (page < 0) {
            throw new IllegalArgumentException("Page index must be zero or greater");
        }

        // --- Defaults ---
        String resolvedSortBy = (sortBy == null || sortBy.isBlank()) ? "appliedDate" : sortBy;
        Sort.Direction resolvedDirection = (direction != null && direction.equalsIgnoreCase("asc"))
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        // --- Build pageable ---
        Pageable pageable = PageRequest.of(page, size, Sort.by(resolvedDirection, resolvedSortBy));

        // --- Ownership scoping ---
        User currentUser = getCurrentUser();
        Long userId = (currentUser.getRole() == Role.ADMIN) ? null : currentUser.getId();

        // --- Build specification ---
        Specification<JobApplication> spec =
                JobApplicationSpec.buildSpec(userId, search, status, fromDate, toDate);

        // --- Execute query ---
        Page<JobApplication> resultPage = repository.findAll(spec, pageable);

        List<JobApplicationResponse> content = resultPage.getContent()
                .stream()
                .map(this::mapEntityToResponse)
                .collect(Collectors.toList());

        return new PagedApplicationResponse(
                content,
                resultPage.getNumber(),
                resultPage.getSize(),
                resultPage.getTotalElements(),
                resultPage.getTotalPages());
    }

    @Override
    @Transactional(readOnly = true)
    public JobApplicationResponse getApplicationById(Long id) {
        JobApplication application = getEntityWithAccessCheck(id);
        return mapEntityToResponse(application);
    }

    @Override
    @Transactional
    public JobApplicationResponse updateApplication(Long id, JobApplicationRequest request) {
        User currentUser = getCurrentUser();
        JobApplication entity = getEntityWithAccessCheck(id);

        ApplicationStatus oldStatus = entity.getStatus();
        mapRequestToEntity(request, entity);
        entity.setUpdatedAt(LocalDateTime.now());

        JobApplication updated = repository.save(entity);
        ApplicationStatus newStatus = updated.getStatus();

        if (oldStatus != newStatus) {
            String desc = "Status changed from " + oldStatus + " to " + newStatus;
            historyService.recordHistory(updated, currentUser, "APPLICATION_STATUS_CHANGED", desc);
        } else {
            historyService.recordHistory(updated, currentUser, "APPLICATION_UPDATED", "Application updated");
        }

        return mapEntityToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteApplication(Long id) {
        User currentUser = getCurrentUser();
        JobApplication entity = getEntityWithAccessCheck(id);
        historyService.recordHistory(entity, currentUser, "APPLICATION_DELETED", "Application deleted");
        repository.delete(entity);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Fetches the application by ID and verifies the current user is the owner
     * (or is an ADMIN).
     */
    private JobApplication getEntityWithAccessCheck(Long id) {
        User currentUser = getCurrentUser();
        JobApplication application = repository.findById(id)
                .orElseThrow(() -> new JobApplicationNotFoundException(
                        "Job application not found with id: " + id));

        if (currentUser.getRole() != Role.ADMIN
                && !application.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You do not have permission to access this resource");
        }
        return application;
    }

    private void mapRequestToEntity(JobApplicationRequest request, JobApplication entity) {
        entity.setCompanyName(request.getCompanyName());
        entity.setJobRole(request.getJobRole());
        entity.setLocation(request.getLocation());
        entity.setStatus(request.getStatus());
        entity.setAppliedDate(request.getAppliedDate());
        entity.setJobUrl(request.getJobUrl());
        entity.setNotes(request.getNotes());
    }

    private JobApplicationResponse mapEntityToResponse(JobApplication entity) {
        JobApplicationResponse response = new JobApplicationResponse();
        response.setId(entity.getId());
        response.setCompanyName(entity.getCompanyName());
        response.setJobRole(entity.getJobRole());
        response.setLocation(entity.getLocation());
        response.setStatus(entity.getStatus());
        response.setAppliedDate(entity.getAppliedDate());
        response.setJobUrl(entity.getJobUrl());
        response.setNotes(entity.getNotes());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }
}
