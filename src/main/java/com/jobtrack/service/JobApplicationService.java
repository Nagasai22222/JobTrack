package com.jobtrack.service;

import com.jobtrack.dto.JobApplicationRequest;
import com.jobtrack.dto.JobApplicationResponse;
import com.jobtrack.dto.PagedApplicationResponse;
import com.jobtrack.entity.ApplicationStatus;

import java.time.LocalDate;

public interface JobApplicationService {

    JobApplicationResponse createApplication(JobApplicationRequest request);

    /**
     * Returns a paginated, filtered, sorted list of applications.
     *
     * @param search    case-insensitive substring search across companyName and jobRole
     * @param status    optional filter on ApplicationStatus enum value
     * @param fromDate  optional lower bound on appliedDate (inclusive)
     * @param toDate    optional upper bound on appliedDate (inclusive)
     * @param sortBy    field name to sort by (whitelisted); default "appliedDate"
     * @param direction "asc" or "desc"; default "desc"
     * @param page      zero-based page index
     * @param size      page size (max 100)
     */
    PagedApplicationResponse getApplications(
            String search,
            ApplicationStatus status,
            LocalDate fromDate,
            LocalDate toDate,
            String sortBy,
            String direction,
            int page,
            int size);

    JobApplicationResponse getApplicationById(Long id);

    JobApplicationResponse updateApplication(Long id, JobApplicationRequest request);

    void deleteApplication(Long id);
}
