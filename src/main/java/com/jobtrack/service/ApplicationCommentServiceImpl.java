package com.jobtrack.service;

import com.jobtrack.dto.CommentRequest;
import com.jobtrack.dto.CommentResponse;
import com.jobtrack.entity.ApplicationComment;
import com.jobtrack.entity.JobApplication;
import com.jobtrack.entity.Role;
import com.jobtrack.entity.User;
import com.jobtrack.exception.ResourceNotFoundException;
import com.jobtrack.repository.ApplicationCommentRepository;
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
public class ApplicationCommentServiceImpl implements ApplicationCommentService {

    private final ApplicationCommentRepository commentRepository;
    private final JobApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final ApplicationHistoryService historyService;

    public ApplicationCommentServiceImpl(ApplicationCommentRepository commentRepository,
                                         JobApplicationRepository applicationRepository,
                                         UserRepository userRepository,
                                         ApplicationHistoryService historyService) {
        this.commentRepository = commentRepository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.historyService = historyService;
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
    public CommentResponse createComment(Long applicationId, CommentRequest request) {
        User currentUser = getCurrentUser();
        JobApplication application = getApplicationWithAccessCheck(applicationId);

        ApplicationComment comment = new ApplicationComment(application, currentUser, request.getContent());
        ApplicationComment saved = commentRepository.save(comment);

        historyService.recordHistory(application, currentUser, "COMMENT_ADDED", "Comment added");

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long applicationId) {
        JobApplication application = getApplicationWithAccessCheck(applicationId);

        List<ApplicationComment> comments = commentRepository.findByApplicationIdOrderByCreatedAtDesc(application.getId());

        return comments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CommentResponse updateComment(Long applicationId, Long commentId, CommentRequest request) {
        User currentUser = getCurrentUser();
        JobApplication application = getApplicationWithAccessCheck(applicationId);

        ApplicationComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));

        if (!comment.getApplication().getId().equals(applicationId)) {
            throw new ResourceNotFoundException("Comment not found with id: " + commentId + " for application id: " + applicationId);
        }

        if (currentUser.getRole() != Role.ADMIN && !comment.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You do not have permission to update this comment");
        }

        comment.setContent(request.getContent());
        ApplicationComment updated = commentRepository.save(comment);

        historyService.recordHistory(application, currentUser, "COMMENT_UPDATED", "Comment updated");

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteComment(Long applicationId, Long commentId) {
        User currentUser = getCurrentUser();
        JobApplication application = getApplicationWithAccessCheck(applicationId);

        ApplicationComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));

        if (!comment.getApplication().getId().equals(applicationId)) {
            throw new ResourceNotFoundException("Comment not found with id: " + commentId + " for application id: " + applicationId);
        }

        if (currentUser.getRole() != Role.ADMIN && !comment.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You do not have permission to delete this comment");
        }

        historyService.recordHistory(application, currentUser, "COMMENT_DELETED", "Comment deleted");
        commentRepository.delete(comment);
    }

    private CommentResponse mapToResponse(ApplicationComment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getApplication().getId(),
                comment.getUser().getId(),
                comment.getUser().getUsername(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }
}
