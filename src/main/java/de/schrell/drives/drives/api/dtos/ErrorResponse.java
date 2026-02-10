package de.schrell.drives.drives.api.dtos;

import java.time.OffsetDateTime;

public record ErrorResponse(int status, String message, String path, OffsetDateTime timestamp) {
}