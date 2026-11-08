package com.sentinel.backend.repository;

import com.sentinel.backend.model.TransactionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface TransactionRecordRepository extends JpaRepository<TransactionRecord, Long>, JpaSpecificationExecutor<TransactionRecord> {

    Optional<TransactionRecord> findByTransactionId(String transactionId);
}
