package com.jobtrack.repository;

import com.jobtrack.entity.ApplicationComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationCommentRepository extends JpaRepository<ApplicationComment, Long> {

    List<ApplicationComment> findByApplicationIdOrderByCreatedAtDesc(Long applicationId);

    Optional<ApplicationComment> findByIdAndApplicationId(Long id, Long applicationId);

    Optional<ApplicationComment> findByIdAndUserId(Long id, Long userId);
}
