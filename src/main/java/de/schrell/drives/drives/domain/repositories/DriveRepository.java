package de.schrell.drives.drives.domain.repositories;

import de.schrell.drives.drives.domain.entities.Drive;
import de.schrell.drives.drives.domain.entities.DriveTemplate;
import de.schrell.drives.drives.domain.entities.Reason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DriveRepository extends JpaRepository<Drive, String> {
    /**
     * Liefert gefilterte Fahrten. Wichtig: LEFT JOIN auf Template, damit Fahrten ohne Vorlage (template = null)
     * nicht aus der Ergebnisliste herausfallen. Der Grund-Filter berücksichtigt sowohl den expliziten Grund
     * an der Fahrt als auch – falls dort null – den Grund der Vorlage.
     */
    @Query("select d from Drive d order by d.date asc")
    List<Drive> findAllByOrderByDateAsc();
    long countByTemplate(DriveTemplate template);

    @Query("select max(d.date) from Drive d")
    LocalDate findLatestDate();

    @Query("select d from Drive d order by d.date desc, d.id desc")
    List<Drive> findLatestDrive();

    @Query("select d from Drive d left join d.template t " +
            "where (:year is null or YEAR(d.date) = :year) " +
            "and (:month is null or MONTH(d.date) = :month) " +
            "and (:reason is null or d.reason = :reason or (d.reason is null and t.reason = :reason)) " +
            "order by d.date asc")
    List<Drive> findFiltered(@Param("year") Integer year,
                              @Param("month") Integer month,
                              @Param("reason") Reason reason);

    @Query("select distinct YEAR(d.date) from Drive d order by YEAR(d.date) desc")
    List<Integer> findDistinctYears();
}
