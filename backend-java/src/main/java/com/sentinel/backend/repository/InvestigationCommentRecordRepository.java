package com.sentinel.backend.repository;

import com.sentinel.backend.model.InvestigationCommentRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InvestigationCommentRecordRepository extends JpaRepository<InvestigationCommentRecord, Long> {
    List<InvestigationCommentRecord> findByAlertIdOrderByCreatedAtAsc(String alertId);
}
