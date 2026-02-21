package de.schrell.drives.config.multitenancy;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class MultiTenantSchemaMigrationTest {

    @Test
    void baselinesExistingSchemaAtStartupAndKeepsData() throws Exception {
        String dbUrl = "jdbc:h2:mem:migrationtest;DB_CLOSE_DELAY=-1;MODE=PostgreSQL";
        DatabaseInitializationTracker tracker = mock(DatabaseInitializationTracker.class);
        MultiTenantDataSourceConfiguration cfg = new MultiTenantDataSourceConfiguration(
                dbUrl,
                "sa",
                "",
                "org.h2.Driver",
                tracker
        );

        // Existing database is already on current schema but not yet managed by Flyway.
        DataSource setupDs = new DriverManagerDataSource(dbUrl, "sa", "");
        try (Connection conn = setupDs.getConnection(); Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("create table drive_template (" +
                    "id varchar(255) not null, " +
                    "name varchar(255), " +
                    "drive_length integer not null, " +
                    "from_location varchar(255), " +
                    "to_location varchar(255), " +
                    "reason integer, " +
                    "primary key (id))");
            stmt.executeUpdate("create table drive (" +
                    "id varchar(255) not null, " +
                    "template_id varchar(255), " +
                    "date date, " +
                    "reason integer, " +
                    "from_location varchar(255), " +
                    "to_location varchar(255), " +
                    "drive_length integer, " +
                    "primary key (id), " +
                    "constraint fk_drive_template foreign key (template_id) references drive_template(id))");
            stmt.executeUpdate("create table scan_entry (" +
                    "id varchar(255) not null, " +
                    "type varchar(10) not null, " +
                    "timestamp timestamp with time zone not null, " +
                    "latitude double not null, " +
                    "longitude double not null, " +
                    "address varchar(1024), " +
                    "km_stand integer, " +
                    "primary key (id))");
            stmt.executeUpdate("create index if not exists idx_scan_entry_timestamp on scan_entry (timestamp)");

            stmt.executeUpdate("insert into drive_template (id, name, drive_length, from_location, to_location, reason) " +
                    "values ('t-1', 'Template', 10, 'A', 'B', 1)");
            stmt.executeUpdate("insert into drive (id, date, reason) values ('1', '2024-01-01', 1)");
        }

        DataSource ds = cfg.dataSource();

        try (Connection conn = ds.getConnection()) {
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(
                         "select count(*) from \"flyway_schema_history\" " +
                                 "where \"version\" = '1' and \"type\" = 'BASELINE'")) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getInt(1)).isEqualTo(1);
            }
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(
                         "select count(*) from \"flyway_schema_history\" " +
                                 "where \"version\" = '2' and \"success\" = true")) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getInt(1)).isEqualTo(1);
            }
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("select reason from drive where id='1'")) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getInt(1)).isEqualTo(1);
            }
        }

        verify(tracker).markInitialized("default");
    }
}
