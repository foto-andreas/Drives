package de.schrell.drives.drives.api.controllers;

import de.schrell.drives.drives.api.dtos.DriveResponse;
import de.schrell.drives.drives.api.dtos.ScanEntryCommitRequest;
import de.schrell.drives.drives.api.dtos.ScanEntryResponse;
import de.schrell.drives.drives.domain.entities.ScanType;
import de.schrell.drives.drives.domain.services.ScanEntryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;

@RestController
@RequestMapping("/api")
@CrossOrigin
@RequiredArgsConstructor
public class ScanEntryController {

    private final ScanEntryService scanEntryService;

    @PostMapping(value = "/scan-entries", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ScanEntryResponse createScanEntry(@RequestParam ScanType type,
                                             @RequestParam String timestamp,
                                             @RequestParam double latitude,
                                             @RequestParam double longitude,
                                             @RequestPart("photo") MultipartFile photo) {
        return scanEntryService.create(type, parseTimestamp(timestamp), latitude, longitude, photo);
    }

    @GetMapping("/scan-entries/latest-start")
    public ResponseEntity<ScanEntryResponse> getLatestStartIfLatest() {
        return scanEntryService.findLatestStartIfLatest()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/scan-entries/commit")
    public DriveResponse commitDrive(@RequestBody ScanEntryCommitRequest request) {
        return scanEntryService.commitDrive(
                request.startId(),
                request.endId(),
                request.startKmStand(),
                request.endKmStand(),
                request.startAddress(),
                request.endAddress()
        );
    }

    private OffsetDateTime parseTimestamp(String timestamp) {
        try {
            return OffsetDateTime.parse(timestamp);
        } catch (DateTimeParseException ex) {
            try {
                return OffsetDateTime.parse(timestamp + "Z");
            } catch (DateTimeParseException ignored) {
                throw new IllegalArgumentException("Timestamp hat kein gueltiges ISO-Format");
            }
        }
    }
}
