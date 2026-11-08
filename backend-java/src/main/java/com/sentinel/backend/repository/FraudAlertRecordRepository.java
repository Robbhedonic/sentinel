package com.sentinel.backend.repository;

import com.sentinel.backend.model.FraudAlertRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface FraudAlertRecordRepository extends JpaRepository<FraudAlertRecord, Long>, JpaSpecificationExecutor<FraudAlertRecord> {

    Optional<FraudAlertRecord> findByAlertId(String alertId);

    @Query("select count(a) from FraudAlertRecord a where upper(a.status) = 'OPEN'")
    long countOpenAlerts();
}
