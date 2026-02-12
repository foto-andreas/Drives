package de.schrell.drives.config.multitenancy;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class MultiTenantSchemaMigrationTest {

    @AfterEach
    void cleanup() {
        TenantContext.clear();
    }

    @Test
    void migratesExistingSchemaToAddMissingColumns() throws Exception {
        String dbUrl = "jdbc:h2:mem:migrationtest;DB_CLOSE_DELAY=-1";
        DatabaseInitializationTracker tracker = mock(DatabaseInitializationTracker.class);
        MultiTenantDataSourceConfiguration cfg = new MultiTenantDataSourceConfiguration(
                "jdbc:h2:mem:migrationtest;DB_CLOSE_DELAY=-1",
                "sa",
                "",
                "org.h2.Driver",
                tracker
        );

        // 1. Manuell ein altes Schema erstellen (ohne die neuen Spalten)
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
                    "primary key (id), " +
                    "constraint fk_drive_template foreign key (template_id) references drive_template(id))");

            // Testdaten einfügen
            stmt.executeUpdate("insert into drive (id, date, reason) values ('1', '2024-01-01', 1)");
        }

        // 2. MultiTenantDataSourceConfiguration nutzen
        // Wir setzen KEINEN Tenant, damit die Standard-DB (ohne Suffix) genutzt wird
        TenantContext.clear();
        DataSource ds = cfg.dataSource();
        
        try (Connection conn = ds.getConnection()) {
            DatabaseMetaData metaData = conn.getMetaData();
            
            // Prüfen, ob die neuen Spalten existieren
            boolean fromExists = false;
            boolean toExists = false;
            boolean lengthExists = false;
            
            try (ResultSet columns = metaData.getColumns(null, null, "DRIVE", null)) {
                while (columns.next()) {
                    String columnName = columns.getString("COLUMN_NAME");
                    if ("FROM_LOCATION".equalsIgnoreCase(columnName)) fromExists = true;
                    if ("TO_LOCATION".equalsIgnoreCase(columnName)) toExists = true;
                    if ("DRIVE_LENGTH".equalsIgnoreCase(columnName)) lengthExists = true;
                }
            }
            
            assertThat(fromExists).as("from_location should exist").isTrue();
            assertThat(toExists).as("to_location should exist").isTrue();
            assertThat(lengthExists).as("drive_length should exist").isTrue();

            // Bestehende Daten prüfen
            try (Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery("select reason from drive where id='1'")) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getInt(1)).isEqualTo(1);
            }
        }
    }
}
