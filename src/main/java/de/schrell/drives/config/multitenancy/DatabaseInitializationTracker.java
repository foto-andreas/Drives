package de.schrell.drives.config.multitenancy;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class DatabaseInitializationTracker {

    private final Map<String, Boolean> initializedTenants = new ConcurrentHashMap<>();

    public void markInitialized(String tenantId) {
        if (tenantId == null) {
            return;
        }
        initializedTenants.put(tenantId, Boolean.TRUE);
    }

    public boolean consumeInitializationFlag(String tenantId) {
        if (tenantId == null) {
            return false;
        }
        return initializedTenants.remove(tenantId) != null;
    }
}