package com.sentinel.backend.web.dto;

import com.sentinel.backend.model.InvestigationCommentRecord;

import java.time.Instant;

public record InvestigationCommentDto(
    String alertId,
    String author,
    String comment,
    Instant createdAt
) {
    public static InvestigationCommentDto from(InvestigationCommentRecord record) {
        return new InvestigationCommentDto(
            record.getAlertId(),
            record.getAuthor(),
            record.getComment(),
            record.getCreatedAt()
        );
    }
}
