package de.schrell.drives.drives.api.controllers;

import de.schrell.drives.drives.api.dtos.DriveResponse;
import de.schrell.drives.drives.api.dtos.ScanEntryCommitRequest;
import de.schrell.drives.drives.api.dtos.ScanEntryResponse;
import de.schrell.drives.drives.domain.entities.Reason;
import de.schrell.drives.drives.domain.entities.ScanType;
import de.schrell.drives.drives.domain.services.ScanEntryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScanEntryControllerTest {

    @Mock
    private ScanEntryService scanEntryService;

    @InjectMocks
    private ScanEntryController controller;

    @Test
    void createScanEntryDelegatesWithParsedTimestamp() {
        ScanEntryResponse response = new ScanEntryResponse(
                "1",
                ScanType.START,
                OffsetDateTime.parse("2025-01-01T10:00:00Z"),
                48.1,
                11.6,
                "Adresse",
                12345
        );
        MockMultipartFile photo = new MockMultipartFile("photo", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3});

        when(scanEntryService.create(any(), any(), anyDouble(), anyDouble(), any())).thenReturn(response);

        ScanEntryResponse result = controller.createScanEntry(
                ScanType.START,
                "2025-01-01T10:00:00",
                48.1,
                11.6,
                photo
        );

        ArgumentCaptor<OffsetDateTime> timestampCaptor = ArgumentCaptor.forClass(OffsetDateTime.class);
        verify(scanEntryService).create(eq(ScanType.START), timestampCaptor.capture(), eq(48.1), eq(11.6), eq(photo));
        assertThat(timestampCaptor.getValue()).isEqualTo(OffsetDateTime.parse("2025-01-01T10:00:00Z"));
        assertThat(result).isEqualTo(response);
    }

    @Test
    void getLatestStartIfLatestReturnsOkWhenPresent() {
        ScanEntryResponse response = new ScanEntryResponse(
                "1",
                ScanType.START,
                OffsetDateTime.parse("2025-01-01T10:00:00Z"),
                48.1,
                11.6,
                "Adresse",
                12345
        );
        when(scanEntryService.findLatestStartIfLatest()).thenReturn(Optional.of(response));

        ResponseEntity<ScanEntryResponse> result = controller.getLatestStartIfLatest();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo(response);
    }

    @Test
    void getLatestStartIfLatestReturnsNoContentWhenMissing() {
        when(scanEntryService.findLatestStartIfLatest()).thenReturn(Optional.empty());

        ResponseEntity<ScanEntryResponse> result = controller.getLatestStartIfLatest();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    void commitDriveDelegatesToService() {
        DriveResponse driveResponse = new DriveResponse(
                "d1",
                LocalDate.parse("2025-01-01"),
                null,
                Reason.OTHER,
                "Von",
                "Nach",
                12
        );
        when(scanEntryService.commitDrive("s1", "e1", 1000, 1012, "Von", "Nach", Reason.WORK)).thenReturn(driveResponse);

        DriveResponse result = controller.commitDrive(new ScanEntryCommitRequest("s1", "e1", 1000, 1012, "Von", "Nach", Reason.WORK));

        assertThat(result).isEqualTo(driveResponse);
        verify(scanEntryService).commitDrive("s1", "e1", 1000, 1012, "Von", "Nach", Reason.WORK);
    }
}
