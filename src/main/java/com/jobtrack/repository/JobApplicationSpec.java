package com.jobtrack.repository;

import com.jobtrack.entity.ApplicationStatus;
import com.jobtrack.entity.JobApplication;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Contains static factory methods that build JPA Specifications for
 * dynamic search / filter / date-range queries on JobApplication.
 *
 * Each method is null-safe: passing null means "no restriction on this field".
 */
public class JobApplicationSpec {

    private JobApplicationSpec() {}

    /**
     * Builds a combined Specification for:
     *   - owner scoping (always non-null for USER role; null = ADMIN sees all)
     *   - case-insensitive text search across company_name and job_role
     *   - exact status filter
     *   - appliedDate range (fromDate / toDate)
     */
    public static Specification<JobApplication> buildSpec(
            Long userId,
            String search,
            ApplicationStatus status,
            LocalDate fromDate,
            LocalDate toDate) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // --- Ownership scoping ---
            // userId == null only when an ADMIN calls getAllApplications;
            // otherwise restrict to the authenticated user's records.
            if (userId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), userId));
            }

            // --- Text search (case-insensitive) ---
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                Predicate companyMatch = cb.like(cb.lower(root.get("companyName")), pattern);
                Predicate roleMatch   = cb.like(cb.lower(root.get("jobRole")),     pattern);
                predicates.add(cb.or(companyMatch, roleMatch));
            }

            // --- Status filter ---
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            // --- Date range ---
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("appliedDate"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("appliedDate"), toDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
