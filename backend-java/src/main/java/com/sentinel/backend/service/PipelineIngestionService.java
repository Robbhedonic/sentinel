package com.sentinel.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinel.backend.model.FraudAlertRecord;
import com.sentinel.backend.model.TransactionRecord;
import com.sentinel.backend.repository.FraudAlertRecordRepository;
import com.sentinel.backend.repository.TransactionRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

@Service
public class PipelineIngestionService {

    private static final Logger log = LoggerFactory.getLogger(PipelineIngestionService.class);

    private final ObjectMapper objectMapper;
    private final TransactionRecordRepository transactionRepository;
    private final FraudAlertRecordRepository alertRepository;

    public PipelineIngestionService(ObjectMapper objectMapper,
                                    TransactionRecordRepository transactionRepository,
                                    FraudAlertRecordRepository alertRepository) {
        this.objectMapper = objectMapper;
        this.transactionRepository = transactionRepository;
        this.alertRepository = alertRepository;
    }

    public void ingestScoredTransaction(String message) {
        try {
            JsonNode node = objectMapper.readTree(message);

            String transactionId = requiredText(node, "transaction_id");
            String accountId = requiredText(node, "account_id");
            String recipientId = requiredText(node, "recipient_id");
            String currency = requiredText(node, "currency");
            String transactionType = requiredText(node, "transaction_type");
            String country = requiredText(node, "country");
            String timestamp = requiredText(node, "timestamp");

            TransactionRecord record = transactionRepository
                .findByTransactionId(transactionId)
                .orElseGet(TransactionRecord::new);

            record.setTransactionId(transactionId);
            record.setAccountId(accountId);
            record.setRecipientId(recipientId);
            record.setAmount(BigDecimal.valueOf(node.path("amount").asDouble()));
            record.setCurrency(currency);
            record.setTransactionType(transactionType);
            record.setCountry(country);
            record.setTransactionTimestamp(parseInstantOrNow(timestamp));
            record.setSimulatedPattern(node.path("simulated_pattern").asText("UNKNOWN"));
            record.setRiskScore(node.path("risk_score").asInt(0));
            record.setRiskLevel(node.path("risk_level").asText("LOW"));
            record.setEventVersion(node.path("event_version").asInt(1));
            record.setEventType(node.path("event_type").asText("transaction_scored"));
            record.setSource(node.path("source").asText("fraud-engine-cpp"));
            record.setProcessedAt(parseInstantOrNow(node.path("processed_at").asText(Instant.now().toString())));

            transactionRepository.save(record);
        } catch (Exception ex) {
            log.warn("Failed to ingest scored transaction: {}", ex.getMessage());
        }
    }

    public void ingestAlert(String message) {
        try {
            JsonNode node = objectMapper.readTree(message);

            String alertId = requiredText(node, "alert_id");
            String transactionId = requiredText(node, "transaction_id");
            String accountId = requiredText(node, "account_id");

            FraudAlertRecord record = alertRepository
                .findByAlertId(alertId)
                .orElseGet(FraudAlertRecord::new);

            record.setAlertId(alertId);
            record.setTransactionId(transactionId);
            record.setAccountId(accountId);
            record.setRiskScore(node.path("risk_score").asInt(0));
            record.setRiskLevel(node.path("risk_level").asText("LOW"));
            record.setStatus(node.path("status").asText("OPEN"));
            record.setFindingsJson(node.path("findings").toString());
            record.setEventVersion(node.path("event_version").asInt(1));
            record.setEventType(node.path("event_type").asText("fraud_alert_generated"));
            record.setSource(node.path("source").asText("fraud-engine-cpp"));
            record.setCreatedAt(parseInstantOrNow(node.path("created_at").asText(Instant.now().toString())));

            alertRepository.save(record);
        } catch (Exception ex) {
            log.warn("Failed to ingest fraud alert: {}", ex.getMessage());
        }
    }

    public long transactionCount() {
        return transactionRepository.count();
    }

    public long alertCount() {
        return alertRepository.count();
    }

    private String requiredText(JsonNode node, String field) {
        String value = Optional.ofNullable(node.path(field).asText(null)).orElse("").trim();
        if (value.isEmpty()) {
            throw new IllegalArgumentException("missing required field: " + field);
        }
        return value;
    }

    private Instant parseInstantOrNow(String value) {
        try {
            return Instant.parse(value);
        } catch (Exception ignored) {
            return Instant.now();
        }
    }
}
