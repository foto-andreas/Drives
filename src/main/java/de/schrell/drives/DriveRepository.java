package de.schrell.drives;

import de.schrell.drives.domain.Drive;
import de.schrell.drives.domain.DriveTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriveRepository extends JpaRepository<Drive, String> {
    public List<Drive> findAllByOrderByDateAsc();
    long countByTemplate(DriveTemplate template);
}
