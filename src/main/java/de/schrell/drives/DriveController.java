package de.schrell.drives;

import de.schrell.drives.domain.Drive;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
public class DriveController {

    private final DriveRepository driveRepository;

    DriveController(DriveRepository driveRepository) {
        this.driveRepository = driveRepository;
    }

    @CrossOrigin
    @GetMapping("/api/drives")
    public List<Drive> getDrives() {
        return (List<Drive>) driveRepository.findAllByOrderByDateAsc();
    }

    @CrossOrigin
    @GetMapping("/api/drives/{id}")
    public Optional<Drive> getDrive(@PathVariable String id) {
        return driveRepository.findById(id);
    }

    @CrossOrigin
    @GetMapping("/api/latestDrive")
    public ResponseEntity<LocalDate> getLatestDriveDate() {
        LocalDate latestDate = driveRepository.findLatestDate();
        if (latestDate == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(latestDate);
    }

    @CrossOrigin
    @PutMapping("/api/drives")
    Drive addDrive(@RequestBody Drive drive) {
        // normalize
        if (drive.getTemplate() != null && drive.getReason() == drive.getTemplate().getReason()) {
            drive.setReason(null);
        }
        return driveRepository.save(drive);
    }

    @CrossOrigin
    @PostMapping("/api/drives")
    Drive updateDrive(@RequestBody Drive drive) {
        // normalize
        if (drive.getTemplate() != null && drive.getReason() == drive.getTemplate().getReason()) {
            drive.setReason(null);
        }
        return driveRepository.save(drive);
    }

    @CrossOrigin
    @DeleteMapping("/api/drives/{id}")
    ResponseEntity<Void> deleteDrive(@PathVariable String id) {
        if (driveRepository.existsById(id)) {
            driveRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
