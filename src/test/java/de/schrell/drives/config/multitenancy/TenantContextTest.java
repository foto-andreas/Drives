package de.schrell.drives.config.multitenancy;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TenantContextTest {

    @AfterEach
    void cleanup() {
        TenantContext.clear();
    }

    @Test
    void setGetAndClearTenantContext() {
        assertThat(TenantContext.getCurrentTenant()).isNull();
        TenantContext.setCurrentTenant("foo");
        assertThat(TenantContext.getCurrentTenant()).isEqualTo("foo");
        TenantContext.clear();
        assertThat(TenantContext.getCurrentTenant()).isNull();
    }
}
