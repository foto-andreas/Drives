package de.schrell.drives.drives.api.dtos;

import de.schrell.drives.drives.domain.entities.Reason;

public record DriveTemplateResponse(String id, String name, int driveLength, String fromLocation, String toLocation,
                                   Reason reason) {
}