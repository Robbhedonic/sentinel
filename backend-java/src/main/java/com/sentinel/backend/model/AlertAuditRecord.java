package com.sentinel.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "alert_audit", indexes = {
    @Index(name = "idx_alert_audit_alert_id", columnList = "alert_id")
})
public class AlertAuditRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "alert_id", nullable = false, length = 96)
    private String alertId;

    @Column(name = "previous_status", nullable = false, length = 16)
    private String previousStatus;

    @Column(name = "new_status", nullable = false, length = 16)
    private String newStatus;

    @Column(nullable = false, length = 96)
    private String username;

    @Column(name = "changed_at", nullable = false)
    private Instant changedAt;

    @PrePersist
    void onCreate() {
        changedAt = Instant.now();
    }

    public String getAlertId() { return alertId; }
    public void setAlertId(String alertId) { this.alertId = alertId; }
    public String getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(String previousStatus) { this.previousStatus = previousStatus; }
    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public Instant getChangedAt() { return changedAt; }
}
