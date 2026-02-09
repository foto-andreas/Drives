package de.schrell.drives;

import de.schrell.drives.domain.DriveTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriveTemplateRepository extends JpaRepository<DriveTemplate, String> {
    public List<DriveTemplate>  findAllByOrderByNameAsc();
}
