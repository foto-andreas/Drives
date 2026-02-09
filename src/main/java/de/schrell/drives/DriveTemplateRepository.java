package de.schrell.drives;

import de.schrell.drives.domain.DriveTemplate;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriveTemplateRepository extends CrudRepository<DriveTemplate, String> {
    public List<DriveTemplate>  findAllByOrderByNameAsc();
}
