package de.schrell.drives.drives.api.dtos;

import de.schrell.drives.drives.domain.entities.Reason;

public record ScanEntryCommitRequest(
        String startId,
        String endId,
        Integer startKmStand,
        Integer endKmStand,
        String startAddress,
        String endAddress,
        Reason reason
) {
}
