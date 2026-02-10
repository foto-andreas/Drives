package de.schrell.drives.drives.domain.commands;

import de.schrell.drives.drives.domain.entities.Reason;

public record DriveTemplateCommand(String id, String name, int driveLength, String fromLocation, String toLocation,
                                  Reason reason) {
}