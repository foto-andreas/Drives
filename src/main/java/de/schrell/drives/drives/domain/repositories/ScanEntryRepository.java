package de.schrell.drives.drives.domain.repositories;

import de.schrell.drives.drives.domain.entities.ScanEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ScanEntryRepository extends JpaRepository<ScanEntry, String> {
    Optional<ScanEntry> findTopByOrderByTimestampDesc();
}
