package de.schrell.drives.drives.domain.services;

import de.schrell.drives.drives.api.dtos.DriveTemplateResponse;
import de.schrell.drives.drives.domain.commands.DriveTemplateCommand;
import de.schrell.drives.drives.domain.entities.DriveTemplate;
import de.schrell.drives.drives.domain.exceptions.DriveTemplateInUseException;
import de.schrell.drives.drives.domain.exceptions.ResourceNotFoundException;
import de.schrell.drives.drives.domain.mappers.DriveMapper;
import de.schrell.drives.drives.domain.repositories.DriveRepository;
import de.schrell.drives.drives.domain.repositories.DriveTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for managing drive templates.
 * Ensures templates are not deleted if they are still in use by drives.
 */
@Service
@RequiredArgsConstructor
public class DriveTemplateService {

    private final DriveTemplateRepository driveTemplateRepository;
    private final DriveRepository driveRepository;
    private final DriveMapper driveMapper;

    @Transactional(readOnly = true)
    public List<DriveTemplateResponse> findAll() {
        return driveTemplateRepository.findAllByOrderByNameAsc()
                .stream()
                .map(driveMapper::toTemplateResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DriveTemplateResponse findById(String id) {
        DriveTemplate template = driveTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drive template with id '%s' not found".formatted(id)));
        return driveMapper.toTemplateResponse(template);
    }

    @Transactional
    public DriveTemplateResponse create(DriveTemplateCommand command) {
        DriveTemplate template = new DriveTemplate();
        applyCommand(template, command);
        return driveMapper.toTemplateResponse(driveTemplateRepository.save(template));
    }

    @Transactional
    public DriveTemplateResponse update(DriveTemplateCommand command) {
        if (command.id() == null) {
            throw new IllegalArgumentException("Drive template id must be provided for updates");
        }
        DriveTemplate template = driveTemplateRepository.findById(command.id())
                .orElseThrow(() -> new ResourceNotFoundException("Drive template with id '%s' not found".formatted(command.id())));
        applyCommand(template, command);
        return driveMapper.toTemplateResponse(driveTemplateRepository.save(template));
    }

    @Transactional
    public void delete(String id) {
        DriveTemplate template = driveTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drive template with id '%s' not found".formatted(id)));
        long usageCount = driveRepository.countByTemplate(template);
        if (usageCount > 0) {
            throw new DriveTemplateInUseException("Drive template '%s' is referenced by %d drives".formatted(id, usageCount));
        }
        driveTemplateRepository.delete(template);
    }

    private void applyCommand(DriveTemplate template, DriveTemplateCommand command) {
        template.setName(command.name());
        template.setDriveLength(command.driveLength());
        template.setFromLocation(command.fromLocation());
        template.setToLocation(command.toLocation());
        template.setReason(command.reason());
    }
}