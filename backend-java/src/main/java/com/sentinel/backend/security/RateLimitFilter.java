package com.sentinel.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int WINDOW_SECONDS = 60;
    private static final int MAX_REQUESTS = 120;

    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {

        String path = request.getRequestURI();
        if (!path.startsWith("/api/v1/auth/login") && !request.getMethod().equals("PATCH")
            && !request.getMethod().equals("PUT") && !request.getMethod().equals("POST")
            && !request.getMethod().equals("DELETE")) {
            chain.doFilter(request, response);
            return;
        }

        String key = request.getRemoteAddr() + ":" + path;
        long now = System.currentTimeMillis() / 1000;
        WindowCounter counter = counters.computeIfAbsent(key, ignored -> new WindowCounter(now));

        synchronized (counter) {
            if (now - counter.windowStart >= WINDOW_SECONDS) {
                counter.windowStart = now;
                counter.count = 0;
            }
            counter.count++;
            if (counter.count > MAX_REQUESTS) {
                response.setStatus(429);
                response.setHeader("Retry-After", String.valueOf(WINDOW_SECONDS));
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"rate limit exceeded\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private static class WindowCounter {
        private long windowStart;
        private int count;

        private WindowCounter(long windowStart) {
            this.windowStart = windowStart;
        }
    }
}
