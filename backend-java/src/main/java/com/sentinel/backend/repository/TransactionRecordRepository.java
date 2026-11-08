package com.sentinel.backend.repository;

import com.sentinel.backend.model.TransactionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface TransactionRecordRepository extends JpaRepository<TransactionRecord, Long>, JpaSpecificationExecutor<TransactionRecord> {

    Optional<TransactionRecord> findByTransactionId(String transactionId);

    @Query("select coalesce(avg(t.riskScore), 0) from TransactionRecord t")
    Double averageRiskScore();

    @Query("select coalesce(avg(t.amount), 0) from TransactionRecord t")
    BigDecimal averageAmount();

    @Query("select t.country as country, count(t) as txCount from TransactionRecord t group by t.country order by count(t) desc")
    List<Object[]> topCountriesRaw();
}
