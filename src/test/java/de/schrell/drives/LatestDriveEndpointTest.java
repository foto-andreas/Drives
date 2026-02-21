package de.schrell.drives;

import de.schrell.drives.drives.api.controllers.DriveController;
import de.schrell.drives.drives.domain.entities.Drive;
import de.schrell.drives.drives.domain.entities.DriveTemplate;
import de.schrell.drives.drives.domain.entities.Reason;
import de.schrell.drives.drives.domain.repositories.DriveRepository;
import de.schrell.drives.drives.domain.repositories.DriveTemplateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.TestConstructor;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:latestDriveDb;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=validate"
})
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
class LatestDriveEndpointTest {

    private final DriveController driveController;
    private final DriveRepository driveRepository;
    private final DriveTemplateRepository driveTemplateRepository;

    LatestDriveEndpointTest(DriveController driveController,
                            DriveRepository driveRepository,
                            DriveTemplateRepository driveTemplateRepository) {
        this.driveController = driveController;
        this.driveRepository = driveRepository;
        this.driveTemplateRepository = driveTemplateRepository;
    }

    @BeforeEach
    void setup() {
        driveRepository.deleteAll();
        driveTemplateRepository.deleteAll();
    }

    @Test
    void returnsLatestDriveDate() {
        DriveTemplate template = driveTemplateRepository.save(
                new DriveTemplate(null, "Test", 10, "A", "B", Reason.WORK)
        );

        driveRepository.save(new Drive(null, template, LocalDate.of(2024, 5, 1), null, null, null, null));
        driveRepository.save(new Drive(null, template, LocalDate.of(2024, 6, 10), null, null, null, null));

        ResponseEntity<LocalDate> response = driveController.getLatestDriveDate();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(LocalDate.of(2024, 6, 10));
    }

    @Test
    void returnsNoContentWhenNoDrivesExist() {
        ResponseEntity<LocalDate> response = driveController.getLatestDriveDate();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response.getBody()).isNull();
    }
}
