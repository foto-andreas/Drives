package de.schrell.drives.config.multitenancy;

import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
@Slf4j
public class MultiTenantDataSourceConfiguration {

    private final String baseUrl;
    private final String username;
    private final String password;
    private final String driverClassName;
    private final Map<Object, Object> resolvedDataSources = new ConcurrentHashMap<>();
    private final DatabaseInitializationTracker initializationTracker;

    public MultiTenantDataSourceConfiguration(
            @Value("${spring.datasource.url}") String baseUrl,
            @Value("${spring.datasource.username}") String username,
            @Value("${spring.datasource.password}") String password,
            @Value("${spring.datasource.driverClassName}") String driverClassName,
            DatabaseInitializationTracker initializationTracker) {
        this.baseUrl = baseUrl;
        this.username = username;
        this.password = password;
        this.driverClassName = driverClassName;
        this.initializationTracker = initializationTracker;
    }

    @Bean
    @Primary
    public DataSource dataSource() {
        TenantAwareRoutingDataSource routingDataSource = new TenantAwareRoutingDataSource() {
            @Override
            protected DataSource determineTargetDataSource() {
                Object lookupKey = determineCurrentLookupKey();
                if (lookupKey != null && !resolvedDataSources.containsKey(lookupKey)) {
                    DataSource tenantDataSource = createDataSource((String) lookupKey);
                    resolvedDataSources.put(lookupKey, tenantDataSource);
                    setTargetDataSources(new HashMap<>(resolvedDataSources));
                    afterPropertiesSet();
                }
                return super.determineTargetDataSource();
            }
        };

        DataSource defaultDataSource = createDataSource("default");
        resolvedDataSources.put("default", defaultDataSource);

        routingDataSource.setDefaultTargetDataSource(defaultDataSource);
        routingDataSource.setTargetDataSources(resolvedDataSources);
        routingDataSource.afterPropertiesSet();

        return routingDataSource;
    }

    private DataSource createDataSource(String tenantId) {
        HikariDataSource dataSource = new HikariDataSource();

        // Basis-URL aus der Konfiguration (z.B. jdbc:h2:file:~/data/drives oder jdbc:postgresql://host/db)
        // Pro Tenant wird der DB-Name per Suffix ergänzt: <baseUrl>_<tenantId>
        String url;
        if ("default".equals(tenantId)) {
            url = baseUrl;
        } else {
            url = baseUrl + "_" + tenantId;
        }

        dataSource.setJdbcUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        dataSource.setDriverClassName(driverClassName);
        initializeSchemaIfNeeded(dataSource, tenantId);
        return dataSource;
    }

    private void initializeSchemaIfNeeded(DataSource dataSource, String tenantId) {
        if (schemaExists(dataSource)) {
            log.info("Database exists for " + tenantId);
            migrateSchemaIfNeeded(dataSource, tenantId);
            return;
        }
        try (Connection connection = dataSource.getConnection(); Statement statement = connection.createStatement()) {
            log.info("Will initialize Database for " + tenantId);
            statement.executeUpdate("create table if not exists drive_template (" +
                    "id varchar(255) not null, " +
                    "name varchar(255), " +
                    "drive_length integer not null, " +
                    "from_location varchar(255), " +
                    "to_location varchar(255), " +
                    "reason integer, " +
                    "primary key (id))");
            statement.executeUpdate("create unique index if not exists idx_drive_template_name on drive_template (name)");
            statement.executeUpdate("create table if not exists drive (" +
                    "id varchar(255) not null, " +
                    "template_id varchar(255), " +
                    "date date, " +
                    "reason integer, " +
                    "from_location varchar(255), " +
                    "to_location varchar(255), " +
                    "drive_length integer, " +
                    "primary key (id), " +
                    "constraint fk_drive_template foreign key (template_id) references drive_template(id))");
            initializationTracker.markInitialized(tenantId);
            log.info("Initialized Database for " + tenantId);
        } catch (SQLException ex) {
            log.error("Schema-Initialisierung für Tenant {} fehlgeschlagen", tenantId, ex);
            throw new IllegalStateException("Schema-Initialisierung fehlgeschlagen", ex);
        }
    }

    private void migrateSchemaIfNeeded(DataSource dataSource, String tenantId) {
        log.info("Will migrate Database for " + tenantId);
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
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

            try (Statement statement = connection.createStatement()) {
                if (!fromExists) {
                    statement.executeUpdate("ALTER TABLE drive ADD COLUMN from_location varchar(255)");
                    log.info("Added from_location to drive table for " + tenantId);
                }
                if (!toExists) {
                    statement.executeUpdate("ALTER TABLE drive ADD COLUMN to_location varchar(255)");
                    log.info("Added to_location to drive table for " + tenantId);
                }
                if (!lengthExists) {
                    statement.executeUpdate("ALTER TABLE drive ADD COLUMN drive_length integer");
                    log.info("Added drive_length to drive table for " + tenantId);
                }
            }
        } catch (SQLException ex) {
            log.error("Schema-Migration für Tenant {} fehlgeschlagen", tenantId, ex);
            throw new IllegalStateException("Schema-Migration fehlgeschlagen", ex);
        }
    }

    private boolean schemaExists(DataSource dataSource) {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            try (ResultSet tables = metaData.getTables(null, null, "DRIVE_TEMPLATE", new String[]{"TABLE"})) {
                return tables.next();
            }
        } catch (SQLException ex) {
            log.warn("Schema-Prüfung für Tenant-DataSource fehlgeschlagen", ex);
            return true;
        }
    }
}
