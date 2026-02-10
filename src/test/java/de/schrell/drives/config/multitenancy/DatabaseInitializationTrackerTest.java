package de.schrell.drives.config.multitenancy;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DatabaseInitializationTrackerTest {

    @AfterEach
    void tearDown() {
        // ensure no tenant context leak for other tests
        TenantContext.clear();
    }

    @Test
    void markInitializedAndConsumeFlag_shouldReturnTrueOnce_thenFalse() {
        DatabaseInitializationTracker tracker = new DatabaseInitializationTracker();

        tracker.markInitialized("t1");
        assertThat(tracker.consumeInitializationFlag("t1")).isTrue();
        // second consume should be false as it is removed
        assertThat(tracker.consumeInitializationFlag("t1")).isFalse();
    }

    @Test
    void nullTenant_shouldBeIgnored() {
        DatabaseInitializationTracker tracker = new DatabaseInitializationTracker();

        tracker.markInitialized(null);
        assertThat(tracker.consumeInitializationFlag(null)).isFalse();
    }
}
