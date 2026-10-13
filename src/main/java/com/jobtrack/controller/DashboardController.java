package com.jobtrack.controller;

import com.jobtrack.dto.DashboardSummaryResponse;
import com.jobtrack.dto.JobApplicationResponse;
import com.jobtrack.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping("/summary")
    public DashboardSummaryResponse getDashboardSummary() {
        return service.getDashboardSummary();
    }

    @GetMapping("/recent")
    public List<JobApplicationResponse> getRecentApplications() {
        return service.getRecentApplications();
    }
}
