package com.jobtrack.service;

import com.jobtrack.dto.HistoryResponse;
import com.jobtrack.entity.JobApplication;
import com.jobtrack.entity.User;

import java.util.List;

public interface ApplicationHistoryService {

    void recordHistory(JobApplication application, User user, String action, String description);

    List<HistoryResponse> getApplicationHistory(Long applicationId);
}
