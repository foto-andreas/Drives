package de.schrell.drives.drives.domain.services;

import de.schrell.drives.drives.api.dtos.DriveResponse;
import de.schrell.drives.drives.domain.commands.DriveCommand;
import de.schrell.drives.drives.domain.entities.Drive;
import de.schrell.drives.drives.domain.entities.DriveTemplate;
import de.schrell.drives.drives.domain.entities.Reason;
import de.schrell.drives.drives.domain.exceptions.ResourceNotFoundException;
import de.schrell.drives.drives.domain.mappers.DriveMapper;
import de.schrell.drives.drives.domain.repositories.DriveRepository;
import de.schrell.drives.drives.domain.repositories.DriveTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing drives.
 * Handles business logic, transaction management and coordination between repositories and mappers.
 */
@Service
@RequiredArgsConstructor
public class DriveService {

    private final DriveRepository driveRepository;
    private final DriveTemplateRepository driveTemplateRepository;
    private final DriveMapper driveMapper;

    @Transactional(readOnly = true)
    public List<DriveResponse> findAll(Integer year, Integer month, Reason reason) {
        return driveRepository.findFiltered(year, month, reason)
                .stream()
                .map(driveMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DriveResponse> findAll() {
        return findAll(null, null, null);
    }

    @Transactional(readOnly = true)
    public DriveResponse findById(String id) {
        Drive drive = driveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drive with id '%s' not found".formatted(id)));
        return driveMapper.toResponse(drive);
    }

    @Transactional(readOnly = true)
    public Optional<LocalDate> findLatestDate() {
        return Optional.ofNullable(driveRepository.findLatestDate());
    }

    @Transactional(readOnly = true)
    public Optional<DriveResponse> findLatestDrive() {
        return driveRepository.findLatestDrive().stream()
                .findFirst()
                .map(driveMapper::toResponse);
    }

    @Transactional
    public DriveResponse create(DriveCommand command) {
        Drive drive = new Drive();
        applyCommand(drive, command);
        return driveMapper.toResponse(driveRepository.save(drive));
    }

    @Transactional
    public DriveResponse update(DriveCommand command) {
        if (command.id() == null) {
            throw new IllegalArgumentException("Drive id must be provided for updates");
        }
        Drive drive = driveRepository.findById(command.id())
                .orElseThrow(() -> new ResourceNotFoundException("Drive with id '%s' not found".formatted(command.id())));
        applyCommand(drive, command);
        return driveMapper.toResponse(driveRepository.save(drive));
    }

    @Transactional
    public void delete(String id) {
        if (!driveRepository.existsById(id)) {
            throw new ResourceNotFoundException("Drive with id '%s' not found".formatted(id));
        }
        driveRepository.deleteById(id);
    }

    private void applyCommand(Drive drive, DriveCommand command) {
        drive.setDate(command.date());
        drive.setReason(command.reason());
        drive.setTemplate(resolveTemplate(command.templateId()));
        drive.setFromLocation(command.fromLocation());
        drive.setToLocation(command.toLocation());
        drive.setDriveLength(command.driveLength());

        // Validate that either a template is present or all required fields are provided
        validateDrive(drive);

        if (drive.getTemplate() != null) {
            // If a template is present, we clear fields that are identical to the template
            // to keep the database clean and avoid redundancy.
            clearRedundantFields(drive);
        }
    }

    /**
     * Validates the drive state.
     * If no template is assigned, reason, locations and length must be provided.
     */
    private void validateDrive(Drive drive) {
        if (drive.getTemplate() == null) {
            if (drive.getReason() == null) {
                throw new IllegalArgumentException("Reason is required if no template is specified");
            }
            if (drive.getFromLocation() == null || drive.getFromLocation().isBlank()) {
                throw new IllegalArgumentException("From location is required if no template is specified");
            }
            if (drive.getToLocation() == null || drive.getToLocation().isBlank()) {
                throw new IllegalArgumentException("To location is required if no template is specified");
            }
            if (drive.getDriveLength() == null) {
                throw new IllegalArgumentException("Drive length is required if no template is specified");
            }
        }
    }

    /**
     * Clears fields that are identical to the template values.
     * This ensures that we only store overrides in the drive record.
     */
    private void clearRedundantFields(Drive drive) {
        DriveTemplate template = drive.getTemplate();
        if (template != null) {
            if (drive.getReason() != null && drive.getReason() == template.getReason()) {
                drive.setReason(null);
            }
            if (drive.getFromLocation() != null && drive.getFromLocation().equals(template.getFromLocation())) {
                drive.setFromLocation(null);
            }
            if (drive.getToLocation() != null && drive.getToLocation().equals(template.getToLocation())) {
                drive.setToLocation(null);
            }
            if (drive.getDriveLength() != null && drive.getDriveLength().equals(template.getDriveLength())) {
                drive.setDriveLength(null);
            }
        }
    }

    private DriveTemplate resolveTemplate(String templateId) {
        if (templateId == null || templateId.isBlank()) {
            return null;
        }
        return driveTemplateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Drive template with id '%s' not found".formatted(templateId)));
    }
}