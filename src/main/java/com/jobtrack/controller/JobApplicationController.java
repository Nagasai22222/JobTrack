package com.jobtrack.controller;

import com.jobtrack.dto.JobApplicationRequest;
import com.jobtrack.dto.JobApplicationResponse;
import com.jobtrack.dto.PagedApplicationResponse;
import com.jobtrack.entity.ApplicationStatus;
import com.jobtrack.service.JobApplicationService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/applications")
public class JobApplicationController {

    private final JobApplicationService service;

    public JobApplicationController(JobApplicationService service) {
        this.service = service;
    }

    // -------------------------------------------------------------------------
    // POST /api/applications  — create
    // -------------------------------------------------------------------------

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JobApplicationResponse createApplication(
            @Valid @RequestBody JobApplicationRequest request) {
        return service.createApplication(request);
    }

    // -------------------------------------------------------------------------
    // GET /api/applications   — paginated list with optional search/filter/sort
    //
    // Supported query params:
    //   search      – case-insensitive substring across companyName and jobRole
    //   status      – enum: APPLIED | SCREENING | INTERVIEW | OFFER | REJECTED | WITHDRAWN
    //   fromDate    – lower bound on appliedDate  (yyyy-MM-dd, inclusive)
    //   toDate      – upper bound on appliedDate  (yyyy-MM-dd, inclusive)
    //   sortBy      – appliedDate | companyName | status | jobRole | createdAt  (default: appliedDate)
    //   direction   – asc | desc  (default: desc)
    //   page        – zero-based page index  (default: 0)
    //   size        – records per page, max 100  (default: 10)
    // -------------------------------------------------------------------------

    @GetMapping
    public PagedApplicationResponse getApplications(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false, defaultValue = "appliedDate") String sortBy,
            @RequestParam(required = false, defaultValue = "desc")  String direction,
            @RequestParam(required = false, defaultValue = "0")     int page,
            @RequestParam(required = false, defaultValue = "10")    int size) {

        return service.getApplications(
                search, status, fromDate, toDate, sortBy, direction, page, size);
    }

    // -------------------------------------------------------------------------
    // GET /api/applications/{id}  — single record
    // -------------------------------------------------------------------------

    @GetMapping("/{id}")
    public JobApplicationResponse getApplicationById(@PathVariable Long id) {
        return service.getApplicationById(id);
    }

    // -------------------------------------------------------------------------
    // PUT /api/applications/{id}  — full update
    // -------------------------------------------------------------------------

    @PutMapping("/{id}")
    public JobApplicationResponse updateApplication(
            @PathVariable Long id,
            @Valid @RequestBody JobApplicationRequest request) {
        return service.updateApplication(id, request);
    }

    // -------------------------------------------------------------------------
    // DELETE /api/applications/{id}
    // -------------------------------------------------------------------------

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteApplication(@PathVariable Long id) {
        service.deleteApplication(id);
    }
}
