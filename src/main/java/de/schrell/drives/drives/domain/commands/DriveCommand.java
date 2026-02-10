package de.schrell.drives.drives.domain.commands;

import de.schrell.drives.drives.domain.entities.Reason;

import java.time.LocalDate;

public record DriveCommand(String id, LocalDate date, String templateId, Reason reason) {
}