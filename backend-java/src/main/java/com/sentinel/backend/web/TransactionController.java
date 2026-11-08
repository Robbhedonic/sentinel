package com.sentinel.backend.web;

import com.sentinel.backend.repository.TransactionRecordRepository;
import com.sentinel.backend.model.TransactionRecord;
import com.sentinel.backend.web.dto.TransactionDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final TransactionRecordRepository transactionRepository;

    public TransactionController(TransactionRecordRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @GetMapping
    public Page<TransactionDto> listTransactions(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size,
        @RequestParam(required = false) String accountId,
        @RequestParam(required = false) String riskLevel,
        @RequestParam(required = false) Integer minRiskScore,
        @RequestParam(required = false) Integer maxRiskScore,
        @RequestParam(required = false) BigDecimal minAmount,
        @RequestParam(required = false) BigDecimal maxAmount,
        @RequestParam(defaultValue = "processedAt") String sortBy,
        @RequestParam(defaultValue = "desc") String sortDir,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        Instant fromProcessedAt,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        Instant toProcessedAt
    ) {
        int normalizedPage = Math.max(0, page);
        int normalizedSize = Math.max(1, Math.min(size, 500));

        Specification<TransactionRecord> spec = Specification.where(null);

        if (accountId != null && !accountId.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("accountId"), accountId));
        }

        if (riskLevel != null && !riskLevel.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("riskLevel"), riskLevel.toUpperCase()));
        }

        if (minRiskScore != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("riskScore"), minRiskScore));
        }

        if (maxRiskScore != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("riskScore"), maxRiskScore));
        }

        if (minAmount != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("amount"), minAmount));
        }

        if (maxAmount != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("amount"), maxAmount));
        }

        if (fromProcessedAt != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("processedAt"), fromProcessedAt));
        }

        if (toProcessedAt != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("processedAt"), toProcessedAt));
        }

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        var pageable = PageRequest.of(normalizedPage,
                                      normalizedSize,
                                      Sort.by(direction, resolveSortProperty(sortBy)));

        return transactionRepository.findAll(spec, pageable).map(TransactionDto::from);
    }

    private String resolveSortProperty(String sortBy) {
        if (sortBy == null) {
            return "processedAt";
        }

        return switch (sortBy.toLowerCase(Locale.ROOT)) {
            case "riskscore", "risk_score" -> "riskScore";
            case "amount" -> "amount";
            case "transactiontimestamp", "transaction_timestamp" -> "transactionTimestamp";
            case "processedat", "processed_at" -> "processedAt";
            default -> "processedAt";
        };
    }
}
