package de.schrell.drives.config.multitenancy;

import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
@Slf4j
public class MultiTenantDataSourceConfiguration {

    private static final String[] FLYWAY_LOCATIONS = {"classpath:db/migration"};
    private static final String[] FLYWAY_IGNORE_MIGRATION_PATTERNS = {"*:missing"};
    private static final String FLYWAY_BASELINE_VERSION = "1";

    private final String baseUrl;
    private final String username;
    private final String password;
    private final String driverClassName;
    private final ConcurrentHashMap<String, DataSource> resolvedDataSources = new ConcurrentHashMap<>();
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
                if (lookupKey instanceof String tenantId) {
                    boolean[] created = new boolean[1];
                    DataSource tenantDataSource = resolvedDataSources.computeIfAbsent(tenantId, key -> {
                        created[0] = true;
                        return createDataSource(key);
                    });
                    if (created[0]) {
                        synchronized (resolvedDataSources) {
                            setTargetDataSources(new HashMap<>(resolvedDataSources));
                            afterPropertiesSet();
                        }
                    }
                }
                return super.determineTargetDataSource();
            }
        };

        DataSource defaultDataSource = createDataSource("default");
        resolvedDataSources.put("default", defaultDataSource);

        routingDataSource.setDefaultTargetDataSource(defaultDataSource);
        routingDataSource.setTargetDataSources(new HashMap<>(resolvedDataSources));
        routingDataSource.afterPropertiesSet();

        return routingDataSource;
    }

    private DataSource createDataSource(String tenantId) {
        HikariDataSource dataSource = new HikariDataSource();

        dataSource.setJdbcUrl(resolveTenantUrl(tenantId));
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        dataSource.setDriverClassName(driverClassName);
        migrateWithFlyway(dataSource, tenantId);
        return dataSource;
    }

    private String resolveTenantUrl(String tenantId) {
        return "default".equals(tenantId) ? baseUrl : baseUrl + "_" + tenantId;
    }

    /**
     * Runs Flyway for every newly created tenant datasource.
     * Existing databases are baselined at version 1 and then continue with current migrations.
     */
    private void migrateWithFlyway(DataSource dataSource, String tenantId) {
        try {
            Flyway.configure()
                    .dataSource(dataSource)
                    .locations(FLYWAY_LOCATIONS)
                    .baselineOnMigrate(true)
                    .baselineVersion(FLYWAY_BASELINE_VERSION)
                    .ignoreMigrationPatterns(FLYWAY_IGNORE_MIGRATION_PATTERNS)
                    .load()
                    .migrate();
            initializationTracker.markInitialized(tenantId);
            log.info("Flyway migration finished for tenant {}", tenantId);
        } catch (RuntimeException ex) {
            log.error("Flyway migration for tenant {} failed", tenantId, ex);
            throw new IllegalStateException("Flyway migration failed for tenant " + tenantId, ex);
        }
    }
}
