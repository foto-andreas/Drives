package de.schrell.drives;

import de.schrell.drives.domain.DriveTemplate;
import de.schrell.drives.domain.Reason;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DriveTemplateControllerTest {

    @Mock
    private DriveTemplateRepository driveTemplateRepository;

    @Mock
    private DriveRepository driveRepository;

    @Captor
    private ArgumentCaptor<DriveTemplate> templateCaptor;

    private DriveTemplateController driveTemplateController;

    @BeforeEach
    void setup() {
        driveTemplateController = new DriveTemplateController(driveTemplateRepository, driveRepository);
    }

    @Test
    void getDriveTemplatesReturnsOrderedList() {
        List<DriveTemplate> templates = List.of(new DriveTemplate());
        when(driveTemplateRepository.findAllByOrderByNameAsc()).thenReturn(templates);

        assertSame(templates, driveTemplateController.getDrives());
        verify(driveTemplateRepository).findAllByOrderByNameAsc();
        verifyNoMoreInteractions(driveTemplateRepository);
    }

    @Test
    void getDriveTemplateReturnsOptional() {
        DriveTemplate template = new DriveTemplate();
        when(driveTemplateRepository.findById("99")).thenReturn(Optional.of(template));

        assertEquals(Optional.of(template), driveTemplateController.getDriveTemplate("99"));
        verify(driveTemplateRepository).findById("99");
        verifyNoMoreInteractions(driveTemplateRepository);
    }

    @Test
    void addDriveTemplateClearsId() {
        DriveTemplate template = new DriveTemplate("existing", "Test", 5, "A", "B", Reason.WORK);
        when(driveTemplateRepository.save(templateCaptor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        DriveTemplate saved = driveTemplateController.addDriveTemplate(template);

        assertNull(templateCaptor.getValue().getId());
        assertNull(saved.getId());
    }

    @Test
    void updateDriveTemplatePersists() {
        DriveTemplate template = new DriveTemplate("id", "Test", 5, "A", "B", Reason.WORK);
        when(driveTemplateRepository.save(template)).thenReturn(template);

        assertSame(template, driveTemplateController.updateDriveTemplate(template));
        verify(driveTemplateRepository).save(template);
    }

    @Test
    void deleteDriveTemplateReturnsNotFoundWhenMissing() {
        when(driveTemplateRepository.findById("missing")).thenReturn(Optional.empty());

        ResponseEntity<Void> response = driveTemplateController.deleteDriveTemplate("missing");

        assertEquals(HttpStatusCode.valueOf(404), response.getStatusCode());
        verify(driveTemplateRepository).findById("missing");
        verifyNoMoreInteractions(driveTemplateRepository, driveRepository);
    }

    @Test
    void deleteDriveTemplateReturnsConflictWhenInUse() {
        DriveTemplate template = new DriveTemplate("id", "Test", 5, "A", "B", Reason.WORK);
        when(driveTemplateRepository.findById("id")).thenReturn(Optional.of(template));
        when(driveRepository.countByTemplate(template)).thenReturn(2L);

        ResponseEntity<Void> response = driveTemplateController.deleteDriveTemplate("id");

        assertEquals(HttpStatusCode.valueOf(409), response.getStatusCode());
        verify(driveTemplateRepository).findById("id");
        verify(driveRepository).countByTemplate(template);
        verifyNoMoreInteractions(driveTemplateRepository, driveRepository);
    }

    @Test
    void deleteDriveTemplateDeletesWhenUnused() {
        DriveTemplate template = new DriveTemplate("id", "Test", 5, "A", "B", Reason.WORK);
        when(driveTemplateRepository.findById("id")).thenReturn(Optional.of(template));
        when(driveRepository.countByTemplate(template)).thenReturn(0L);

        ResponseEntity<Void> response = driveTemplateController.deleteDriveTemplate("id");

        assertEquals(HttpStatusCode.valueOf(200), response.getStatusCode());
        verify(driveTemplateRepository).findById("id");
        verify(driveRepository).countByTemplate(template);
        verify(driveTemplateRepository).deleteById("id");
    }
}