package de.schrell.drives.drives.domain.services;

import de.schrell.drives.drives.api.dtos.DriveResponse;
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

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScanEntryServiceAdditionalTest {

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
    void commitDrivePersistsOverrides() {
        OffsetDateTime startTs = OffsetDateTime.parse("2025-01-01T08:30:00Z");
        OffsetDateTime endTs = OffsetDateTime.parse("2025-01-01T09:30:00Z");
        ScanEntry start = new ScanEntry("s1", ScanType.START, startTs, 48.1, 11.6, "StartAddr", 1000);
        ScanEntry end = new ScanEntry("e1", ScanType.ZIEL, endTs, 48.2, 11.7, "EndAddr", 1020);
        DriveResponse driveResponse = new DriveResponse("d1", LocalDate.parse("2025-01-01"), null, Reason.OTHER, "NeuVon", "NeuNach", 12);

        when(scanEntryRepository.findById("s1")).thenReturn(Optional.of(start));
        when(scanEntryRepository.findById("e1")).thenReturn(Optional.of(end));
        when(driveService.create(any(DriveCommand.class))).thenReturn(driveResponse);

        scanEntryService.commitDrive("s1", "e1", 1234, 1246, "NeuVon", "NeuNach");

        ArgumentCaptor<ScanEntry> captor = ArgumentCaptor.forClass(ScanEntry.class);
        verify(scanEntryRepository, times(2)).save(captor.capture());

        assertThat(start.getKmStand()).isEqualTo(1234);
        assertThat(end.getKmStand()).isEqualTo(1246);
        assertThat(start.getAddress()).isEqualTo("NeuVon");
        assertThat(end.getAddress()).isEqualTo("NeuNach");
    }

    @Test
    void commitDriveRejectsWrongTypes() {
        OffsetDateTime ts = OffsetDateTime.parse("2025-01-01T08:30:00Z");
        ScanEntry start = new ScanEntry("s1", ScanType.ZIEL, ts, 48.1, 11.6, "A", 1000);
        ScanEntry end = new ScanEntry("e1", ScanType.START, ts, 48.2, 11.7, "B", 1010);

        when(scanEntryRepository.findById("s1")).thenReturn(Optional.of(start));
        when(scanEntryRepository.findById("e1")).thenReturn(Optional.of(end));

        assertThatThrownBy(() -> scanEntryService.commitDrive("s1", "e1", 1000, 1010, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Start-Eintrag ist kein START");
    }
}
