package de.schrell.drives.config.multitenancy;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.sql.DataSource;
import java.sql.SQLException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MultiTenantDataSourceConfigurationPrivateMethodsTest {

    @Test
    void createDataSourceBuildsTenantSpecificUrlAndMarksInitialization() {
        DatabaseInitializationTracker tracker = mock(DatabaseInitializationTracker.class);
        MultiTenantDataSourceConfiguration cfg = new MultiTenantDataSourceConfiguration(
                "jdbc:h2:mem:drives",
                "sa",
                "password",
                "org.h2.Driver",
                tracker
        );

        HikariDataSource dataSource = (HikariDataSource) ReflectionTestUtils.invokeMethod(
                cfg,
                "createDataSource",
                "tenant42"
        );

        assertThat(dataSource.getJdbcUrl()).isEqualTo("jdbc:h2:mem:drives_tenant42");
        assertThat(dataSource.getUsername()).isEqualTo("sa");
        assertThat(dataSource.getPassword()).isEqualTo("password");
        assertThat(dataSource.getDriverClassName()).isEqualTo("org.h2.Driver");
        verify(tracker).markInitialized("tenant42");
    }

    @Test
    void schemaExistsReturnsTrueWhenMetadataLookupFails() throws SQLException {
        DatabaseInitializationTracker tracker = mock(DatabaseInitializationTracker.class);
        MultiTenantDataSourceConfiguration cfg = new MultiTenantDataSourceConfiguration(
                "jdbc:h2:mem:drives",
                "sa",
                "password",
                "org.h2.Driver",
                tracker
        );

        DataSource dataSource = mock(DataSource.class);
        when(dataSource.getConnection()).thenThrow(new SQLException("boom"));

        boolean exists = ReflectionTestUtils.invokeMethod(cfg, "schemaExists", dataSource);

        assertThat(exists).isTrue();
    }
}