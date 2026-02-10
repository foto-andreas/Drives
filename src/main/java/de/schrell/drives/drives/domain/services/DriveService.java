package de.schrell.drives.drives.domain.services;

import de.schrell.drives.drives.api.dtos.DriveResponse;
import de.schrell.drives.drives.domain.commands.DriveCommand;
import de.schrell.drives.drives.domain.entities.Drive;
import de.schrell.drives.drives.domain.entities.DriveTemplate;
import de.schrell.drives.drives.domain.exceptions.ResourceNotFoundException;
import de.schrell.drives.drives.domain.mappers.DriveMapper;
import de.schrell.drives.drives.domain.repositories.DriveRepository;
import de.schrell.drives.drives.domain.repositories.DriveTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DriveService {

    private final DriveRepository driveRepository;
    private final DriveTemplateRepository driveTemplateRepository;
    private final DriveMapper driveMapper;

    public List<DriveResponse> findAll() {
        return driveRepository.findAllByOrderByDateAsc()
                .stream()
                .map(driveMapper::toResponse)
                .toList();
    }

    public DriveResponse findById(String id) {
        Drive drive = driveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drive with id '%s' not found".formatted(id)));
        return driveMapper.toResponse(drive);
    }

    public Optional<LocalDate> findLatestDate() {
        return Optional.ofNullable(driveRepository.findLatestDate());
    }

    public DriveResponse create(DriveCommand command) {
        Drive drive = new Drive();
        applyCommand(drive, command);
        return driveMapper.toResponse(driveRepository.save(drive));
    }

    public DriveResponse update(DriveCommand command) {
        if (command.id() == null) {
            throw new IllegalArgumentException("Drive id must be provided for updates");
        }
        Drive drive = driveRepository.findById(command.id())
                .orElseThrow(() -> new ResourceNotFoundException("Drive with id '%s' not found".formatted(command.id())));
        applyCommand(drive, command);
        return driveMapper.toResponse(driveRepository.save(drive));
    }

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
        normalizeReason(drive);
    }

    private DriveTemplate resolveTemplate(String templateId) {
        if (templateId == null) {
            return null;
        }
        return driveTemplateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Drive template with id '%s' not found".formatted(templateId)));
    }

    private void normalizeReason(Drive drive) {
        if (drive.getTemplate() != null && drive.getReason() == drive.getTemplate().getReason()) {
            drive.setReason(null);
        }
    }
}