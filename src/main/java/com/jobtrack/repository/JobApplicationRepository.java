package com.jobtrack.repository;

import com.jobtrack.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobApplicationRepository
        extends JpaRepository<JobApplication, Long>,
                JpaSpecificationExecutor<JobApplication> {

    /** Used by the service to fetch a specific application for a given owner. */
    Optional<JobApplication> findByIdAndUserId(Long id, Long userId);

    /** Count total applications for a specific user. */
    long countByUserId(Long userId);

    /** Grouped status counts for a specific user. */
    @Query("SELECT j.status, COUNT(j) FROM JobApplication j WHERE j.user.id = :userId GROUP BY j.status")
    List<Object[]> countApplicationsByStatusGroupedByUserId(@Param("userId") Long userId);

    /** Grouped status counts for all users (ADMIN). */
    @Query("SELECT j.status, COUNT(j) FROM JobApplication j GROUP BY j.status")
    List<Object[]> countApplicationsByStatusGroupedAll();

    /** Fetch top 5 recent applications for a specific user. */
    List<JobApplication> findTop5ByUserIdOrderByAppliedDateDescCreatedAtDesc(Long userId);

    /** Fetch top 5 recent applications across all users (ADMIN). */
    List<JobApplication> findTop5ByOrderByAppliedDateDescCreatedAtDesc();
}
