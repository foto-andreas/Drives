package de.schrell.drives.config.multitenancy;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class MultiTenantDataSourceConfigurationTest {

    @AfterEach
    void cleanup() {
        TenantContext.clear();
    }

    @Test
    void createsAndInitializesTenantDatabaseOnFirstAccess_onlyOnce() throws Exception {
        DatabaseInitializationTracker tracker = mock(DatabaseInitializationTracker.class);
        MultiTenantDataSourceConfiguration cfg = new MultiTenantDataSourceConfiguration(
                "jdbc:h2:mem:drives", // use in-memory h2 for tests
                "sa",
                "password",
                "org.h2.Driver",
                tracker
        );

        DataSource ds = cfg.dataSource();
        // ignore default initialization that happens during bean creation
        reset(tracker);

        // first access with tenant 'acme' should initialize schema and mark initialized
        TenantContext.setCurrentTenant("acme");
        try (Connection c = ds.getConnection()) {
            DatabaseMetaData meta = c.getMetaData();
            try (ResultSet tables = meta.getTables(null, null, "DRIVE_TEMPLATE", new String[]{"TABLE"})) {
                assertThat(tables.next()).isTrue();
            }
        }
        verify(tracker, times(1)).markInitialized("acme");

        // second access must not initialize again
        reset(tracker);
        try (Connection c = ds.getConnection()) {
            DatabaseMetaData meta = c.getMetaData();
            try (ResultSet tables = meta.getTables(null, null, "DRIVE_TEMPLATE", new String[]{"TABLE"})) {
                assertThat(tables.next()).isTrue();
            }
        }
        verifyNoInteractions(tracker);
    }
}
