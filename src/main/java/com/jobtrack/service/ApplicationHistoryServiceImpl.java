package com.jobtrack.service;

import com.jobtrack.dto.HistoryResponse;
import com.jobtrack.entity.ApplicationHistory;
import com.jobtrack.entity.JobApplication;
import com.jobtrack.entity.Role;
import com.jobtrack.entity.User;
import com.jobtrack.exception.ResourceNotFoundException;
import com.jobtrack.repository.ApplicationHistoryRepository;
import com.jobtrack.repository.JobApplicationRepository;
import com.jobtrack.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ApplicationHistoryServiceImpl implements ApplicationHistoryService {

    private final ApplicationHistoryRepository historyRepository;
    private final JobApplicationRepository applicationRepository;
    private final UserRepository userRepository;

    public ApplicationHistoryServiceImpl(ApplicationHistoryRepository historyRepository,
                                         JobApplicationRepository applicationRepository,
                                         UserRepository userRepository) {
        this.historyRepository = historyRepository;
        this.applicationRepository = applicationRepository;
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
    @Transactional
    public void recordHistory(JobApplication application, User user, String action, String description) {
        ApplicationHistory history = new ApplicationHistory(application, user, action, description);
        historyRepository.save(history);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HistoryResponse> getApplicationHistory(Long applicationId) {
        User currentUser = getCurrentUser();

        JobApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Job application not found with id: " + applicationId));

        // Ownership enforcement
        if (currentUser.getRole() != Role.ADMIN && !application.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You do not have permission to view history for this application");
        }

        List<ApplicationHistory> historyList = historyRepository.findByApplicationIdOrderByCreatedAtDesc(applicationId);

        return historyList.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private HistoryResponse mapToResponse(ApplicationHistory history) {
        return new HistoryResponse(
                history.getId(),
                history.getApplication().getId(),
                history.getUser().getId(),
                history.getUser().getUsername(),
                history.getAction(),
                history.getDescription(),
                history.getCreatedAt()
        );
    }
}
