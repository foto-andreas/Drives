package de.schrell.drives.drives.api.dtos;

public record ScanEntryCommitRequest(
        String startId,
        String endId,
        Integer startKmStand,
        Integer endKmStand,
        String startAddress,
        String endAddress
) {
}
