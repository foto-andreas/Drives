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
    @Query("select d from Drive d order by d.date asc")
    List<Drive> findAllByOrderByDateAsc();
    long countByTemplate(DriveTemplate template);

    @Query("select max(d.date) from Drive d")
    LocalDate findLatestDate();

    @Query("select d from Drive d left join d.template t " +
            "where (:year is null or YEAR(d.date) = :year) " +
            "and (:month is null or MONTH(d.date) = :month) " +
            "and (:reason is null or d.reason = :reason or (d.reason is null and t.reason = :reason)) " +
            "order by d.date asc")
    List<Drive> findFiltered(@Param("year") Integer year,
                              @Param("month") Integer month,
                              @Param("reason") Reason reason);
}
