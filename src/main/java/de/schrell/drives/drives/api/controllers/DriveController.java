package de.schrell.drives.drives.api.controllers;

import de.schrell.drives.drives.api.dtos.DriveRequest;
import de.schrell.drives.drives.api.dtos.DriveResponse;
import de.schrell.drives.drives.domain.commands.DriveCommand;
import de.schrell.drives.drives.domain.entities.Reason;
import de.schrell.drives.drives.domain.services.DriveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin
@RequiredArgsConstructor
public class DriveController {

    private final DriveService driveService;

    @GetMapping("/drives")
    public List<DriveResponse> getDrives(@RequestParam(required = false) Integer year,
                                         @RequestParam(required = false) Integer month,
                                         @RequestParam(required = false) Reason reason) {
        return driveService.findAll(year, month, reason);
    }

    @GetMapping("/drives/{id}")
    public DriveResponse getDrive(@PathVariable String id) {
        return driveService.findById(id);
    }

    @GetMapping("/latestDrive")
    public ResponseEntity<LocalDate> getLatestDriveDate() {
        Optional<LocalDate> latestDate = driveService.findLatestDate();
        return latestDate.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/latestDriveInfo")
    public ResponseEntity<DriveResponse> getLatestDrive() {
        return driveService.findLatestDrive()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PutMapping("/drives")
    public DriveResponse addDrive(@RequestBody @Valid DriveRequest driveRequest) {
        return driveService.create(toCommand(driveRequest));
    }

    @PostMapping("/drives")
    public DriveResponse updateDrive(@RequestBody @Valid DriveRequest driveRequest) {
        return driveService.update(toCommand(driveRequest));
    }

    @DeleteMapping("/drives/{id}")
    public ResponseEntity<Void> deleteDrive(@PathVariable String id) {
        driveService.delete(id);
        return ResponseEntity.ok().build();
    }

    private DriveCommand toCommand(DriveRequest driveRequest) {
        return new DriveCommand(
                driveRequest.id(),
                driveRequest.date(),
                driveRequest.templateId(),
                driveRequest.reason(),
                driveRequest.fromLocation(),
                driveRequest.toLocation(),
                driveRequest.driveLength()
        );
    }
}
