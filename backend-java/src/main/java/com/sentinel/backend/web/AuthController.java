package com.sentinel.backend.web;

import com.sentinel.backend.security.JwtService;
import com.sentinel.backend.web.dto.LoginRequest;
import com.sentinel.backend.web.dto.LoginResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final JwtService jwtService;
    private final String demoUsername;
    private final String demoPassword;
    private final String adminUsername;
    private final String adminPassword;
    private final String auditorUsername;
    private final String auditorPassword;

    public AuthController(
        JwtService jwtService,
        @Value("${sentinel.security.demo-username}") String demoUsername,
        @Value("${sentinel.security.demo-password}") String demoPassword,
        @Value("${sentinel.security.admin-username}") String adminUsername,
        @Value("${sentinel.security.admin-password}") String adminPassword,
        @Value("${sentinel.security.auditor-username}") String auditorUsername,
        @Value("${sentinel.security.auditor-password}") String auditorPassword
    ) {
        this.jwtService = jwtService;
        this.demoUsername = demoUsername;
        this.demoPassword = demoPassword;
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
        this.auditorUsername = auditorUsername;
        this.auditorPassword = auditorPassword;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials");
        }

        String role;
        if (demoUsername.equals(request.username()) && demoPassword.equals(request.password())) {
            role = "ANALYST";
        } else if (adminUsername.equals(request.username()) && adminPassword.equals(request.password())) {
            role = "ADMIN";
        } else if (auditorUsername.equals(request.username()) && auditorPassword.equals(request.password())) {
            role = "AUDITOR";
        } else {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials");
        }

        return new LoginResponse(jwtService.generateToken(request.username(), role), "Bearer", role);
    }
}
