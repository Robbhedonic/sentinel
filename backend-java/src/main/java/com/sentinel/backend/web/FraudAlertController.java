package com.sentinel.backend.web;

import com.sentinel.backend.repository.FraudAlertRecordRepository;
import com.sentinel.backend.model.FraudAlertRecord;
import com.sentinel.backend.web.dto.FraudAlertDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/fraud-alerts")
public class FraudAlertController {

    private final FraudAlertRecordRepository alertRepository;

    public FraudAlertController(FraudAlertRecordRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    @GetMapping
    public Page<FraudAlertDto> listAlerts(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size,
        @RequestParam(required = false) String accountId,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String riskLevel,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        Instant fromCreatedAt,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        Instant toCreatedAt
    ) {
        int normalizedPage = Math.max(0, page);
        int normalizedSize = Math.max(1, Math.min(size, 500));

        Specification<FraudAlertRecord> spec = Specification.where(null);

        if (accountId != null && !accountId.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("accountId"), accountId));
        }

        if (status != null && !status.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status.toUpperCase()));
        }

        if (riskLevel != null && !riskLevel.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("riskLevel"), riskLevel.toUpperCase()));
        }

        if (fromCreatedAt != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), fromCreatedAt));
        }

        if (toCreatedAt != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), toCreatedAt));
        }

        var pageable = PageRequest.of(normalizedPage, normalizedSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        return alertRepository.findAll(spec, pageable).map(FraudAlertDto::from);
    }
}
