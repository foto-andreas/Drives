package de.schrell.drives.config.multitenancy;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
public class MultiTenantDataSourceConfiguration {

    private final String baseUrl;
    private final String username;
    private final String password;
    private final String driverClassName;
    private final Map<Object, Object> resolvedDataSources = new ConcurrentHashMap<>();

    public MultiTenantDataSourceConfiguration(
            @Value("${spring.datasource.url}") String baseUrl,
            @Value("${spring.datasource.username}") String username,
            @Value("${spring.datasource.password}") String password,
            @Value("${spring.datasource.driverClassName}") String driverClassName) {
        this.baseUrl = baseUrl;
        this.username = username;
        this.password = password;
        this.driverClassName = driverClassName;
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

        // baseUrl ist jdbc:h2:file:~/data/drives
        // Wir wollen jdbc:h2:file:~/data/drives_<tenantId>
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
        return dataSource;
    }
}
