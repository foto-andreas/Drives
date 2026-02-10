package de.schrell.drives.drives.api.controllers;

import de.schrell.drives.drives.api.dtos.DriveTemplateRequest;
import de.schrell.drives.drives.api.dtos.DriveTemplateResponse;
import de.schrell.drives.drives.domain.commands.DriveTemplateCommand;
import de.schrell.drives.drives.domain.services.DriveTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin
@RequiredArgsConstructor
public class DriveTemplateController {

    private final DriveTemplateService driveTemplateService;

    @GetMapping("/driveTemplates")
    public List<DriveTemplateResponse> getDriveTemplates() {
        return driveTemplateService.findAll();
    }

    @GetMapping("/driveTemplates/{id}")
    public DriveTemplateResponse getDriveTemplate(@PathVariable String id) {
        return driveTemplateService.findById(id);
    }

    @PutMapping("/driveTemplates")
    public DriveTemplateResponse addDriveTemplate(@RequestBody DriveTemplateRequest driveTemplateRequest) {
        DriveTemplateCommand command = toCommand(driveTemplateRequest);
        return driveTemplateService.create(command);
    }

    @PostMapping("/driveTemplates")
    public DriveTemplateResponse updateDriveTemplate(@RequestBody DriveTemplateRequest driveTemplateRequest) {
        DriveTemplateCommand command = toCommand(driveTemplateRequest);
        return driveTemplateService.update(command);
    }

    @DeleteMapping("/driveTemplates/{id}")
    public ResponseEntity<Void> deleteDriveTemplate(@PathVariable String id) {
        driveTemplateService.delete(id);
        return ResponseEntity.ok().build();
    }

    private DriveTemplateCommand toCommand(DriveTemplateRequest driveTemplateRequest) {
        return new DriveTemplateCommand(
                driveTemplateRequest.id(),
                driveTemplateRequest.name(),
                driveTemplateRequest.driveLength(),
                driveTemplateRequest.fromLocation(),
                driveTemplateRequest.toLocation(),
                driveTemplateRequest.reason()
        );
    }
}
