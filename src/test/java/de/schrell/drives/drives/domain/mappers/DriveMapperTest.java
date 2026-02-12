package de.schrell.drives.drives.domain.mappers;

import de.schrell.drives.drives.api.dtos.DriveResponse;
import de.schrell.drives.drives.api.dtos.DriveTemplateResponse;
import de.schrell.drives.drives.domain.entities.Drive;
import de.schrell.drives.drives.domain.entities.DriveTemplate;
import de.schrell.drives.drives.domain.entities.Reason;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class DriveMapperTest {

    private final DriveMapper driveMapper = new DriveMapper();

    @Test
    void toTemplateResponseMapsAllFields() {
        DriveTemplate template = new DriveTemplate("1", "Name", 10, "From", "To", Reason.WORK);

        DriveTemplateResponse response = driveMapper.toTemplateResponse(template);

        assertThat(response.id()).isEqualTo("1");
        assertThat(response.name()).isEqualTo("Name");
        assertThat(response.driveLength()).isEqualTo(10);
        assertThat(response.fromLocation()).isEqualTo("From");
        assertThat(response.toLocation()).isEqualTo("To");
        assertThat(response.reason()).isEqualTo(Reason.WORK);
    }

    @Test
    void toTemplateResponseReturnsNullOnNullInput() {
        assertThat(driveMapper.toTemplateResponse(null)).isNull();
    }

    @Test
    void toResponseFallsBackToTemplateReason() {
        DriveTemplate template = new DriveTemplate(null, "Test", 10, "A", "B", Reason.WORK);
        Drive drive = new Drive(null, template, LocalDate.of(2024, 5, 5), null, null, null, null);

        DriveResponse response = driveMapper.toResponse(drive);

        assertThat(response.reason()).isEqualTo(Reason.WORK);
        assertThat(response.fromLocation()).isEqualTo("A");
    }

    @Test
    void toResponsePrefersExplicitReason() {
        DriveTemplate template = new DriveTemplate(null, "Test", 10, "A", "B", Reason.WORK);
        Drive drive = new Drive(null, template, LocalDate.of(2024, 5, 5), Reason.OTHER, "C", "D", 20);

        DriveResponse response = driveMapper.toResponse(drive);

        assertThat(response.reason()).isEqualTo(Reason.OTHER);
        assertThat(response.fromLocation()).isEqualTo("C");
        assertThat(response.toLocation()).isEqualTo("D");
        assertThat(response.driveLength()).isEqualTo(20);
    }

    @Test
    void toResponseHandlesMissingTemplate() {
        Drive drive = new Drive(null, null, LocalDate.of(2024, 5, 5), null, "X", "Y", 15);

        DriveResponse response = driveMapper.toResponse(drive);

        assertThat(response.template()).isNull();
        assertThat(response.reason()).isNull();
        assertThat(response.fromLocation()).isEqualTo("X");
    }

    @Test
    void toResponseReturnsNullOnNullInput() {
        assertThat(driveMapper.toResponse(null)).isNull();
    }
}