package de.schrell.drives.drives.domain.services;

import de.schrell.drives.drives.api.dtos.DriveResponse;
import de.schrell.drives.drives.api.dtos.ScanEntryResponse;
import de.schrell.drives.drives.domain.commands.DriveCommand;
import de.schrell.drives.drives.domain.entities.Reason;
import de.schrell.drives.drives.domain.entities.ScanEntry;
import de.schrell.drives.drives.domain.entities.ScanType;
import de.schrell.drives.drives.domain.repositories.ScanEntryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScanEntryServiceTest {

    @Mock
    private ScanEntryRepository scanEntryRepository;

    @Mock
    private OcrService ocrService;

    @Mock
    private GeocodingService geocodingService;

    @Mock
    private DriveService driveService;

    @InjectMocks
    private ScanEntryService scanEntryService;

    @Test
    void createPersistsEntryAndReturnsResponse() {
        MockMultipartFile photo = new MockMultipartFile("photo", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3});
        OffsetDateTime timestamp = OffsetDateTime.of(2025, 1, 1, 8, 30, 0, 0, ZoneOffset.UTC);

        when(ocrService.extractKmStand(photo)).thenReturn(12345);
        when(geocodingService.reverseGeocode(48.1, 11.6)).thenReturn(Optional.of("Adresse"));
        when(scanEntryRepository.save(any(ScanEntry.class))).thenAnswer(invocation -> {
            ScanEntry entry = invocation.getArgument(0);
            entry.setId("1");
            return entry;
        });

        ScanEntryResponse response = scanEntryService.create(ScanType.START, timestamp, 48.1, 11.6, photo);

        assertThat(response.id()).isEqualTo("1");
        assertThat(response.type()).isEqualTo(ScanType.START);
        assertThat(response.timestamp()).isEqualTo(timestamp);
        assertThat(response.latitude()).isEqualTo(48.1);
        assertThat(response.longitude()).isEqualTo(11.6);
        assertThat(response.address()).isEqualTo("Adresse");
        assertThat(response.kmStand()).isEqualTo(12345);
    }

    @Test
    void findLatestStartIfLatestReturnsEmptyWhenLatestIsEnd() {
        ScanEntry entry = new ScanEntry(
                "1",
                ScanType.ZIEL,
                OffsetDateTime.now(),
                48.1,
                11.6,
                "Adresse",
                12345
        );
        when(scanEntryRepository.findTopByOrderByTimestampDesc()).thenReturn(Optional.of(entry));

        Optional<ScanEntryResponse> result = scanEntryService.findLatestStartIfLatest();

        assertThat(result).isEmpty();
    }

    @Test
    void findLatestStartIfLatestReturnsResponseWhenLatestIsStart() {
        OffsetDateTime timestamp = OffsetDateTime.now();
        ScanEntry entry = new ScanEntry(
                "1",
                ScanType.START,
                timestamp,
                48.1,
                11.6,
                "Adresse",
                12345
        );
        when(scanEntryRepository.findTopByOrderByTimestampDesc()).thenReturn(Optional.of(entry));

        Optional<ScanEntryResponse> result = scanEntryService.findLatestStartIfLatest();

        assertThat(result).isPresent();
        assertThat(result.get().timestamp()).isEqualTo(timestamp);
    }

    @Test
    void commitDriveCreatesDriveFromStartAndEnd() {
        OffsetDateTime startTs = OffsetDateTime.parse("2025-01-01T08:30:00Z");
        OffsetDateTime endTs = OffsetDateTime.parse("2025-01-01T09:30:00Z");
        ScanEntry start = new ScanEntry("s1", ScanType.START, startTs, 48.1, 11.6, "StartAddr", 1000);
        ScanEntry end = new ScanEntry("e1", ScanType.ZIEL, endTs, 48.2, 11.7, "EndAddr", 1020);
        DriveResponse driveResponse = new DriveResponse("d1", LocalDate.parse("2025-01-01"), null, Reason.WORK, "StartAddr", "EndAddr", 20);

        when(scanEntryRepository.findById("s1")).thenReturn(Optional.of(start));
        when(scanEntryRepository.findById("e1")).thenReturn(Optional.of(end));
        when(driveService.create(any(DriveCommand.class))).thenReturn(driveResponse);

        DriveResponse result = scanEntryService.commitDrive("s1", "e1", 1000, 1020, "StartAddr", "EndAddr", Reason.WORK);

        ArgumentCaptor<DriveCommand> captor = ArgumentCaptor.forClass(DriveCommand.class);
        verify(driveService).create(captor.capture());
        DriveCommand command = captor.getValue();
        assertThat(command.date()).isEqualTo(LocalDate.parse("2025-01-01"));
        assertThat(command.fromLocation()).isEqualTo("StartAddr");
        assertThat(command.toLocation()).isEqualTo("EndAddr");
        assertThat(command.driveLength()).isEqualTo(20);
        assertThat(command.reason()).isEqualTo(Reason.WORK);
        assertThat(result).isEqualTo(driveResponse);
    }

    @Test
    void commitDriveRejectsNonPositiveLength() {
        OffsetDateTime startTs = OffsetDateTime.parse("2025-01-01T08:30:00Z");
        OffsetDateTime endTs = OffsetDateTime.parse("2025-01-01T09:30:00Z");
        ScanEntry start = new ScanEntry("s1", ScanType.START, startTs, 48.1, 11.6, "StartAddr", 1000);
        ScanEntry end = new ScanEntry("e1", ScanType.ZIEL, endTs, 48.2, 11.7, "EndAddr", 999);

        when(scanEntryRepository.findById("s1")).thenReturn(Optional.of(start));
        when(scanEntryRepository.findById("e1")).thenReturn(Optional.of(end));

        assertThatThrownBy(() -> scanEntryService.commitDrive("s1", "e1", 1000, 999, "StartAddr", "EndAddr", Reason.OTHER))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("KM-Stand am Ziel muss groesser");
    }

    @Test
    void commitDriveFallsBackToCoordinatesWhenAddressesMissing() {
        OffsetDateTime startTs = OffsetDateTime.parse("2025-01-01T08:30:00Z");
        OffsetDateTime endTs = OffsetDateTime.parse("2025-01-01T09:30:00Z");
        ScanEntry start = new ScanEntry("s1", ScanType.START, startTs, 51.5, 9.2, null, 1000);
        ScanEntry end = new ScanEntry("e1", ScanType.ZIEL, endTs, 51.6, 9.3, null, 1010);

        when(scanEntryRepository.findById("s1")).thenReturn(Optional.of(start));
        when(scanEntryRepository.findById("e1")).thenReturn(Optional.of(end));
        when(driveService.create(any(DriveCommand.class))).thenAnswer(invocation -> {
            DriveCommand command = invocation.getArgument(0);
            return new DriveResponse("d1", command.date(), null, Reason.OTHER, command.fromLocation(), command.toLocation(), command.driveLength());
        });

        DriveResponse result = scanEntryService.commitDrive("s1", "e1", null, null, null, null, null);

        ArgumentCaptor<DriveCommand> captor = ArgumentCaptor.forClass(DriveCommand.class);
        verify(driveService).create(captor.capture());
        assertThat(captor.getValue().reason()).isEqualTo(Reason.OTHER);
        assertThat(result.fromLocation()).isEqualTo("51.500000, 9.200000");
        assertThat(result.toLocation()).isEqualTo("51.600000, 9.300000");
        assertThat(result.driveLength()).isEqualTo(10);
    }
}
