package de.schrell.drives.drives.domain.services;

import de.schrell.drives.drives.api.dtos.DriveTemplateResponse;
import de.schrell.drives.drives.domain.commands.DriveTemplateCommand;
import de.schrell.drives.drives.domain.entities.DriveTemplate;
import de.schrell.drives.drives.domain.entities.Reason;
import de.schrell.drives.drives.domain.exceptions.DriveTemplateInUseException;
import de.schrell.drives.drives.domain.exceptions.ResourceNotFoundException;
import de.schrell.drives.drives.domain.mappers.DriveMapper;
import de.schrell.drives.drives.domain.repositories.DriveRepository;
import de.schrell.drives.drives.domain.repositories.DriveTemplateRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DriveTemplateServiceTest {

    @Mock
    private DriveTemplateRepository driveTemplateRepository;

    @Mock
    private DriveRepository driveRepository;

    @Mock
    private DriveMapper driveMapper;

    @InjectMocks
    private DriveTemplateService driveTemplateService;

    @Test
    void findAllReturnsSortedTemplates() {
        DriveTemplate template = new DriveTemplate("1", "Work", 10, "Home", "Office", Reason.WORK);
        DriveTemplateResponse response = new DriveTemplateResponse("1", "Work", 10, "Home", "Office", Reason.WORK);

        when(driveTemplateRepository.findAllByOrderByNameAsc()).thenReturn(List.of(template));
        when(driveMapper.toTemplateResponse(template)).thenReturn(response);

        List<DriveTemplateResponse> result = driveTemplateService.findAll();

        assertThat(result).containsExactly(response);
    }

    @Test
    void findByIdReturnsTemplate() {
        DriveTemplate template = new DriveTemplate("1", "Work", 10, "Home", "Office", Reason.WORK);
        DriveTemplateResponse response = new DriveTemplateResponse("1", "Work", 10, "Home", "Office", Reason.WORK);

        when(driveTemplateRepository.findById("1")).thenReturn(Optional.of(template));
        when(driveMapper.toTemplateResponse(template)).thenReturn(response);

        DriveTemplateResponse result = driveTemplateService.findById("1");

        assertThat(result).isEqualTo(response);
    }

    @Test
    void findByIdThrowsExceptionWhenNotFound() {
        when(driveTemplateRepository.findById("1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> driveTemplateService.findById("1"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Drive template with id '1' not found");
    }

    @Test
    void createSavesTemplate() {
        DriveTemplateCommand command = new DriveTemplateCommand(null, "Work", 10, "Home", "Office", Reason.WORK);
        DriveTemplate savedTemplate = new DriveTemplate("1", "Work", 10, "Home", "Office", Reason.WORK);
        DriveTemplateResponse response = new DriveTemplateResponse("1", "Work", 10, "Home", "Office", Reason.WORK);

        when(driveTemplateRepository.save(any(DriveTemplate.class))).thenReturn(savedTemplate);
        when(driveMapper.toTemplateResponse(savedTemplate)).thenReturn(response);

        DriveTemplateResponse result = driveTemplateService.create(command);

        assertThat(result).isEqualTo(response);
        verify(driveTemplateRepository).save(any(DriveTemplate.class));
    }

    @Test
    void updateSavesExistingTemplate() {
        DriveTemplateCommand command = new DriveTemplateCommand("1", "Work Updated", 12, "Home", "Office", Reason.WORK);
        DriveTemplate existingTemplate = new DriveTemplate("1", "Work", 10, "Home", "Office", Reason.WORK);
        DriveTemplate savedTemplate = new DriveTemplate("1", "Work Updated", 12, "Home", "Office", Reason.WORK);
        DriveTemplateResponse response = new DriveTemplateResponse("1", "Work Updated", 12, "Home", "Office", Reason.WORK);

        when(driveTemplateRepository.findById("1")).thenReturn(Optional.of(existingTemplate));
        when(driveTemplateRepository.save(existingTemplate)).thenReturn(savedTemplate);
        when(driveMapper.toTemplateResponse(savedTemplate)).thenReturn(response);

        DriveTemplateResponse result = driveTemplateService.update(command);

        assertThat(result).isEqualTo(response);
        assertThat(existingTemplate.getName()).isEqualTo("Work Updated");
    }

    @Test
    void updateThrowsExceptionWhenIdMissing() {
        DriveTemplateCommand command = new DriveTemplateCommand(null, "Work", 10, "Home", "Office", Reason.WORK);

        assertThatThrownBy(() -> driveTemplateService.update(command))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void deleteRemovesTemplateWhenNotInUse() {
        DriveTemplate template = new DriveTemplate("1", "Work", 10, "Home", "Office", Reason.WORK);
        when(driveTemplateRepository.findById("1")).thenReturn(Optional.of(template));
        when(driveRepository.countByTemplate(template)).thenReturn(0L);

        driveTemplateService.delete("1");

        verify(driveTemplateRepository).delete(template);
    }

    @Test
    void deleteThrowsExceptionWhenInUse() {
        DriveTemplate template = new DriveTemplate("1", "Work", 10, "Home", "Office", Reason.WORK);
        when(driveTemplateRepository.findById("1")).thenReturn(Optional.of(template));
        when(driveRepository.countByTemplate(template)).thenReturn(5L);

        assertThatThrownBy(() -> driveTemplateService.delete("1"))
                .isInstanceOf(DriveTemplateInUseException.class);
        
        verify(driveTemplateRepository, never()).delete(any());
    }
}
