package de.schrell.drives.drives.api.controllers;

import de.schrell.drives.config.multitenancy.DatabaseInitializationTracker;
import de.schrell.drives.config.multitenancy.TenantContext;
import de.schrell.drives.drives.api.dtos.InitializationStatusResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin
@RequiredArgsConstructor
public class InitializationController {

    private final DatabaseInitializationTracker initializationTracker;

    @GetMapping("/initialization-status")
    public InitializationStatusResponse getInitializationStatus() {
        String tenantId = TenantContext.getCurrentTenant();
        String effectiveTenant = tenantId == null ? "default" : tenantId;
        boolean initialized = initializationTracker.consumeInitializationFlag(effectiveTenant);
        return new InitializationStatusResponse(initialized);
    }
}