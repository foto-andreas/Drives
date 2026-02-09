package de.schrell.drives;

import de.schrell.drives.domain.DriveTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:4200")
public class DriveTemplateController {

    private final DriveTemplateRepository driveTemplateRepository;
    private final DriveRepository driveRepository;

    DriveTemplateController(DriveTemplateRepository driveTemplateRepository, DriveRepository driveRepository) {
        this.driveTemplateRepository = driveTemplateRepository;
        this.driveRepository = driveRepository;
    }

    @GetMapping("/api/driveTemplates")
    public List<DriveTemplate> getDrives() {
        return (List<DriveTemplate>) driveTemplateRepository.findAllByOrderByNameAsc();
    }

    @GetMapping("/api/driveTemplates/{id}")
    public Optional<DriveTemplate> getDriveTemplate(@PathVariable String id) {
        return driveTemplateRepository.findById(id);
    }

    @PutMapping("/api/driveTemplates")
    DriveTemplate addDriveTemplate(@RequestBody DriveTemplate driveTemplate) {
        driveTemplate.setId(null);
        return driveTemplateRepository.save(driveTemplate);
    }

    @PostMapping("/api/driveTemplates")
    DriveTemplate updateDriveTemplate(@RequestBody DriveTemplate driveTemplate) {
        return driveTemplateRepository.save(driveTemplate);
    }

    @DeleteMapping("/api/driveTemplates/{id}")
    ResponseEntity<Void> deleteDriveTemplate(@PathVariable String id) {
        Optional<DriveTemplate> template = driveTemplateRepository.findById(id);
        if (template.isPresent()) {
            if (driveRepository.countByTemplate(template.get()) == 0) {
                driveTemplateRepository.deleteById(id);
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.status(409).build();
            }
        }
        return ResponseEntity.notFound().build();
    }
}
