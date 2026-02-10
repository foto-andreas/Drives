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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DriveServiceTest {

    @Mock
    private DriveRepository driveRepository;

    @Mock
    private DriveTemplateRepository driveTemplateRepository;

    @Mock
    private DriveMapper driveMapper;

    @InjectMocks
    private DriveService driveService;

    @Test
    void findAllReturnsDrives() {
        Drive drive = new Drive();
        DriveResponse response = new DriveResponse("1", LocalDate.now(), null, Reason.WORK);

        when(driveRepository.findAllByOrderByDateAsc()).thenReturn(List.of(drive));
        when(driveMapper.toResponse(drive)).thenReturn(response);

        List<DriveResponse> result = driveService.findAll();

        assertThat(result).containsExactly(response);
    }

    @Test
    void findByIdReturnsDrive() {
        Drive drive = new Drive();
        DriveResponse response = new DriveResponse("1", LocalDate.now(), null, Reason.WORK);

        when(driveRepository.findById("1")).thenReturn(Optional.of(drive));
        when(driveMapper.toResponse(drive)).thenReturn(response);

        DriveResponse result = driveService.findById("1");

        assertThat(result).isEqualTo(response);
    }

    @Test
    void findByIdThrowsExceptionWhenNotFound() {
        when(driveRepository.findById("1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> driveService.findById("1"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void findLatestDateReturnsDate() {
        LocalDate now = LocalDate.now();
        when(driveRepository.findLatestDate()).thenReturn(now);

        Optional<LocalDate> result = driveService.findLatestDate();

        assertThat(result).contains(now);
    }

    @Test
    void createThrowsExceptionWhenTemplateNotFound() {
        LocalDate date = LocalDate.now();
        DriveCommand command = new DriveCommand(null, date, "non-existent", Reason.WORK);

        when(driveTemplateRepository.findById("non-existent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> driveService.create(command))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Drive template with id 'non-existent' not found");
    }

    @Test
    void createHandlesNullTemplateId() {
        LocalDate date = LocalDate.now();
        DriveCommand command = new DriveCommand(null, date, null, Reason.WORK);
        Drive savedDrive = new Drive();
        
        when(driveRepository.save(any(Drive.class))).thenReturn(savedDrive);
        when(driveMapper.toResponse(savedDrive)).thenReturn(new DriveResponse("1", date, null, Reason.WORK));

        driveService.create(command);

        verify(driveRepository).save(argThat(drive -> drive.getTemplate() == null));
    }

    @Test
    void normalizeReasonKeepsReasonWhenDifferentFromTemplate() {
        LocalDate date = LocalDate.now();
        DriveCommand command = new DriveCommand(null, date, "t1", Reason.PRIVATE);
        DriveTemplate template = new DriveTemplate();
        template.setReason(Reason.WORK);

        when(driveTemplateRepository.findById("t1")).thenReturn(Optional.of(template));
        
        driveService.create(command);

        verify(driveRepository).save(argThat(drive -> drive.getReason() == Reason.PRIVATE));
    }

    @Test
    void updateSavesExistingDrive() {
        LocalDate date = LocalDate.now();
        DriveCommand command = new DriveCommand("1", date, "t1", Reason.OTHER);
        Drive existingDrive = new Drive();
        DriveTemplate template = new DriveTemplate();

        when(driveRepository.findById("1")).thenReturn(Optional.of(existingDrive));
        when(driveTemplateRepository.findById("t1")).thenReturn(Optional.of(template));
        when(driveRepository.save(existingDrive)).thenReturn(existingDrive);
        when(driveMapper.toResponse(existingDrive)).thenReturn(new DriveResponse("1", date, null, Reason.OTHER));

        DriveResponse result = driveService.update(command);

        assertThat(result.id()).isEqualTo("1");
        verify(driveRepository).save(existingDrive);
    }

    @Test
    void updateThrowsExceptionWhenIdMissing() {
        DriveCommand command = new DriveCommand(null, LocalDate.now(), "t1", Reason.WORK);

        assertThatThrownBy(() -> driveService.update(command))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void deleteRemovesDrive() {
        when(driveRepository.existsById("1")).thenReturn(true);

        driveService.delete("1");

        verify(driveRepository).deleteById("1");
    }

    @Test
    void deleteThrowsExceptionWhenNotFound() {
        when(driveRepository.existsById("1")).thenReturn(false);

        assertThatThrownBy(() -> driveService.delete("1"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
