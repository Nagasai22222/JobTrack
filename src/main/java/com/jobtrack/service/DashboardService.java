package com.jobtrack.service;

import com.jobtrack.dto.DashboardSummaryResponse;
import com.jobtrack.dto.JobApplicationResponse;

import java.util.List;

public interface DashboardService {

    /**
     * Calculates summary metrics (total applications, status breakdown)
     * scoped to the authenticated user (or system-wide for ADMIN).
     */
    DashboardSummaryResponse getDashboardSummary();

    /**
     * Retrieves the top 5 most recent job applications for the authenticated user
     * (or system-wide for ADMIN).
     */
    List<JobApplicationResponse> getRecentApplications();
}
