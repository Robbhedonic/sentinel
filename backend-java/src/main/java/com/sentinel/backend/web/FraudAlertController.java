package com.sentinel.backend.web;

import com.sentinel.backend.repository.FraudAlertRecordRepository;
import com.sentinel.backend.model.FraudAlertRecord;
import com.sentinel.backend.web.dto.FraudAlertDto;
import com.sentinel.backend.web.dto.UpdateFraudAlertStatusRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Locale;
import java.util.Set;

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
            @RequestParam(required = false) Integer minRiskScore,
            @RequestParam(required = false) Integer maxRiskScore,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
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

        if (minRiskScore != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("riskScore"), minRiskScore));
        }

        if (maxRiskScore != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("riskScore"), maxRiskScore));
        }

        if (fromCreatedAt != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), fromCreatedAt));
        }

        if (toCreatedAt != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), toCreatedAt));
        }

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        var pageable = PageRequest.of(normalizedPage,
                normalizedSize,
                Sort.by(direction, resolveSortProperty(sortBy)));

        return alertRepository.findAll(spec, pageable).map(FraudAlertDto::from);
    }

    private String resolveSortProperty(String sortBy) {
        if (sortBy == null) {
            return "createdAt";
        }

        return switch (sortBy.toLowerCase(Locale.ROOT)) {
            case "riskscore", "risk_score" -> "riskScore";
            case "createdat", "created_at" -> "createdAt";
            default -> "createdAt";
        };
    }

    @PatchMapping("/{id}/status")
    public FraudAlertDto updateStatus(
            @PathVariable String id,
            @RequestBody UpdateFraudAlertStatusRequest request
    ) {
        Set<String> allowedStatuses = Set.of("OPEN", "UNDER_REVIEW", "DISMISSED", "CONFIRMED_FRAUD");

        if (request == null || request.status() == null || request.status().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
        }

        String normalizedStatus = request.status().trim().toUpperCase(Locale.ROOT);
        if (!allowedStatuses.contains(normalizedStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "status must be one of: OPEN, UNDER_REVIEW, DISMISSED, CONFIRMED_FRAUD"
            );
        }

        FraudAlertRecord alert = alertRepository.findByAlertId(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "fraud alert not found"));

        alert.setStatus(normalizedStatus);
        return FraudAlertDto.from(alertRepository.save(alert));
    }
}
