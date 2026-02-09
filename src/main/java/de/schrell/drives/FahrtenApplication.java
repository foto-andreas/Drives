package de.schrell.drives;

import de.schrell.drives.domain.Drive;
import de.schrell.drives.domain.DriveTemplate;
import de.schrell.drives.domain.Reason;
import org.apache.catalina.User;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

@SpringBootApplication
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
					System.out.println("Dropping check constraint " + constraintName + " from table " + tableName);
					jdbcTemplate.execute("ALTER TABLE " + tableName + " DROP CONSTRAINT " + constraintName);
				}
			} catch (Exception e) {
				System.err.println("Could not drop check constraints: " + e.getMessage());
			}

			//driveRepository.deleteAll();
			//driveTemplatRepository.deleteAll();

			//DriveTemplate t1 = driveTemplatRepository.save(
			//		new DriveTemplate(null, "WK -> BP", 206, "Wermelskirchen", "Bad Pyrmont", Reason.ESTATE));

			//DriveTemplate t2 = driveTemplatRepository.save(
			//		new DriveTemplate(null, "BP -> WK", 206, "Bad Pyrmont", "Wermelskirchen", Reason.ESTATE));

			//driveTemplatRepository.findAll().forEach(System.out::println);

			//driveRepository.save(new Drive(null, t1, LocalDate.now(), null));
			//driveRepository.save(new Drive(null, t2, LocalDate.now().minusDays(1), null));

			//driveRepository.findAll().forEach(System.out::println);
		};
	}
}
