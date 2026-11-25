package com.sentinel.backend.web;

import com.sentinel.backend.model.InvestigationCommentRecord;
import com.sentinel.backend.model.InvestigationRecord;
import com.sentinel.backend.repository.InvestigationCommentRecordRepository;
import com.sentinel.backend.repository.InvestigationRecordRepository;
import com.sentinel.backend.web.dto.InvestigationCommentRequest;
import com.sentinel.backend.web.dto.InvestigationRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvestigationControllerTest {

    @Mock
    InvestigationRecordRepository investigationRepository;

    @Mock
    InvestigationCommentRecordRepository commentRepository;

    @InjectMocks
    InvestigationController controller;

    Authentication authentication = new UsernamePasswordAuthenticationToken("analyst", null, List.of());

    @Test
    void createsInvestigationForAlert() {
        when(investigationRepository.findByAlertId("AL-1")).thenReturn(Optional.empty());
        when(investigationRepository.save(any(InvestigationRecord.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        var response = controller.upsert(
            "AL-1",
            new InvestigationRequest("analyst", "IN_REVIEW", "Needs validation"),
            authentication
        );

        assertEquals("AL-1", response.alertId());
        assertEquals("IN_REVIEW", response.status());
        verify(investigationRepository).save(any(InvestigationRecord.class));
    }

    @Test
    void rejectsInvalidInvestigationStatus() {
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> controller.upsert(
                "AL-1",
                new InvestigationRequest("analyst", "UNKNOWN", "Summary"),
                authentication
            )
        );

        assertEquals(400, exception.getStatusCode().value());
    }

    @Test
    void addsCommentToInvestigation() {
        when(commentRepository.save(any(InvestigationCommentRecord.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        var response = controller.addComment(
            "AL-1",
            new InvestigationCommentRequest("Validated evidence"),
            authentication
        );

        assertEquals("AL-1", response.alertId());
        assertEquals("Validated evidence", response.comment());
        assertEquals("analyst", response.author());
        verify(commentRepository).save(any(InvestigationCommentRecord.class));
    }
}
