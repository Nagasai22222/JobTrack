package com.jobtrack.controller;

import com.jobtrack.dto.CommentRequest;
import com.jobtrack.dto.CommentResponse;
import com.jobtrack.service.ApplicationCommentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications/{applicationId}/comments")
public class ApplicationCommentController {

    private final ApplicationCommentService commentService;

    public ApplicationCommentController(ApplicationCommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable Long applicationId,
            @Valid @RequestBody CommentRequest request) {
        CommentResponse response = commentService.createComment(applicationId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long applicationId) {
        List<CommentResponse> response = commentService.getComments(applicationId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable Long applicationId,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request) {
        CommentResponse response = commentService.updateComment(applicationId, commentId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long applicationId,
            @PathVariable Long commentId) {
        commentService.deleteComment(applicationId, commentId);
        return ResponseEntity.noContent().build();
    }
}
