package com.sentinel.backend.web.dto;

public record LoginResponse(String token, String tokenType, String role) {
}
