package com.sentinel.backend.web.dto;

import com.sentinel.backend.model.TransactionRecord;

import java.math.BigDecimal;
import java.time.Instant;

public record TransactionDto(
    String transactionId,
    String accountId,
    String recipientId,
    BigDecimal amount,
    String currency,
    String transactionType,
    String country,
    Instant transactionTimestamp,
    String simulatedPattern,
    Integer riskScore,
    String riskLevel,
    Instant processedAt
) {
    public static TransactionDto from(TransactionRecord record) {
        return new TransactionDto(
            record.getTransactionId(),
            record.getAccountId(),
            record.getRecipientId(),
            record.getAmount(),
            record.getCurrency(),
            record.getTransactionType(),
            record.getCountry(),
            record.getTransactionTimestamp(),
            record.getSimulatedPattern(),
            record.getRiskScore(),
            record.getRiskLevel(),
            record.getProcessedAt()
        );
    }
}
