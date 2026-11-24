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

    public AuthController(
        JwtService jwtService,
        @Value("${sentinel.security.demo-username}") String demoUsername,
        @Value("${sentinel.security.demo-password}") String demoPassword
    ) {
        this.jwtService = jwtService;
        this.demoUsername = demoUsername;
        this.demoPassword = demoPassword;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        if (request == null
            || !demoUsername.equals(request.username())
            || !demoPassword.equals(request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials");
        }

        return new LoginResponse(jwtService.generateToken(demoUsername), "Bearer");
    }
}
