package de.schrell.drives;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FahrtenApplicationInitTest {

    @Mock
    private DriveTemplateRepository driveTemplateRepository;

    @Mock
    private DriveRepository driveRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Test
    void dropsCheckConstraintsOnStartup() throws Exception {
        when(jdbcTemplate.queryForList(
                "SELECT TABLE_NAME, CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_TYPE = 'CHECK'"
        )).thenReturn(List.of(
                Map.of("TABLE_NAME", "DRIVE_TEMPLATE", "CONSTRAINT_NAME", "CONSTRAINT_1"),
                Map.of("TABLE_NAME", "DRIVE", "CONSTRAINT_NAME", "CONSTRAINT_2")
        ));

        CommandLineRunner runner = new FahrtenApplication().init(driveTemplateRepository, driveRepository, jdbcTemplate);
        runner.run();

        verify(jdbcTemplate).execute("ALTER TABLE DRIVE_TEMPLATE DROP CONSTRAINT CONSTRAINT_1");
        verify(jdbcTemplate).execute("ALTER TABLE DRIVE DROP CONSTRAINT CONSTRAINT_2");
    }

    @Test
    void ignoresExceptionsWhenDroppingConstraints() {
        when(jdbcTemplate.queryForList(
                "SELECT TABLE_NAME, CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_TYPE = 'CHECK'"
        )).thenThrow(new RuntimeException("boom"));

        CommandLineRunner runner = new FahrtenApplication().init(driveTemplateRepository, driveRepository, jdbcTemplate);

        assertDoesNotThrow(() -> runner.run());
        verifyNoInteractions(driveRepository, driveTemplateRepository);
    }
}