package com.jobtrack.dto;

import java.util.List;

/**
 * Wrapper DTO that carries a page of job application results along with
 * standard Spring Data pagination metadata.
 */
public class PagedApplicationResponse {

    private List<JobApplicationResponse> content;
    private int currentPage;
    private int pageSize;
    private long totalElements;
    private int totalPages;

    public PagedApplicationResponse() {}

    public PagedApplicationResponse(List<JobApplicationResponse> content,
                                    int currentPage,
                                    int pageSize,
                                    long totalElements,
                                    int totalPages) {
        this.content = content;
        this.currentPage = currentPage;
        this.pageSize = pageSize;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
    }

    public List<JobApplicationResponse> getContent() { return content; }
    public void setContent(List<JobApplicationResponse> content) { this.content = content; }

    public int getCurrentPage() { return currentPage; }
    public void setCurrentPage(int currentPage) { this.currentPage = currentPage; }

    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = pageSize; }

    public long getTotalElements() { return totalElements; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }

    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
}
