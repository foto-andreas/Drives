package de.schrell.drives.drives.domain.exceptions;

public class DriveTemplateInUseException extends RuntimeException {
    public DriveTemplateInUseException(String message) {
        super(message);
    }
}