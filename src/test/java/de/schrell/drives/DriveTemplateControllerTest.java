package de.schrell.drives;

import de.schrell.drives.drives.api.controllers.DriveTemplateController;
import de.schrell.drives.drives.api.dtos.DriveTemplateRequest;
import de.schrell.drives.drives.api.dtos.DriveTemplateResponse;
import de.schrell.drives.drives.domain.commands.DriveTemplateCommand;
import de.schrell.drives.drives.domain.entities.Reason;
import de.schrell.drives.drives.domain.services.DriveTemplateService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DriveTemplateControllerTest {

    @Mock
    private DriveTemplateService driveTemplateService;

    @Captor
    private ArgumentCaptor<DriveTemplateCommand> templateCaptor;

    private DriveTemplateController driveTemplateController;

    @BeforeEach
    void setup() {
        driveTemplateController = new DriveTemplateController(driveTemplateService);
    }

    @Test
    void getDriveTemplatesReturnsOrderedList() {
        List<DriveTemplateResponse> templates = List.of(new DriveTemplateResponse("1", "Test", 5, "A", "B", Reason.WORK));
        when(driveTemplateService.findAll()).thenReturn(templates);

        assertSame(templates, driveTemplateController.getDriveTemplates());
        verify(driveTemplateService).findAll();
        verifyNoMoreInteractions(driveTemplateService);
    }

    @Test
    void getDriveTemplateReturnsOptional() {
        DriveTemplateResponse template = new DriveTemplateResponse("99", "Test", 5, "A", "B", Reason.WORK);
        when(driveTemplateService.findById("99")).thenReturn(template);

        assertSame(template, driveTemplateController.getDriveTemplate("99"));
        verify(driveTemplateService).findById("99");
        verifyNoMoreInteractions(driveTemplateService);
    }

    @Test
    void addDriveTemplateMapsRequestToCommand() {
        DriveTemplateRequest request = new DriveTemplateRequest(null, "Test", 5, "A", "B", Reason.WORK);
        DriveTemplateResponse response = new DriveTemplateResponse("1", "Test", 5, "A", "B", Reason.WORK);
        when(driveTemplateService.create(templateCaptor.capture())).thenReturn(response);

        DriveTemplateResponse result = driveTemplateController.addDriveTemplate(request);

        assertSame(response, result);
        assertEquals("Test", templateCaptor.getValue().name());
    }

    @Test
    void updateDriveTemplateMapsRequestToCommand() {
        DriveTemplateRequest request = new DriveTemplateRequest("id", "Test", 5, "A", "B", Reason.WORK);
        DriveTemplateResponse response = new DriveTemplateResponse("id", "Test", 5, "A", "B", Reason.WORK);
        when(driveTemplateService.update(templateCaptor.capture())).thenReturn(response);

        DriveTemplateResponse result = driveTemplateController.updateDriveTemplate(request);

        assertSame(response, result);
        assertEquals("id", templateCaptor.getValue().id());
    }

    @Test
    void deleteDriveTemplateReturnsOk() {
        ResponseEntity<Void> response = driveTemplateController.deleteDriveTemplate("id");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(driveTemplateService).delete("id");
        verifyNoMoreInteractions(driveTemplateService);
    }
}