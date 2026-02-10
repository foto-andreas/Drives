package de.schrell.drives.drives.api.dtos;

import de.schrell.drives.drives.domain.entities.Reason;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record DriveRequest(
        String id,
        @NotNull(message = "Date is required") LocalDate date,
        @NotNull(message = "Template is required") String templateId,
        Reason reason
) {
}