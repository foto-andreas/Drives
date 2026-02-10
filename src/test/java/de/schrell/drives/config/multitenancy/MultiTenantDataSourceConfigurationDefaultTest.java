package de.schrell.drives.config.multitenancy;

import org.junit.jupiter.api.Test;

import javax.sql.DataSource;

import static org.mockito.Mockito.*;

class MultiTenantDataSourceConfigurationDefaultTest {

    @Test
    void initializesDefaultDataSourceOnCreation() {
        DatabaseInitializationTracker tracker = mock(DatabaseInitializationTracker.class);
        MultiTenantDataSourceConfiguration cfg = new MultiTenantDataSourceConfiguration(
                "jdbc:h2:mem:drivesdefault",
                "sa",
                "password",
                "org.h2.Driver",
                tracker
        );

        DataSource ds = cfg.dataSource();
        verify(tracker, atLeastOnce()).markInitialized("default");
    }
}
