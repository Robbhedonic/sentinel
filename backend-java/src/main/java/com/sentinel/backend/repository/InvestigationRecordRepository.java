package com.sentinel.backend.repository;

import com.sentinel.backend.model.InvestigationRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InvestigationRecordRepository extends JpaRepository<InvestigationRecord, Long> {
    Optional<InvestigationRecord> findByAlertId(String alertId);
}
