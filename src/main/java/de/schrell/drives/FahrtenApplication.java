package de.schrell.drives;

import de.schrell.drives.domain.Drive;
import de.schrell.drives.domain.DriveTemplate;
import de.schrell.drives.domain.Reason;
import org.apache.catalina.User;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.stream.Stream;

@SpringBootApplication
public class FahrtenApplication {

	public static void main(String[] args) {
		SpringApplication.run(FahrtenApplication.class, args);
	}

	@Bean
	CommandLineRunner init(DriveTemplateRepository driveTemplatRepository, DriveRepository driveRepository) {
		return args -> {

			driveRepository.deleteAll();
			driveTemplatRepository.deleteAll();

			DriveTemplate t1 = driveTemplatRepository.save(
					new DriveTemplate(null, "WK -> BP", 206, "Wermelskirchen", "Bad Pyrmont", Reason.ESTATE));

			DriveTemplate t2 = driveTemplatRepository.save(
					new DriveTemplate(null, "BP -> WK", 206, "Bad Pyrmont", "Wermelskirchen", Reason.ESTATE));

			driveTemplatRepository.findAll().forEach(System.out::println);

			driveRepository.save(new Drive(null, t1, LocalDate.now(), null));
			driveRepository.save(new Drive(null, t2, LocalDate.now().minusDays(1), null));

			driveRepository.findAll().forEach(System.out::println);
		};
	}
}
