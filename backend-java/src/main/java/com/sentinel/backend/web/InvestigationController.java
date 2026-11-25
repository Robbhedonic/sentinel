package com.sentinel.backend.web;

import com.sentinel.backend.model.InvestigationCommentRecord;
import com.sentinel.backend.model.InvestigationRecord;
import com.sentinel.backend.repository.InvestigationCommentRecordRepository;
import com.sentinel.backend.repository.InvestigationRecordRepository;
import com.sentinel.backend.web.dto.InvestigationCommentDto;
import com.sentinel.backend.web.dto.InvestigationCommentRequest;
import com.sentinel.backend.web.dto.InvestigationDto;
import com.sentinel.backend.web.dto.InvestigationRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/investigations")
public class InvestigationController {

    private final InvestigationRecordRepository investigationRepository;
    private final InvestigationCommentRecordRepository commentRepository;

    public InvestigationController(
        InvestigationRecordRepository investigationRepository,
        InvestigationCommentRecordRepository commentRepository
    ) {
        this.investigationRepository = investigationRepository;
        this.commentRepository = commentRepository;
    }

    @GetMapping("/{alertId}")
    public InvestigationDto getByAlert(@PathVariable String alertId) {
        InvestigationRecord record = investigationRepository.findByAlertId(alertId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "investigation not found"));
        return InvestigationDto.from(record);
    }

    @PutMapping("/{alertId}")
    public InvestigationDto upsert(
        @PathVariable String alertId,
        @RequestBody InvestigationRequest request,
        Authentication authentication
    ) {
        Set<String> statuses = Set.of("OPEN", "IN_REVIEW", "CLOSED");
        String status = request.status() == null ? "OPEN" : request.status().trim().toUpperCase();

        if (!statuses.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid investigation status");
        }

        InvestigationRecord record = investigationRepository.findByAlertId(alertId).orElseGet(() -> {
            InvestigationRecord created = new InvestigationRecord();
            created.setAlertId(alertId);
            created.setStatus(status);
            return created;
        });

        record.setAssignedTo(request.assignedTo());
        record.setStatus(status);
        record.setSummary(request.summary());
        record.setUpdatedAt(Instant.now());

        return InvestigationDto.from(investigationRepository.save(record));
    }

    @GetMapping("/{alertId}/comments")
    public List<InvestigationCommentDto> comments(@PathVariable String alertId) {
        return commentRepository.findByAlertIdOrderByCreatedAtAsc(alertId)
            .stream()
            .map(InvestigationCommentDto::from)
            .toList();
    }

    @PostMapping("/{alertId}/comments")
    public InvestigationCommentDto addComment(
        @PathVariable String alertId,
        @RequestBody InvestigationCommentRequest request,
        Authentication authentication
    ) {
        if (request == null || request.comment() == null || request.comment().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "comment is required");
        }

        InvestigationCommentRecord record = new InvestigationCommentRecord();
        record.setAlertId(alertId);
        record.setAuthor(authentication != null ? authentication.getName() : "system");
        record.setComment(request.comment().trim());

        return InvestigationCommentDto.from(commentRepository.save(record));
    }
}
