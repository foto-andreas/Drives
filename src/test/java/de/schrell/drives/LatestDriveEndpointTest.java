package de.schrell.drives;

import de.schrell.drives.domain.Drive;
import de.schrell.drives.domain.DriveTemplate;
import de.schrell.drives.domain.Reason;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:latestDriveDb;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class LatestDriveEndpointTest {

    @Autowired
    private DriveController driveController;

    @Autowired
    private DriveRepository driveRepository;

    @Autowired
    private DriveTemplateRepository driveTemplateRepository;

    @BeforeEach
    void setup() {
        driveRepository.deleteAll();
        driveTemplateRepository.deleteAll();
    }

    @Test
    void returnsLatestDriveDate() throws Exception {
        DriveTemplate template = driveTemplateRepository.save(
                new DriveTemplate(null, "Test", 10, "A", "B", Reason.WORK)
        );

        driveRepository.save(new Drive(null, template, LocalDate.of(2024, 5, 1), null));
        driveRepository.save(new Drive(null, template, LocalDate.of(2024, 6, 10), null));

        ResponseEntity<LocalDate> response = driveController.getLatestDriveDate();

        assertEquals(HttpStatusCode.valueOf(200), response.getStatusCode());
        assertEquals(LocalDate.of(2024, 6, 10), response.getBody());
    }

    @Test
    void returnsNoContentWhenNoDrivesExist() throws Exception {
        ResponseEntity<LocalDate> response = driveController.getLatestDriveDate();

        assertEquals(HttpStatusCode.valueOf(204), response.getStatusCode());
        assertNull(response.getBody());
    }
}