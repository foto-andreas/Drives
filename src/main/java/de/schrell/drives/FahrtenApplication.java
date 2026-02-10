package de.schrell.drives;

import de.schrell.drives.drives.domain.repositories.DriveRepository;
import de.schrell.drives.drives.domain.repositories.DriveTemplateRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

@SpringBootApplication
@Slf4j
public class FahrtenApplication {

	public static void main(String[] args) {
		SpringApplication.run(FahrtenApplication.class, args);
	}

	@Bean
	CommandLineRunner init(DriveTemplateRepository driveTemplatRepository, DriveRepository driveRepository, JdbcTemplate jdbcTemplate) {
		return args -> {
			// Drop all CHECK constraints to allow new Enum values and 0km length
			try {
				List<Map<String, Object>> constraints = jdbcTemplate.queryForList(
						"SELECT TABLE_NAME, CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_TYPE = 'CHECK'"
				);
				for (Map<String, Object> c : constraints) {
					String tableName = (String) c.get("TABLE_NAME");
					String constraintName = (String) c.get("CONSTRAINT_NAME");
                    log.info("Dropping check constraint {} from table {}", constraintName, tableName);
                    jdbcTemplate.execute("ALTER TABLE " + tableName + " DROP CONSTRAINT " + constraintName);
                }
            } catch (Exception e) {
                log.warn("Could not drop check constraints", e);
            }
        };
    }
}
