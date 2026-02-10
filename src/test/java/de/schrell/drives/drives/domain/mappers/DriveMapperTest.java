package de.schrell.drives.drives.domain.mappers;

import de.schrell.drives.drives.api.dtos.DriveResponse;
import de.schrell.drives.drives.domain.entities.Drive;
import de.schrell.drives.drives.domain.entities.DriveTemplate;
import de.schrell.drives.drives.domain.entities.Reason;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class DriveMapperTest {

    private final DriveMapper driveMapper = new DriveMapper();

    @Test
    void toResponseFallsBackToTemplateReason() {
        DriveTemplate template = new DriveTemplate(null, "Test", 10, "A", "B", Reason.WORK);
        Drive drive = new Drive(null, template, LocalDate.of(2024, 5, 5), null);

        DriveResponse response = driveMapper.toResponse(drive);

        assertEquals(Reason.WORK, response.reason());
    }

    @Test
    void toResponsePrefersExplicitReason() {
        DriveTemplate template = new DriveTemplate(null, "Test", 10, "A", "B", Reason.WORK);
        Drive drive = new Drive(null, template, LocalDate.of(2024, 5, 5), Reason.OTHER);

        DriveResponse response = driveMapper.toResponse(drive);

        assertEquals(Reason.OTHER, response.reason());
    }

    @Test
    void toResponseHandlesMissingTemplate() {
        Drive drive = new Drive(null, null, LocalDate.of(2024, 5, 5), null);

        DriveResponse response = driveMapper.toResponse(drive);

        assertNull(response.template());
        assertNull(response.reason());
    }
}