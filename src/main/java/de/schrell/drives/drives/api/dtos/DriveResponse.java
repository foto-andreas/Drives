package de.schrell.drives.drives.api.dtos;

import de.schrell.drives.drives.domain.entities.Reason;

import java.time.LocalDate;

public record DriveResponse(
        String id,
        LocalDate date,
        DriveTemplateResponse template,
        Reason reason,
        String fromLocation,
        String toLocation,
        Integer driveLength
) {
}