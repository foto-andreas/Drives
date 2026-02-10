package de.schrell.drives.domain;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class DriveTest {

    @Test
    void getReasonFallsBackToTemplate() {
        DriveTemplate template = new DriveTemplate(null, "Test", 10, "A", "B", Reason.WORK);
        Drive drive = new Drive(null, template, LocalDate.now(), null);

        assertEquals(Reason.WORK, drive.getReason());
    }

    @Test
    void getReasonPrefersExplicitReason() {
        DriveTemplate template = new DriveTemplate(null, "Test", 10, "A", "B", Reason.WORK);
        Drive drive = new Drive(null, template, LocalDate.now(), Reason.OTHER);

        assertEquals(Reason.OTHER, drive.getReason());
    }

    @Test
    void getReasonReturnsNullWithoutTemplate() {
        Drive drive = new Drive(null, null, LocalDate.now(), null);

        assertNull(drive.getReason());
    }
}