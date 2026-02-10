package de.schrell.drives.drives.api.controllers;

import de.schrell.drives.config.multitenancy.DatabaseInitializationTracker;
import de.schrell.drives.config.multitenancy.TenantContext;
import de.schrell.drives.drives.api.dtos.InitializationStatusResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class InitializationControllerTest {

    @AfterEach
    void cleanup() {
        TenantContext.clear();
    }

    @Test
    void returnsInitializedTrueForCurrentTenant() {
        DatabaseInitializationTracker tracker = mock(DatabaseInitializationTracker.class);
        TenantContext.setCurrentTenant("t1");
        when(tracker.consumeInitializationFlag("t1")).thenReturn(true);
        InitializationController controller = new InitializationController(tracker);

        InitializationStatusResponse resp = controller.getInitializationStatus();
        assertThat(resp.initialized()).isTrue();
        verify(tracker).consumeInitializationFlag("t1");
    }

    @Test
    void usesDefaultTenantWhenNoTenantContext() {
        DatabaseInitializationTracker tracker = mock(DatabaseInitializationTracker.class);
        when(tracker.consumeInitializationFlag("default")).thenReturn(false);
        InitializationController controller = new InitializationController(tracker);

        InitializationStatusResponse resp = controller.getInitializationStatus();
        assertThat(resp.initialized()).isFalse();
        verify(tracker).consumeInitializationFlag("default");
    }
}
