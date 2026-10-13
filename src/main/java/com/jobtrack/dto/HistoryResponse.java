package com.jobtrack.dto;

import java.time.LocalDateTime;

public class HistoryResponse {

    private Long id;
    private Long applicationId;
    private Long userId;
    private String username;
    private String action;
    private String description;
    private LocalDateTime createdAt;

    public HistoryResponse() {}

    public HistoryResponse(Long id, Long applicationId, Long userId, String username, String action, String description, LocalDateTime createdAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.userId = userId;
        this.username = username;
        this.action = action;
        this.description = description;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(Long applicationId) {
        this.applicationId = applicationId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
