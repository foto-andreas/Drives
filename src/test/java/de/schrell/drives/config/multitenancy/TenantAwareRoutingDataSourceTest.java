package de.schrell.drives.config.multitenancy;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TenantAwareRoutingDataSourceTest {

    private static class ExposedRouting extends TenantAwareRoutingDataSource {
        public Object key() { return determineCurrentLookupKey(); }
    }

    @AfterEach
    void cleanup() {
        TenantContext.clear();
    }

    @Test
    void determineCurrentLookupKey_returnsCurrentTenant() {
        ExposedRouting routing = new ExposedRouting();
        assertThat(routing.key()).isNull();
        TenantContext.setCurrentTenant("acme");
        assertThat(routing.key()).isEqualTo("acme");
    }
}
