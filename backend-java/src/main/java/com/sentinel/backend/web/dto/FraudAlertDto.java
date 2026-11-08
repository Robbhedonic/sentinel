package com.sentinel.backend.web.dto;

import com.sentinel.backend.model.FraudAlertRecord;

import java.time.Instant;

public record FraudAlertDto(
    String alertId,
    String transactionId,
    String accountId,
    Integer riskScore,
    String riskLevel,
    String status,
    String findingsJson,
    Instant createdAt
) {
    public static FraudAlertDto from(FraudAlertRecord record) {
        return new FraudAlertDto(
            record.getAlertId(),
            record.getTransactionId(),
            record.getAccountId(),
            record.getRiskScore(),
            record.getRiskLevel(),
            record.getStatus(),
            record.getFindingsJson(),
            record.getCreatedAt()
        );
    }
}
