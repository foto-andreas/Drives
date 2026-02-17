package de.schrell.drives.drives.domain.services;

import de.schrell.drives.drives.api.dtos.DriveResponse;
import de.schrell.drives.drives.api.dtos.ScanEntryResponse;
import de.schrell.drives.drives.domain.commands.DriveCommand;
import de.schrell.drives.drives.domain.entities.Reason;
import de.schrell.drives.drives.domain.entities.ScanEntry;
import de.schrell.drives.drives.domain.entities.ScanType;
import de.schrell.drives.drives.domain.exceptions.ResourceNotFoundException;
import de.schrell.drives.drives.domain.repositories.ScanEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ScanEntryService {

    private final ScanEntryRepository scanEntryRepository;
    private final OcrService ocrService;
    private final GeocodingService geocodingService;
    private final DriveService driveService;

    @Transactional
    public ScanEntryResponse create(ScanType type,
                                    OffsetDateTime timestamp,
                                    double latitude,
                                    double longitude,
                                    MultipartFile photo) {
        int kmStand = ocrService.extractKmStand(photo);
        String address = geocodingService.reverseGeocode(latitude, longitude).orElse(null);

        ScanEntry entry = new ScanEntry();
        entry.setType(type);
        entry.setTimestamp(timestamp);
        entry.setLatitude(latitude);
        entry.setLongitude(longitude);
        entry.setAddress(address);
        entry.setKmStand(kmStand);

        ScanEntry saved = scanEntryRepository.save(entry);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Optional<ScanEntryResponse> findLatestStartIfLatest() {
        return scanEntryRepository.findTopByOrderByTimestampDesc()
                .filter(entry -> entry.getType() == ScanType.START)
                .map(this::toResponse);
    }

    @Transactional
    public DriveResponse commitDrive(String startId,
                                     String endId,
                                     Integer startKmStand,
                                     Integer endKmStand,
                                     String startAddress,
                                     String endAddress,
                                     Reason reason) {
        ScanEntry start = scanEntryRepository.findById(startId)
                .orElseThrow(() -> new ResourceNotFoundException("Scan-Start mit id '%s' nicht gefunden".formatted(startId)));
        ScanEntry end = scanEntryRepository.findById(endId)
                .orElseThrow(() -> new ResourceNotFoundException("Scan-Ziel mit id '%s' nicht gefunden".formatted(endId)));

        if (start.getType() != ScanType.START) {
            throw new IllegalArgumentException("Start-Eintrag ist kein START");
        }
        if (end.getType() != ScanType.ZIEL) {
            throw new IllegalArgumentException("Ziel-Eintrag ist kein ZIEL");
        }

        Integer startKm = startKmStand != null ? startKmStand : start.getKmStand();
        Integer endKm = endKmStand != null ? endKmStand : end.getKmStand();
        if (startKm == null || endKm == null) {
            throw new IllegalArgumentException("KM-Stand fehlt");
        }

        int length = endKm - startKm;
        if (length <= 0) {
            throw new IllegalArgumentException("KM-Stand am Ziel muss groesser als am Start sein");
        }

        String startAddressValue = normalizeAddress(startAddress);
        String endAddressValue = normalizeAddress(endAddress);

        if (startKmStand != null) {
            start.setKmStand(startKm);
        }
        if (endKmStand != null) {
            end.setKmStand(endKm);
        }
        if (startAddress != null) {
            start.setAddress(startAddressValue);
        }
        if (endAddress != null) {
            end.setAddress(endAddressValue);
        }
        scanEntryRepository.save(start);
        scanEntryRepository.save(end);

        String from = startAddressValue != null
                ? startAddressValue
                : (start.getAddress() != null ? start.getAddress() : formatCoordinates(start.getLatitude(), start.getLongitude()));
        String to = endAddressValue != null
                ? endAddressValue
                : (end.getAddress() != null ? end.getAddress() : formatCoordinates(end.getLatitude(), end.getLongitude()));

        Reason resolvedReason = reason != null ? reason : Reason.OTHER;
        DriveCommand command = new DriveCommand(
                null,
                start.getTimestamp().toLocalDate(),
                null,
                resolvedReason,
                from,
                to,
                length
        );
        return driveService.create(command);
    }

    private ScanEntryResponse toResponse(ScanEntry entry) {
        return new ScanEntryResponse(
                entry.getId(),
                entry.getType(),
                entry.getTimestamp(),
                entry.getLatitude(),
                entry.getLongitude(),
                entry.getAddress(),
                entry.getKmStand()
        );
    }

    private String formatCoordinates(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            return "";
        }
        return String.format(Locale.US, "%.6f, %.6f", latitude, longitude);
    }

    private String normalizeAddress(String address) {
        if (address == null) return null;
        String trimmed = address.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
