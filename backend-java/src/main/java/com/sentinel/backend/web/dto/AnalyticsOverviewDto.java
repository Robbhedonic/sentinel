package com.sentinel.backend.web.dto;

import java.math.BigDecimal;
import java.util.List;

public record AnalyticsOverviewDto(
    long transactionsTotal,
    long alertsTotal,
    long openAlerts,
    double averageRiskScore,
    BigDecimal averageAmount,
    List<CountryCountDto> topCountries
) {
}
