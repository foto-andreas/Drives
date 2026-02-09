package de.schrell.drives;

import de.schrell.drives.domain.Drive;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:4200")
public class DriveController {

    private final DriveRepository driveRepository;

    DriveController(DriveRepository driveRepository) {
        this.driveRepository = driveRepository;
    }

    @GetMapping("/api/drives")
    public List<Drive> getDrives() {
        return (List<Drive>) driveRepository.findAllByOrderByDateAsc();
    }

    @GetMapping("/api/drives/{id}")
    public Optional<Drive> getDrive(@PathVariable String id) {
        return driveRepository.findById(id);
    }

    @PutMapping("/api/drives")
    Drive addDrive(@RequestBody Drive drive) {
        // normalize
        if (drive.getReason() == drive.getTemplate().getReason()) {
            drive.setReason(null);
        }
        return driveRepository.save(drive);
    }

    @PostMapping("/api/drives")
    Drive updateDrive(@RequestBody Drive drive) {
        // normalize
        if (drive.getReason() == drive.getTemplate().getReason()) {
            drive.setReason(null);
        }
        return driveRepository.save(drive);
    }

    @DeleteMapping("/api/drives/{id}")
    ResponseEntity<Void> deleteDrive(@PathVariable String id) {
        if (driveRepository.existsById(id)) {
            driveRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
