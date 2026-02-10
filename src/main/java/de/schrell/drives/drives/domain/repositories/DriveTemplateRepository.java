package de.schrell.drives.drives.domain.repositories;

import de.schrell.drives.drives.domain.entities.DriveTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriveTemplateRepository extends JpaRepository<DriveTemplate, String> {
    @Query("select t from DriveTemplate t order by t.name asc")
    List<DriveTemplate> findAllByOrderByNameAsc();
}
