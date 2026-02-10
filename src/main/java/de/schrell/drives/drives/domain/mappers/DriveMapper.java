package de.schrell.drives.drives.domain.mappers;

import de.schrell.drives.drives.api.dtos.DriveResponse;
import de.schrell.drives.drives.api.dtos.DriveTemplateResponse;
import de.schrell.drives.drives.domain.entities.Drive;
import de.schrell.drives.drives.domain.entities.DriveTemplate;
import de.schrell.drives.drives.domain.entities.Reason;
import org.springframework.stereotype.Component;

@Component
public class DriveMapper {

    public DriveResponse toResponse(Drive drive) {
        if (drive == null) {
            return null;
        }
        return new DriveResponse(
                drive.getId(),
                drive.getDate(),
                toTemplateResponse(drive.getTemplate()),
                resolveReason(drive)
        );
    }

    public DriveTemplateResponse toTemplateResponse(DriveTemplate template) {
        if (template == null) {
            return null;
        }
        return new DriveTemplateResponse(
                template.getId(),
                template.getName(),
                template.getDriveLength(),
                template.getFromLocation(),
                template.getToLocation(),
                template.getReason()
        );
    }

    private Reason resolveReason(Drive drive) {
        if (drive.getReason() != null) {
            return drive.getReason();
        }
        if (drive.getTemplate() == null) {
            return null;
        }
        return drive.getTemplate().getReason();
    }
}