package de.schrell.drives.drives.api.dtos;

import de.schrell.drives.drives.domain.entities.Reason;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record DriveTemplateRequest(
        String id,
        @NotBlank(message = "Name is required") String name,
        @Min(value = 0, message = "Drive length must be at least 0") int driveLength,
        @NotEmpty(message = "From location is required") String fromLocation,
        @NotBlank(message = "To location is required") String toLocation,
        @NotNull(message = "Reason is required") Reason reason
) {
}