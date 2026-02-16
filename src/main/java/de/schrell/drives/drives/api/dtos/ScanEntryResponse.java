package de.schrell.drives.drives.api.dtos;

import de.schrell.drives.drives.domain.entities.ScanType;

import java.time.OffsetDateTime;

public record ScanEntryResponse(
        String id,
        ScanType type,
        OffsetDateTime timestamp,
        Double latitude,
        Double longitude,
        String address,
        Integer kmStand
) {
}
