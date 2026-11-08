package com.sentinel.backend.web.dto;

public record PipelineHealthDto(long transactionsIngested, long alertsIngested) {
}
