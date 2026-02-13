package de.schrell.drives.drives.api.controllers;

import de.schrell.drives.drives.api.dtos.DriveRequest;
import de.schrell.drives.drives.api.dtos.DriveResponse;
import de.schrell.drives.drives.domain.commands.DriveCommand;
import de.schrell.drives.drives.domain.entities.Reason;
import de.schrell.drives.drives.domain.services.DriveService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DriveControllerTest {

    @Mock
    private DriveService driveService;

    @InjectMocks
    private DriveController controller;

    @Test
    void getDrivesReturnsList() {
        DriveResponse response = new DriveResponse("1", LocalDate.now(), null, Reason.WORK, "A", "B", 10);
        when(driveService.findAll(null, null, null)).thenReturn(List.of(response));

        List<DriveResponse> result = controller.getDrives(null, null, null);

        assertThat(result).containsExactly(response);
    }

    @Test
    void getDriveByIdReturnsDrive() {
        DriveResponse response = new DriveResponse("1", LocalDate.now(), null, Reason.WORK, "A", "B", 10);
        when(driveService.findById("1")).thenReturn(response);

        DriveResponse result = controller.getDrive("1");

        assertThat(result).isEqualTo(response);
    }

    @Test
    void getLatestDriveDateReturnsOkWhenPresent() {
        LocalDate date = LocalDate.now();
        when(driveService.findLatestDate()).thenReturn(Optional.of(date));

        ResponseEntity<LocalDate> response = controller.getLatestDriveDate();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(date);
    }

    @Test
    void getLatestDriveDateReturnsNoContentWhenEmpty() {
        when(driveService.findLatestDate()).thenReturn(Optional.empty());

        ResponseEntity<LocalDate> response = controller.getLatestDriveDate();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    void getLatestDriveInfoReturnsOkWhenPresent() {
        DriveResponse response = new DriveResponse("1", LocalDate.now(), null, Reason.WORK, "A", "B", 10);
        when(driveService.findLatestDrive()).thenReturn(Optional.of(response));

        ResponseEntity<DriveResponse> result = controller.getLatestDrive();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
    }

    @Test
    void getLatestDriveInfoReturnsNoContentWhenEmpty() {
        when(driveService.findLatestDrive()).thenReturn(Optional.empty());

        ResponseEntity<DriveResponse> result = controller.getLatestDrive();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    void addDriveCallsService() {
        DriveRequest request = new DriveRequest(null, LocalDate.now(), "t1", Reason.WORK, "A", "B", 10);
        DriveResponse response = new DriveResponse("1", request.date(), null, Reason.WORK, "A", "B", 10);
        when(driveService.create(any(DriveCommand.class))).thenReturn(response);

        DriveResponse result = controller.addDrive(request);

        assertThat(result).isEqualTo(response);
        verify(driveService).create(argThat(cmd -> cmd.templateId().equals("t1") && "A".equals(cmd.fromLocation())));
    }

    @Test
    void updateDriveCallsService() {
        DriveRequest request = new DriveRequest("1", LocalDate.now(), "t1", Reason.WORK, "A", "B", 10);
        DriveResponse response = new DriveResponse("1", request.date(), null, Reason.WORK, "A", "B", 10);
        when(driveService.update(any(DriveCommand.class))).thenReturn(response);

        DriveResponse result = controller.updateDrive(request);

        assertThat(result).isEqualTo(response);
        verify(driveService).update(argThat(cmd -> cmd.id().equals("1") && "B".equals(cmd.toLocation())));
    }

    @Test
    void deleteDriveCallsService() {
        ResponseEntity<Void> response = controller.deleteDrive("1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(driveService).delete("1");
    }
    @Test
    void getDrivesWithFilterDelegatesToService() {
        DriveResponse response = new DriveResponse("1", LocalDate.of(2024,5,1), null, Reason.WORK, "A", "B", 10);
        when(driveService.findAll(2024, 5, Reason.WORK)).thenReturn(List.of(response));

        List<DriveResponse> result = controller.getDrives(2024, 5, Reason.WORK);

        assertThat(result).containsExactly(response);
        verify(driveService).findAll(2024, 5, Reason.WORK);
    }
}
