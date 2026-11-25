package com.sentinel.backend.web.dto;

import com.sentinel.backend.model.InvestigationRecord;

import java.time.Instant;

public record InvestigationDto(
    String alertId,
    String assignedTo,
    String status,
    String summary,
    Instant createdAt,
    Instant updatedAt
) {
    public static InvestigationDto from(InvestigationRecord record) {
        return new InvestigationDto(
            record.getAlertId(),
            record.getAssignedTo(),
            record.getStatus(),
            record.getSummary(),
            record.getCreatedAt(),
            record.getUpdatedAt()
        );
    }
}
