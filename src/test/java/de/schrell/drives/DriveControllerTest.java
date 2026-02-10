package de.schrell.drives;

import de.schrell.drives.drives.api.controllers.DriveController;
import de.schrell.drives.drives.api.dtos.DriveRequest;
import de.schrell.drives.drives.api.dtos.DriveResponse;
import de.schrell.drives.drives.domain.commands.DriveCommand;
import de.schrell.drives.drives.domain.entities.Reason;
import de.schrell.drives.drives.domain.services.DriveService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DriveControllerTest {

    @Mock
    private DriveService driveService;

    @Captor
    private ArgumentCaptor<DriveCommand> driveCaptor;

    private DriveController driveController;

    @BeforeEach
    void setup() {
        driveController = new DriveController(driveService);
    }

    @Test
    void getDrivesReturnsOrderedList() {
        List<DriveResponse> drives = List.of(new DriveResponse("1", LocalDate.now(), null, null));
        when(driveService.findAll(null, null, null)).thenReturn(drives);

        assertThat(driveController.getDrives(null, null, null)).isSameAs(drives);
        verify(driveService).findAll(null, null, null);
        verifyNoMoreInteractions(driveService);
    }

    @Test
    void getDriveReturnsOptional() {
        DriveResponse drive = new DriveResponse("42", LocalDate.now(), null, null);
        when(driveService.findById("42")).thenReturn(drive);

        assertThat(driveController.getDrive("42")).isSameAs(drive);
        verify(driveService).findById("42");
        verifyNoMoreInteractions(driveService);
    }

    @Test
    void getLatestDriveDateReturnsNoContentWhenNull() {
        when(driveService.findLatestDate()).thenReturn(Optional.empty());

        ResponseEntity<LocalDate> response = driveController.getLatestDriveDate();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response.getBody()).isNull();
    }

    @Test
    void getLatestDriveDateReturnsOkWhenPresent() {
        LocalDate latest = LocalDate.of(2024, 6, 10);
        when(driveService.findLatestDate()).thenReturn(Optional.of(latest));

        ResponseEntity<LocalDate> response = driveController.getLatestDriveDate();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(latest);
    }

    @Test
    void addDriveMapsRequestToCommand() {
        DriveRequest request = new DriveRequest(null, LocalDate.of(2024, 5, 5), "template-id", Reason.WORK);
        DriveResponse response = new DriveResponse("1", LocalDate.of(2024, 5, 5), null, Reason.WORK);
        when(driveService.create(driveCaptor.capture())).thenReturn(response);

        DriveResponse result = driveController.addDrive(request);

        assertThat(result).isSameAs(response);
        assertThat(driveCaptor.getValue().templateId()).isEqualTo("template-id");
        assertThat(driveCaptor.getValue().date()).isEqualTo(LocalDate.of(2024, 5, 5));
    }

    @Test
    void updateDriveMapsRequestToCommand() {
        DriveRequest request = new DriveRequest("id", LocalDate.of(2024, 6, 6), "template-id", Reason.OTHER);
        DriveResponse response = new DriveResponse("id", LocalDate.of(2024, 6, 6), null, Reason.OTHER);
        when(driveService.update(driveCaptor.capture())).thenReturn(response);

        DriveResponse result = driveController.updateDrive(request);

        assertThat(result).isSameAs(response);
        assertThat(driveCaptor.getValue().id()).isEqualTo("id");
    }

    @Test
    void deleteDriveReturnsOkWhenExists() {
        ResponseEntity<Void> response = driveController.deleteDrive("1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(driveService).delete("1");
        verifyNoMoreInteractions(driveService);
    }
}