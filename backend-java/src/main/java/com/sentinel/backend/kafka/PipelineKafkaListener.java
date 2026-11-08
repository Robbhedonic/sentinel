package com.sentinel.backend.kafka;

import com.sentinel.backend.service.PipelineIngestionService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class PipelineKafkaListener {

    private final PipelineIngestionService ingestionService;

    public PipelineKafkaListener(PipelineIngestionService ingestionService) {
        this.ingestionService = ingestionService;
    }

    @KafkaListener(topics = "${sentinel.kafka.topics.scored}")
    public void onScoredTransaction(String message) {
        ingestionService.ingestScoredTransaction(message);
    }

    @KafkaListener(topics = "${sentinel.kafka.topics.alerts}")
    public void onFraudAlert(String message) {
        ingestionService.ingestAlert(message);
    }
}
