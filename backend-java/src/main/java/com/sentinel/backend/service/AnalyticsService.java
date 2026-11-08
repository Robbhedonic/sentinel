package com.sentinel.backend.service;

import com.sentinel.backend.repository.FraudAlertRecordRepository;
import com.sentinel.backend.repository.TransactionRecordRepository;
import com.sentinel.backend.web.dto.AnalyticsOverviewDto;
import com.sentinel.backend.web.dto.CountryCountDto;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class AnalyticsService {

    private final TransactionRecordRepository transactionRepository;
    private final FraudAlertRecordRepository alertRepository;

    public AnalyticsService(TransactionRecordRepository transactionRepository,
                            FraudAlertRecordRepository alertRepository) {
        this.transactionRepository = transactionRepository;
        this.alertRepository = alertRepository;
    }

    public AnalyticsOverviewDto overview() {
        long transactionsTotal = transactionRepository.count();
        long alertsTotal = alertRepository.count();
        long openAlerts = alertRepository.countOpenAlerts();
        double averageRiskScore = transactionRepository.averageRiskScore();
        BigDecimal averageAmount = transactionRepository.averageAmount();

        List<CountryCountDto> topCountries = transactionRepository.topCountriesRaw()
            .stream()
            .limit(5)
            .map(row -> new CountryCountDto((String) row[0], ((Number) row[1]).longValue()))
            .toList();

        return new AnalyticsOverviewDto(
            transactionsTotal,
            alertsTotal,
            openAlerts,
            averageRiskScore,
            averageAmount,
            topCountries
        );
    }
}
