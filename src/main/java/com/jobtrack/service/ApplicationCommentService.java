package com.jobtrack.service;

import com.jobtrack.dto.CommentRequest;
import com.jobtrack.dto.CommentResponse;

import java.util.List;

public interface ApplicationCommentService {

    CommentResponse createComment(Long applicationId, CommentRequest request);

    List<CommentResponse> getComments(Long applicationId);

    CommentResponse updateComment(Long applicationId, Long commentId, CommentRequest request);

    void deleteComment(Long applicationId, Long commentId);
}
