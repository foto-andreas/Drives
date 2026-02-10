package de.schrell.drives.drives.domain.repositories;

import de.schrell.drives.drives.domain.entities.Drive;
import de.schrell.drives.drives.domain.entities.DriveTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DriveRepository extends JpaRepository<Drive, String> {
    @Query("select d from Drive d order by d.date asc")
    List<Drive> findAllByOrderByDateAsc();
    long countByTemplate(DriveTemplate template);

    @Query("select max(d.date) from Drive d")
    LocalDate findLatestDate();
}
