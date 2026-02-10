package de.schrell.drives.config.multitenancy;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class InitializationNotificationFilterTest {

    @AfterEach
    void cleanup() {
        TenantContext.clear();
    }

    @Test
    void shouldSetHeaderWhenInitializationFlagConsumed() throws ServletException, IOException {
        DatabaseInitializationTracker tracker = mock(DatabaseInitializationTracker.class);
        when(tracker.consumeInitializationFlag("t1")).thenReturn(true);
        InitializationNotificationFilter filter = new InitializationNotificationFilter(tracker);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/drives");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        TenantContext.setCurrentTenant("t1");

        filter.doFilter(request, response, chain);

        assertThat(response.getHeader(InitializationNotificationFilter.INITIALIZED_HEADER)).isEqualTo("true");
        verify(tracker, times(1)).consumeInitializationFlag("t1");
    }

    @Test
    void shouldNotSetHeaderWhenFlagNotConsumed() throws ServletException, IOException {
        DatabaseInitializationTracker tracker = mock(DatabaseInitializationTracker.class);
        when(tracker.consumeInitializationFlag("t2")).thenReturn(false);
        InitializationNotificationFilter filter = new InitializationNotificationFilter(tracker);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/drives");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        TenantContext.setCurrentTenant("t2");

        filter.doFilter(request, response, chain);

        assertThat(response.getHeader(InitializationNotificationFilter.INITIALIZED_HEADER)).isNull();
        verify(tracker, times(1)).consumeInitializationFlag("t2");
    }

    @Test
    void shouldNotCheckFlagForInitializationStatusEndpoint() throws ServletException, IOException {
        DatabaseInitializationTracker tracker = mock(DatabaseInitializationTracker.class);
        InitializationNotificationFilter filter = new InitializationNotificationFilter(tracker);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/initialization-status");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        TenantContext.setCurrentTenant("t3");

        filter.doFilter(request, response, chain);

        verify(tracker, never()).consumeInitializationFlag(Mockito.any());
        assertThat(response.getHeader(InitializationNotificationFilter.INITIALIZED_HEADER)).isNull();
    }
}
