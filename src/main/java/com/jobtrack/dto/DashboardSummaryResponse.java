package com.jobtrack.dto;

public class DashboardSummaryResponse {

    private long totalApplications;
    private long applied;
    private long screening;
    private long interview;
    private long offers;
    private long rejected;
    private long withdrawn;

    public DashboardSummaryResponse() {}

    public DashboardSummaryResponse(long totalApplications,
                                    long applied,
                                    long screening,
                                    long interview,
                                    long offers,
                                    long rejected,
                                    long withdrawn) {
        this.totalApplications = totalApplications;
        this.applied = applied;
        this.screening = screening;
        this.interview = interview;
        this.offers = offers;
        this.rejected = rejected;
        this.withdrawn = withdrawn;
    }

    public long getTotalApplications() {
        return totalApplications;
    }

    public void setTotalApplications(long totalApplications) {
        this.totalApplications = totalApplications;
    }

    public long getApplied() {
        return applied;
    }

    public void setApplied(long applied) {
        this.applied = applied;
    }

    public long getScreening() {
        return screening;
    }

    public void setScreening(long screening) {
        this.screening = screening;
    }

    public long getInterview() {
        return interview;
    }

    public void setInterview(long interview) {
        this.interview = interview;
    }

    public long getOffers() {
        return offers;
    }

    public void setOffers(long offers) {
        this.offers = offers;
    }

    public long getRejected() {
        return rejected;
    }

    public void setRejected(long rejected) {
        this.rejected = rejected;
    }

    public long getWithdrawn() {
        return withdrawn;
    }

    public void setWithdrawn(long withdrawn) {
        this.withdrawn = withdrawn;
    }
}
