package com.sentinel.backend.web;

import com.sentinel.backend.service.PipelineIngestionService;
import com.sentinel.backend.web.dto.PipelineHealthDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health/pipeline")
public class PipelineHealthController {

    private final PipelineIngestionService ingestionService;

    public PipelineHealthController(PipelineIngestionService ingestionService) {
        this.ingestionService = ingestionService;
    }

    @GetMapping
    public PipelineHealthDto pipelineHealth() {
        return new PipelineHealthDto(
            ingestionService.transactionCount(),
            ingestionService.alertCount()
        );
    }
}
