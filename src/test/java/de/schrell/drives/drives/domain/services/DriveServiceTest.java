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
        DriveResponse response = new DriveResponse("1", LocalDate.now(), null, Reason.WORK, "A", "B", 10);

        when(driveRepository.findFiltered(null, null, null)).thenReturn(List.of(drive));
        when(driveMapper.toResponse(drive)).thenReturn(response);

        List<DriveResponse> result = driveService.findAll(null, null, null);

        assertThat(result).containsExactly(response);
    }

    @Test
    void findByIdReturnsDrive() {
        Drive drive = new Drive();
        DriveResponse response = new DriveResponse("1", LocalDate.now(), null, Reason.WORK, "A", "B", 10);

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
    void findLatestDriveReturnsDrive() {
        Drive drive = new Drive();
        DriveResponse response = new DriveResponse("1", LocalDate.now(), null, Reason.WORK, "A", "B", 10);

        when(driveRepository.findLatestDrive()).thenReturn(List.of(drive));
        when(driveMapper.toResponse(drive)).thenReturn(response);

        Optional<DriveResponse> result = driveService.findLatestDrive();

        assertThat(result).contains(response);
    }

    @Test
    void findLatestDriveReturnsEmptyWhenNoDrives() {
        when(driveRepository.findLatestDrive()).thenReturn(List.of());

        Optional<DriveResponse> result = driveService.findLatestDrive();

        assertThat(result).isEmpty();
    }

    @Test
    void createThrowsExceptionWhenTemplateNotFound() {
        LocalDate date = LocalDate.now();
        DriveCommand command = new DriveCommand(null, date, "non-existent", Reason.WORK, "A", "B", 10);

        when(driveTemplateRepository.findById("non-existent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> driveService.create(command))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Drive template with id 'non-existent' not found");
    }

    @Test
    void createHandlesNullTemplateId() {
        LocalDate date = LocalDate.now();
        DriveCommand command = new DriveCommand(null, date, null, Reason.WORK, "A", "B", 10);
        Drive savedDrive = new Drive();
        
        when(driveRepository.save(any(Drive.class))).thenReturn(savedDrive);
        when(driveMapper.toResponse(savedDrive)).thenReturn(new DriveResponse("1", date, null, Reason.WORK, "A", "B", 10));

        driveService.create(command);

        verify(driveRepository).save(argThat(drive -> drive.getTemplate() == null));
    }

    @Test
    void normalizeReasonSetsReasonToNullWhenSameAsTemplate() {
        LocalDate date = LocalDate.now();
        DriveTemplate template = new DriveTemplate();
        template.setId("t1");
        template.setReason(Reason.WORK);
        template.setFromLocation("A");
        template.setToLocation("B");
        template.setDriveLength(10);

        DriveCommand command = new DriveCommand(null, date, "t1", Reason.WORK, "A", "B", 10);

        when(driveTemplateRepository.findById("t1")).thenReturn(Optional.of(template));
        when(driveRepository.save(any(Drive.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(driveMapper.toResponse(any(Drive.class))).thenReturn(new DriveResponse("1", date, null, Reason.WORK, "A", "B", 10));

        driveService.create(command);

        verify(driveRepository).save(argThat(drive -> drive.getReason() == null && drive.getFromLocation() == null));
    }

    @Test
    void normalizeReasonKeepsReasonWhenDifferentFromTemplate() {
        LocalDate date = LocalDate.now();
        DriveCommand command = new DriveCommand(null, date, "t1", Reason.PRIVATE, "C", "D", 20);
        DriveTemplate template = new DriveTemplate();
        template.setReason(Reason.WORK);
        template.setFromLocation("A");
        template.setToLocation("B");
        template.setDriveLength(10);

        when(driveTemplateRepository.findById("t1")).thenReturn(Optional.of(template));
        
        driveService.create(command);

        verify(driveRepository).save(argThat(drive -> drive.getReason() == Reason.PRIVATE && "C".equals(drive.getFromLocation())));
    }

    @Test
    void updateSavesExistingDrive() {
        LocalDate date = LocalDate.now();
        DriveCommand command = new DriveCommand("1", date, "t1", Reason.OTHER, "A", "B", 10);
        Drive existingDrive = new Drive();
        DriveTemplate template = new DriveTemplate();
        template.setReason(Reason.WORK);
        template.setFromLocation("X");

        when(driveRepository.findById("1")).thenReturn(Optional.of(existingDrive));
        when(driveTemplateRepository.findById("t1")).thenReturn(Optional.of(template));
        when(driveRepository.save(existingDrive)).thenReturn(existingDrive);
        when(driveMapper.toResponse(existingDrive)).thenReturn(new DriveResponse("1", date, null, Reason.OTHER, "A", "B", 10));

        DriveResponse result = driveService.update(command);

        assertThat(result.id()).isEqualTo("1");
        verify(driveRepository).save(existingDrive);
    }

    @Test
    void updateThrowsExceptionWhenIdMissing() {
        DriveCommand command = new DriveCommand(null, LocalDate.now(), "t1", Reason.WORK, "A", "B", 10);

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
    @Test
    void findAllWithFilterDelegatesToRepository() {
        Drive drive = new Drive();
        DriveResponse response = new DriveResponse("1", LocalDate.of(2024,5,1), null, Reason.WORK, "A", "B", 10);

        when(driveRepository.findFiltered(2024, 5, Reason.WORK)).thenReturn(List.of(drive));
        when(driveMapper.toResponse(drive)).thenReturn(response);

        List<DriveResponse> result = driveService.findAll(2024, 5, Reason.WORK);

        assertThat(result).containsExactly(response);
        verify(driveRepository).findFiltered(2024, 5, Reason.WORK);
    }

    @Test
    void findAllWithEstateFilterReturnsDrives() {
        Drive drive = new Drive();
        drive.setReason(null); // Angenommen ESTATE ist im Template
        DriveResponse response = new DriveResponse("1", LocalDate.of(2024, 5, 1), null, Reason.ESTATE, "A", "B", 10);

        when(driveRepository.findFiltered(2024, 5, Reason.ESTATE)).thenReturn(List.of(drive));
        when(driveMapper.toResponse(drive)).thenReturn(response);

        List<DriveResponse> result = driveService.findAll(2024, 5, Reason.ESTATE);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).reason()).isEqualTo(Reason.ESTATE);
    }

    @Test
    void createThrowsExceptionWhenNoTemplateAndFieldsMissing() {
        DriveCommand command = new DriveCommand(null, LocalDate.now(), null, Reason.WORK, null, null, null);

        assertThatThrownBy(() -> driveService.create(command))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("From location is required if no template is specified");
    }

    @Test
    void createThrowsExceptionWhenNoTemplateAndReasonMissing() {
        DriveCommand command = new DriveCommand(null, LocalDate.now(), null, null, "A", "B", 10);

        assertThatThrownBy(() -> driveService.create(command))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Reason is required if no template is specified");
    }

    @Test
    void createThrowsExceptionWhenNoTemplateAndToLocationMissing() {
        DriveCommand command = new DriveCommand(null, LocalDate.now(), null, Reason.WORK, "A", null, 10);

        assertThatThrownBy(() -> driveService.create(command))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("To location is required if no template is specified");
    }

    @Test
    void createThrowsExceptionWhenNoTemplateAndLengthMissing() {
        DriveCommand command = new DriveCommand(null, LocalDate.now(), null, Reason.WORK, "A", "B", null);

        assertThatThrownBy(() -> driveService.create(command))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Drive length is required if no template is specified");
    }

    @Test
    void clearRedundantFieldsWorksForLocationsAndLength() {
        LocalDate date = LocalDate.now();
        DriveTemplate template = new DriveTemplate("t1", "T1", 10, "A", "B", Reason.WORK);

        // Command with same values as template
        DriveCommand command = new DriveCommand(null, date, "t1", Reason.WORK, "A", "B", 10);

        when(driveTemplateRepository.findById("t1")).thenReturn(Optional.of(template));
        when(driveRepository.save(any(Drive.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(driveMapper.toResponse(any(Drive.class))).thenReturn(new DriveResponse("1", date, null, Reason.WORK, "A", "B", 10));

        driveService.create(command);

        verify(driveRepository).save(argThat(drive -> 
                drive.getReason() == null && 
                drive.getFromLocation() == null && 
                drive.getToLocation() == null && 
                drive.getDriveLength() == null));
    }
}
