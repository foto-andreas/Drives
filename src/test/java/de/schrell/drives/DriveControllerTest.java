package de.schrell.drives;

import de.schrell.drives.domain.Drive;
import de.schrell.drives.domain.DriveTemplate;
import de.schrell.drives.domain.Reason;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DriveControllerTest {

    @Mock
    private DriveRepository driveRepository;

    @Captor
    private ArgumentCaptor<Drive> driveCaptor;

    private DriveController driveController;

    @BeforeEach
    void setup() {
        driveController = new DriveController(driveRepository);
    }

    @Test
    void getDrivesReturnsOrderedList() {
        List<Drive> drives = List.of(new Drive());
        when(driveRepository.findAllByOrderByDateAsc()).thenReturn(drives);

        assertSame(drives, driveController.getDrives());
        verify(driveRepository).findAllByOrderByDateAsc();
        verifyNoMoreInteractions(driveRepository);
    }

    @Test
    void getDriveReturnsOptional() {
        Drive drive = new Drive();
        when(driveRepository.findById("42")).thenReturn(Optional.of(drive));

        assertEquals(Optional.of(drive), driveController.getDrive("42"));
        verify(driveRepository).findById("42");
        verifyNoMoreInteractions(driveRepository);
    }

    @Test
    void getLatestDriveDateReturnsNoContentWhenNull() {
        when(driveRepository.findLatestDate()).thenReturn(null);

        ResponseEntity<LocalDate> response = driveController.getLatestDriveDate();

        assertEquals(HttpStatusCode.valueOf(204), response.getStatusCode());
        assertNull(response.getBody());
    }

    @Test
    void getLatestDriveDateReturnsOkWhenPresent() {
        LocalDate latest = LocalDate.of(2024, 6, 10);
        when(driveRepository.findLatestDate()).thenReturn(latest);

        ResponseEntity<LocalDate> response = driveController.getLatestDriveDate();

        assertEquals(HttpStatusCode.valueOf(200), response.getStatusCode());
        assertEquals(latest, response.getBody());
    }

    @Test
    void addDriveNormalizesReasonWhenMatchingTemplate() throws Exception {
        DriveTemplate template = new DriveTemplate(null, "Test", 10, "A", "B", Reason.WORK);
        Drive drive = new Drive(null, template, LocalDate.now(), Reason.WORK);
        when(driveRepository.save(driveCaptor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        driveController.addDrive(drive);

        Drive saved = driveCaptor.getValue();
        assertNull(readReason(saved));
    }

    @Test
    void updateDriveKeepsReasonWhenDifferent() throws Exception {
        DriveTemplate template = new DriveTemplate(null, "Test", 10, "A", "B", Reason.WORK);
        Drive drive = new Drive(null, template, LocalDate.now(), Reason.OTHER);
        when(driveRepository.save(driveCaptor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        driveController.updateDrive(drive);

        Drive saved = driveCaptor.getValue();
        assertEquals(Reason.OTHER, readReason(saved));
    }

    @Test
    void deleteDriveReturnsOkWhenExists() {
        when(driveRepository.existsById("1")).thenReturn(true);

        ResponseEntity<Void> response = driveController.deleteDrive("1");

        assertEquals(HttpStatusCode.valueOf(200), response.getStatusCode());
        verify(driveRepository).existsById("1");
        verify(driveRepository).deleteById("1");
    }

    @Test
    void deleteDriveReturnsNotFoundWhenMissing() {
        when(driveRepository.existsById("missing")).thenReturn(false);

        ResponseEntity<Void> response = driveController.deleteDrive("missing");

        assertEquals(HttpStatusCode.valueOf(404), response.getStatusCode());
        verify(driveRepository).existsById("missing");
        verifyNoMoreInteractions(driveRepository);
    }

    private Reason readReason(Drive drive) throws Exception {
        Field field = Drive.class.getDeclaredField("reason");
        field.setAccessible(true);
        return (Reason) field.get(drive);
    }
}