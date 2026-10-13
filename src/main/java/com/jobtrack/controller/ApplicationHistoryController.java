package com.jobtrack.controller;

import com.jobtrack.dto.HistoryResponse;
import com.jobtrack.service.ApplicationHistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications/{applicationId}/history")
public class ApplicationHistoryController {

    private final ApplicationHistoryService historyService;

    public ApplicationHistoryController(ApplicationHistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping
    public ResponseEntity<List<HistoryResponse>> getApplicationHistory(@PathVariable Long applicationId) {
        List<HistoryResponse> history = historyService.getApplicationHistory(applicationId);
        return ResponseEntity.ok(history);
    }
}
