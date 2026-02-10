package de.schrell.drives.config.multitenancy;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.java.Log;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Log
public class InitializationNotificationFilter extends OncePerRequestFilter {

    public static final String INITIALIZED_HEADER = "X-Db-Initialized";

    private final DatabaseInitializationTracker initializationTracker;

    public InitializationNotificationFilter(DatabaseInitializationTracker initializationTracker) {
        this.initializationTracker = initializationTracker;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        boolean isInitializationStatusRequest = request.getRequestURI() != null
                && request.getRequestURI().endsWith("/api/initialization-status");
        try {
            filterChain.doFilter(request, response);
        } finally {
            if (!isInitializationStatusRequest) {
                String tenantId = TenantContext.getCurrentTenant();
                String effectiveTenant = tenantId == null ? "default" : tenantId;
                boolean isInit = initializationTracker.consumeInitializationFlag(effectiveTenant);
                if (isInit) {
                    response.setHeader(INITIALIZED_HEADER, "true");
                }
            }
        }
    }
}