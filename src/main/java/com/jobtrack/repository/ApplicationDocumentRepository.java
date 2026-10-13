package com.jobtrack.repository;

import com.jobtrack.entity.ApplicationDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationDocumentRepository extends JpaRepository<ApplicationDocument, Long> {

    List<ApplicationDocument> findByApplicationIdOrderByCreatedAtDesc(Long applicationId);

    Optional<ApplicationDocument> findByIdAndApplicationId(Long id, Long applicationId);
}
