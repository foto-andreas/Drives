package de.schrell.drives.config.multitenancy;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

@SuppressWarnings({"SqlNoDataSourceInspection", "SqlDialectInspection"})
class MultiTenantDataSourceConfigurationPrivateMethodsTest {

    @Test
    void createDataSourceBuildsTenantSpecificUrlAndRunsFlywayMigration() throws Exception {
        DatabaseInitializationTracker tracker = mock(DatabaseInitializationTracker.class);
        MultiTenantDataSourceConfiguration cfg = new MultiTenantDataSourceConfiguration(
                "jdbc:h2:mem:drives",
                "sa",
                "password",
                "org.h2.Driver",
                tracker
        );

        try (HikariDataSource dataSource = ReflectionTestUtils.invokeMethod(
                cfg,
                "createDataSource",
                "tenant42"
        )) {

            assert dataSource != null;
            assertThat(dataSource.getJdbcUrl()).isEqualTo("jdbc:h2:mem:drives_tenant42");
            assertThat(dataSource.getUsername()).isEqualTo("sa");
            assertThat(dataSource.getPassword()).isEqualTo("password");
            assertThat(dataSource.getDriverClassName()).isEqualTo("org.h2.Driver");

            try (Connection connection = dataSource.getConnection();
                 Statement statement = connection.createStatement();
                 ResultSet rs = statement.executeQuery(
                         "select count(*) from \"flyway_schema_history\" " +
                                 "where \"version\" = '2' and \"success\" = true")) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getInt(1)).isEqualTo(1);
            }
        }
        verify(tracker).markInitialized("tenant42");
    }

    @Test
    void createDataSourceThrowsWhenFlywayMigrationFails() {
        DatabaseInitializationTracker tracker = mock(DatabaseInitializationTracker.class);
        MultiTenantDataSourceConfiguration cfg = new MultiTenantDataSourceConfiguration(
                "jdbc:invalid:drives",
                "sa",
                "password",
                "org.h2.Driver",
                tracker
        );

        assertThatThrownBy(() -> ReflectionTestUtils.invokeMethod(cfg, "createDataSource", "tenant42"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Flyway migration failed");
    }
}
