package com.sentinel.backend.web;

import com.sentinel.backend.model.FraudAlertRecord;
import com.sentinel.backend.repository.AlertAuditRecordRepository;
import com.sentinel.backend.repository.FraudAlertRecordRepository;
import com.sentinel.backend.web.dto.UpdateFraudAlertStatusRequest;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FraudAlertControllerTest {

    @Mock
    FraudAlertRecordRepository repository;

    @Mock
    AlertAuditRecordRepository auditRepository;

    @InjectMocks
    FraudAlertController controller;

    Authentication authentication = new UsernamePasswordAuthenticationToken("analyst", null, List.of());

    @Test
    void updatesStatusForExistingAlert() {
        FraudAlertRecord alert = new FraudAlertRecord();
        alert.setAlertId("AL-1");
        alert.setStatus("OPEN");

        when(repository.findByAlertId("AL-1")).thenReturn(Optional.of(alert));
        when(repository.save(alert)).thenReturn(alert);

        var response = controller.updateStatus(
            "AL-1",
            new UpdateFraudAlertStatusRequest("under_review"),
            authentication
        );

        assertEquals("UNDER_REVIEW", response.status());
        verify(repository).save(alert);
        verify(auditRepository).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void rejectsInvalidStatus() {
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> controller.updateStatus("AL-1", new UpdateFraudAlertStatusRequest("UNKNOWN"), authentication)
        );

        assertEquals(400, exception.getStatusCode().value());
    }

    @Test
    void rejectsMissingAlert() {
        when(repository.findByAlertId("AL-MISSING")).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> controller.updateStatus(
                "AL-MISSING",
                new UpdateFraudAlertStatusRequest("DISMISSED"),
                authentication
            )
        );

        assertEquals(404, exception.getStatusCode().value());
    }
}
