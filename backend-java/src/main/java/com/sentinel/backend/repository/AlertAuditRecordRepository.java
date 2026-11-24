package com.sentinel.backend.repository;

import com.sentinel.backend.model.AlertAuditRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertAuditRecordRepository extends JpaRepository<AlertAuditRecord, Long> {
    List<AlertAuditRecord> findByAlertIdOrderByChangedAtDesc(String alertId);
}
