package com.sentinel.backend.web.dto;

import com.sentinel.backend.model.AlertAuditRecord;

import java.time.Instant;

public record AlertAuditDto(
    String alertId,
    String previousStatus,
    String newStatus,
    String username,
    Instant changedAt
) {
    public static AlertAuditDto from(AlertAuditRecord record) {
        return new AlertAuditDto(
            record.getAlertId(),
            record.getPreviousStatus(),
            record.getNewStatus(),
            record.getUsername(),
            record.getChangedAt()
        );
    }
}
