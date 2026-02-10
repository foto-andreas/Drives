package de.schrell.drives.drives.api.dtos;

import de.schrell.drives.drives.domain.entities.Reason;

import java.time.LocalDate;

public record DriveRequest(String id, LocalDate date, String templateId, Reason reason) {
}