package com.jobtrack.service;

import com.jobtrack.dto.DashboardSummaryResponse;
import com.jobtrack.dto.JobApplicationResponse;
import com.jobtrack.entity.ApplicationStatus;
import com.jobtrack.entity.JobApplication;
import com.jobtrack.entity.Role;
import com.jobtrack.entity.User;
import com.jobtrack.repository.JobApplicationRepository;
import com.jobtrack.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final JobApplicationRepository repository;
    private final UserRepository userRepository;

    public DashboardServiceImpl(JobApplicationRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("User not authenticated");
        }
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("User not found in database"));
    }

    @Override
    public DashboardSummaryResponse getDashboardSummary() {
        User currentUser = getCurrentUser();
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        long totalApplications;
        List<Object[]> groupedResults;

        if (isAdmin) {
            totalApplications = repository.count();
            groupedResults = repository.countApplicationsByStatusGroupedAll();
        } else {
            totalApplications = repository.countByUserId(currentUser.getId());
            groupedResults = repository.countApplicationsByStatusGroupedByUserId(currentUser.getId());
        }

        // Initialize status count map with zero for all enum values
        Map<ApplicationStatus, Long> counts = new EnumMap<>(ApplicationStatus.class);
        for (ApplicationStatus status : ApplicationStatus.values()) {
            counts.put(status, 0L);
        }

        // Populate counts from query results
        for (Object[] result : groupedResults) {
            ApplicationStatus status = (ApplicationStatus) result[0];
            Long count = (Long) result[1];
            if (status != null && count != null) {
                counts.put(status, count);
            }
        }

        return new DashboardSummaryResponse(
                totalApplications,
                counts.getOrDefault(ApplicationStatus.APPLIED, 0L),
                counts.getOrDefault(ApplicationStatus.SCREENING, 0L),
                counts.getOrDefault(ApplicationStatus.INTERVIEW, 0L),
                counts.getOrDefault(ApplicationStatus.OFFER, 0L),
                counts.getOrDefault(ApplicationStatus.REJECTED, 0L),
                counts.getOrDefault(ApplicationStatus.WITHDRAWN, 0L)
        );
    }

    @Override
    public List<JobApplicationResponse> getRecentApplications() {
        User currentUser = getCurrentUser();
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        List<JobApplication> recentApplications;
        if (isAdmin) {
            recentApplications = repository.findTop5ByOrderByAppliedDateDescCreatedAtDesc();
        } else {
            recentApplications = repository.findTop5ByUserIdOrderByAppliedDateDescCreatedAtDesc(currentUser.getId());
        }

        return recentApplications.stream()
                .map(this::mapEntityToResponse)
                .collect(Collectors.toList());
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
